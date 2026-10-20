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

// TestHubSlowClientIsDroppedWithoutPanic 慢客户端（Send 缓冲满）应被摘除，
// 而不是在持读锁时 delete/close（那会触发 map 竞态与重复关闭）。
func TestHubSlowClientIsDroppedWithoutPanic(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.RefreshToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	hub := NewWebSocketHub(NewService(NewRepository(db)), cfg)
	go hub.Run()

	userID := uuid.New()
	client := &Client{
		ID:     uuid.New(),
		UserID: userID,
		Send:   make(chan WSMessage, 1), // 极小缓冲：第二次投递必然满
		Hub:    hub,
	}
	hub.register <- client
	require.Eventually(t, func() bool { return hub.IsUserOnline(userID) }, 2*time.Second, 10*time.Millisecond)

	msg := WSMessage{Type: WSMessageTypePing, ConvID: uuid.Nil}

	// 反复广播：缓冲满后客户端应被摘除，期间不能 panic
	done := make(chan struct{})
	go func() {
		defer close(done)
		for i := 0; i < 50; i++ {
			hub.broadcastToAll(msg)
			hub.deliverToUser(userID, msg)
		}
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("广播阻塞：慢客户端摘除逻辑有问题")
	}

	// 最终该用户应离线（连接被摘除）
	assert.Eventually(t, func() bool { return !hub.IsUserOnline(userID) }, 2*time.Second, 20*time.Millisecond)
}
