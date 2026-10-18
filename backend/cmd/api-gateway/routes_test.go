package main

import (
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/chat"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
)

// newTestRouter 用零值 handler 构建真实路由表。
// SetupRoutes 只注册路由、不会调用 handler，因此无需真实数据库。
func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.TestMode)

	cfg := &config.Config{}
	cfg.Storage.UploadDir = t.TempDir()

	r := gin.New()
	SetupRoutes(r, &HandlerDependencies{
		AuthHandler:    &auth.Handler{},
		UserHandler:    &user.Handler{},
		ChatHandler:    &chat.Handler{},
		UploadHandler:  &chat.UploadHandler{},
		WsHub:          &chat.WebSocketHub{},
		AuthMiddleware: auth.NewMiddleware(cfg),
		Cfg:            cfg,
	})
	return r
}

// routeSet 把路由表转成 "METHOD path" 集合，便于断言。
func routeSet(r *gin.Engine) map[string]bool {
	set := make(map[string]bool, len(r.Routes()))
	for _, route := range r.Routes() {
		set[route.Method+" "+route.Path] = true
	}
	return set
}

// TestCanonicalRoutesRegistered 守护「客户端实际调用」的主路径必须存在。
// 这些路径曾因单复数不一致而 404，回归测试用于防止再次漂移。
func TestCanonicalRoutesRegistered(t *testing.T) {
	set := routeSet(newTestRouter(t))

	expected := []string{
		// 用户
		"GET /api/v1/users/profile",
		"GET /api/v1/users/search",
		"GET /api/v1/users/:id",
		// 好友
		"GET /api/v1/friends",
		"DELETE /api/v1/friends/:id",
		"PUT /api/v1/friends/:id",
		"GET /api/v1/friends/requests",
		"POST /api/v1/friends/requests",
		"POST /api/v1/friends/requests/:id/accept",
		"POST /api/v1/friends/requests/:id/reject",
		// 黑名单
		"GET /api/v1/blocklist",
		"POST /api/v1/blocklist",
		"DELETE /api/v1/blocklist/:id",
		// 会话与消息
		"GET /api/v1/chat/conversations",
		"POST /api/v1/chat/conversations",
		"GET /api/v1/chat/conversations/:id",
		"PUT /api/v1/chat/conversations/:id",
		"DELETE /api/v1/chat/conversations/:id",
		"POST /api/v1/chat/conversations/:id/read",
		"GET /api/v1/chat/conversations/:id/messages",
		"POST /api/v1/chat/conversations/:id/messages",
		"PUT /api/v1/chat/conversations/:id/messages/:message_id",
		"DELETE /api/v1/chat/conversations/:id/messages/:message_id",
		"GET /api/v1/chat/sync",
		"POST /api/v1/chat/messages/forward",
		"GET /api/v1/chat/search/messages",
		"GET /api/v1/chat/search/groups",
		// 收藏
		"GET /api/v1/chat/favorites",
		"POST /api/v1/chat/favorites",
		"DELETE /api/v1/chat/favorites/:id",
		// 群组
		"POST /api/v1/groups",
		"GET /api/v1/groups/:id",
		"PUT /api/v1/groups/:id",
		"POST /api/v1/groups/:id/leave",
		"GET /api/v1/groups/:id/members",
		"POST /api/v1/groups/:id/members",
		"DELETE /api/v1/groups/:id/members/:user_id",
		"PUT /api/v1/groups/:id/members/:user_id/role",
		// 通话
		"GET /api/v1/calls",
		"POST /api/v1/calls/initiate",
		"POST /api/v1/calls/:id/accept",
		"POST /api/v1/calls/:id/end",
		// WebSocket
		"GET /api/v1/chat/ws",
	}

	for _, want := range expected {
		if !set[want] {
			t.Errorf("缺少路由: %s", want)
		}
	}
}

// TestLegacyRoutesKept 确认旧路径仍然可用（迁移期向后兼容）。
func TestLegacyRoutesKept(t *testing.T) {
	set := routeSet(newTestRouter(t))

	legacy := []string{
		"GET /api/v1/user/profile",
		"GET /api/v1/friend/list",
		"POST /api/v1/friend/request",
		"GET /api/v1/block/list",
		"GET /api/v1/chat/conversation/:id",
		"POST /api/v1/chat/conversation/:id/read",
		"GET /api/v1/chat/conversation/:id/messages",
		"POST /api/v1/chat/message",
		"POST /api/v1/chat/favorite",
		"GET /api/v1/call/s",
	}

	for _, want := range legacy {
		if !set[want] {
			t.Errorf("旧的兼容路由缺失: %s", want)
		}
	}
}
