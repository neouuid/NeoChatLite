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

// TestGetOfflineMessages 验证离线消息补拉：
//   - 只返回 since 之后的消息
//   - 只返回用户所在会话的消息（不越权）
func TestGetOfflineMessages(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.RefreshToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	sender := &user.User{ID: uuid.New(), Username: "sender", Email: "sender@example.com", Phone: "13000000001", Password: "x"}
	receiver := &user.User{ID: uuid.New(), Username: "receiver", Email: "receiver@example.com", Phone: "13000000002", Password: "x"}
	outsider := &user.User{ID: uuid.New(), Username: "outsider", Email: "outsider@example.com", Phone: "13000000003", Password: "x"}
	require.NoError(t, db.Create(sender).Error)
	require.NoError(t, db.Create(receiver).Error)
	require.NoError(t, db.Create(outsider).Error)

	repo := NewRepository(db)
	service := NewService(repo)

	conv := &Conversation{ID: uuid.New(), Type: ConversationTypeSingle, CreatedBy: sender.ID}
	require.NoError(t, repo.CreateConversation(conv))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: sender.ID}))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: receiver.ID}))

	since := time.Now().Add(-time.Hour)

	// 窗口外（早于 since）
	oldMsg := &Message{
		ID: uuid.New(), ConversationID: conv.ID, SenderID: sender.ID,
		Type: MessageTypeText, Content: "before-window",
		CreatedAt: since.Add(-30 * time.Minute), UpdatedAt: since.Add(-30 * time.Minute),
	}
	// 窗口内
	newMsg := &Message{
		ID: uuid.New(), ConversationID: conv.ID, SenderID: sender.ID,
		Type: MessageTypeText, Content: "inside-window",
		CreatedAt: since.Add(10 * time.Minute), UpdatedAt: since.Add(10 * time.Minute),
	}
	require.NoError(t, repo.CreateMessage(oldMsg))
	require.NoError(t, repo.CreateMessage(newMsg))

	msgs, err := service.GetOfflineMessages(receiver.ID, since, 100)
	require.NoError(t, err)
	require.Len(t, msgs, 1, "只应返回 since 之后的消息")
	assert.Equal(t, newMsg.ID, msgs[0].ID)
	assert.Equal(t, "inside-window", msgs[0].Content)

	// 非会话成员拿不到任何消息
	outsiderMsgs, err := service.GetOfflineMessages(outsider.ID, since, 100)
	require.NoError(t, err)
	assert.Empty(t, outsiderMsgs, "非成员不应拿到会话消息")

	// limit 生效
	limited, err := service.GetOfflineMessages(receiver.ID, since, 1)
	require.NoError(t, err)
	assert.Len(t, limited, 1)
}
