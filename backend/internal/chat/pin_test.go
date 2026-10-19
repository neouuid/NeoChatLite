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

// TestSetConversationPinned 置顶后会话排在列表最前，取消后恢复
func TestSetConversationPinned(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.RefreshToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	alice := &user.User{ID: uuid.New(), Username: "pin_alice", Email: "pa@example.com", Phone: "13000009501"}
	bob := &user.User{ID: uuid.New(), Username: "pin_bob", Email: "pb@example.com", Phone: "13000009502"}
	carol := &user.User{ID: uuid.New(), Username: "pin_carol", Email: "pc@example.com", Phone: "13000009503"}
	require.NoError(t, db.Create(alice).Error)
	require.NoError(t, db.Create(bob).Error)
	require.NoError(t, db.Create(carol).Error)

	repo := NewRepository(db)
	service := NewService(repo)

	convB, err := service.CreateSingleConversation(alice.ID, bob.ID)
	require.NoError(t, err)
	convC, err := service.CreateSingleConversation(alice.ID, carol.ID)
	require.NoError(t, err)

	// 默认按 updated_at，C 在前（后创建）
	convs, err := service.GetUserConversations(alice.ID)
	require.NoError(t, err)
	require.Len(t, convs, 2)
	assert.Equal(t, convC.ID, convs[0].ID)

	// 置顶 B 的会话
	require.NoError(t, service.SetConversationPinned(convB.ID, alice.ID, true))
	convs, err = service.GetUserConversations(alice.ID)
	require.NoError(t, err)
	assert.Equal(t, convB.ID, convs[0].ID, "置顶会话应排在最前")

	// 取消置顶后恢复原顺序
	require.NoError(t, service.SetConversationPinned(convB.ID, alice.ID, false))
	convs, err = service.GetUserConversations(alice.ID)
	require.NoError(t, err)
	assert.Equal(t, convC.ID, convs[0].ID)

	// 非成员不能置顶
	assert.Error(t, service.SetConversationPinned(convB.ID, carol.ID, true))
}
