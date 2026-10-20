package chat

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/test"
)

// newTimeoutHub 建一个 hub，超时参数缩短到毫秒级，便于在测试里观察行为
func newTimeoutHub(t *testing.T, pongWait, pingPeriod time.Duration) (*WebSocketHub, *Service) {
	t.Helper()
	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.RefreshToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	t.Cleanup(func() { test.CleanupTestDatabase(t) })

	repo := NewRepository(db)
	svc := NewService(repo)
	hub := NewWebSocketHub(svc, cfg)
	hub.pongWait = pongWait
	hub.pingPeriod = pingPeriod
	go hub.Run()
	return hub, svc
}

// TestWebSocketDropsSilentClient 不回应 ping 的连接应在 pongWait 后被服务端断开
func TestWebSocketDropsSilentClient(t *testing.T) {
	test.SkipIntegrationTests(t)
	gin.SetMode(gin.TestMode)

	hub, _ := newTimeoutHub(t, 300*time.Millisecond, 100*time.Millisecond)
	userID := uuid.New()

	r := gin.New()
	r.GET("/ws", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		c.Set("username", "timeout-user")
		hub.WebSocketHandler(c)
	})
	srv := httptest.NewServer(r)
	defer srv.Close()

	url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws"
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	require.NoError(t, err)
	defer conn.Close()

	// 客户端不读也不回 pong：把 ping handler 设为 no-op
	conn.SetPingHandler(func(string) error { return nil })

	// 服务端 pongWait 到期后应主动关闭连接
	_ = conn.SetReadDeadline(time.Now().Add(3 * time.Second))
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			return // 期望走到这里：读失败（连接被服务端关闭）
		}
	}
}

// TestWebSocketConnectionLimit 单用户并发连接超过上限时应被拒绝（429）
func TestWebSocketConnectionLimit(t *testing.T) {
	test.SkipIntegrationTests(t)
	gin.SetMode(gin.TestMode)

	hub, _ := newTimeoutHub(t, 5*time.Second, time.Second)
	hub.maxConnsPerUser = 1
	userID := uuid.New()

	r := gin.New()
	r.GET("/ws", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		c.Set("username", "limit-user")
		hub.WebSocketHandler(c)
	})
	srv := httptest.NewServer(r)
	defer srv.Close()

	url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws"
	first, _, err := websocket.DefaultDialer.Dial(url, nil)
	require.NoError(t, err)
	defer first.Close()

	// 等第一条连接完成注册
	require.Eventually(t, func() bool {
		return hub.IsUserOnline(userID)
	}, 2*time.Second, 20*time.Millisecond)

	_, resp, err := websocket.DefaultDialer.Dial(url, nil)
	require.Error(t, err, "第二条连接应被拒绝")
	if resp != nil {
		assert.Equal(t, http.StatusTooManyRequests, resp.StatusCode)
	}
}
