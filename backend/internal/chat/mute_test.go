package chat

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/test"
)

// TestSetConversationMuted 免打扰状态应当只影响当前用户
func TestSetConversationMuted(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	alice := &user.User{ID: uuid.New(), Username: "mute_alice", Email: "ma@example.com", Phone: "13000009201", Password: "x"}
	bob := &user.User{ID: uuid.New(), Username: "mute_bob", Email: "mb@example.com", Phone: "13000009202", Password: "x"}
	require.NoError(t, db.Create(alice).Error)
	require.NoError(t, db.Create(bob).Error)

	repo := NewRepository(db)
	service := NewService(repo)

	conv := &Conversation{ID: uuid.New(), Type: ConversationTypeSingle, CreatedBy: alice.ID}
	require.NoError(t, repo.CreateConversation(conv))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: alice.ID}))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: bob.ID}))

	// 开启免打扰
	require.NoError(t, service.SetConversationMuted(conv.ID, bob.ID, true))
	member, err := repo.GetConversationMember(conv.ID, bob.ID)
	require.NoError(t, err)
	assert.True(t, member.Muted, "B 的会话应处于免打扰状态")

	// 只影响 B，不影响 A
	other, err := repo.GetConversationMember(conv.ID, alice.ID)
	require.NoError(t, err)
	assert.False(t, other.Muted, "A 不应被影响")

	// 关闭免打扰
	require.NoError(t, service.SetConversationMuted(conv.ID, bob.ID, false))
	member, err = repo.GetConversationMember(conv.ID, bob.ID)
	require.NoError(t, err)
	assert.False(t, member.Muted)

	// 非成员不能设置
	carol := &user.User{ID: uuid.New(), Username: "mute_carol", Email: "mc@example.com", Phone: "13000009203", Password: "x"}
	require.NoError(t, db.Create(carol).Error)
	assert.Error(t, service.SetConversationMuted(conv.ID, carol.ID, true))
}
