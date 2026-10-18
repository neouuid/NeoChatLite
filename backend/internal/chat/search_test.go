package chat

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/test"
)

// TestSearchMessages 回归测试：
//   - 之前用 PostgreSQL 专有的 ILIKE，SQLite 下直接 500
//   - 之前 Preload("Conversation") 引用了不存在的关联，任何数据库都会 500
//
// 这里同时验证「能搜到」「大小写不敏感」「非成员搜不到」。
func TestSearchMessages(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	alice := &user.User{ID: uuid.New(), Username: "search_alice", Email: "sa@example.com", Phone: "13000009001", Password: "x"}
	bob := &user.User{ID: uuid.New(), Username: "search_bob", Email: "sb@example.com", Phone: "13000009002", Password: "x"}
	carol := &user.User{ID: uuid.New(), Username: "search_carol", Email: "sc@example.com", Phone: "13000009003", Password: "x"}
	require.NoError(t, db.Create(alice).Error)
	require.NoError(t, db.Create(bob).Error)
	require.NoError(t, db.Create(carol).Error)

	repo := NewRepository(db)

	conv := &Conversation{ID: uuid.New(), Type: ConversationTypeSingle, CreatedBy: alice.ID}
	require.NoError(t, repo.CreateConversation(conv))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: alice.ID}))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: bob.ID}))

	now := time.Now()
	require.NoError(t, repo.CreateMessage(&Message{
		ID: uuid.New(), ConversationID: conv.ID, SenderID: bob.ID, Type: MessageTypeText,
		Content: "Hello Search World", CreatedAt: now, UpdatedAt: now,
	}))
	require.NoError(t, repo.CreateMessage(&Message{
		ID: uuid.New(), ConversationID: conv.ID, SenderID: bob.ID, Type: MessageTypeText,
		Content: "unrelated content", CreatedAt: now.Add(time.Second), UpdatedAt: now.Add(time.Second),
	}))

	// 1) 能搜到
	msgs, err := repo.SearchMessages(alice.ID, "Search", 10)
	require.NoError(t, err, "搜索不应该报错")
	require.Len(t, msgs, 1)
	assert.Contains(t, msgs[0].Content, "Hello Search World")

	// 2) 大小写不敏感（LOWER 生效）
	msgs, err = repo.SearchMessages(alice.ID, "hello", 10)
	require.NoError(t, err)
	assert.Len(t, msgs, 1)

	// 3) 非会话成员搜不到
	msgs, err = repo.SearchMessages(carol.ID, "Search", 10)
	require.NoError(t, err)
	assert.Empty(t, msgs)
}
