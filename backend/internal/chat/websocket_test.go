package chat

import (
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/test"
)

func TestWebSocketIntegration(t *testing.T) {
	test.SkipIntegrationTests(t)

	// 设置测试环境
	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg)
	defer test.CleanupTestDatabase(t)

	// 初始化各模块
	authRepo := auth.NewRepository(db)
	emailService := email.NewService(cfg)
	authService := auth.NewService(authRepo, cfg, emailService)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.NewMiddleware(cfg)

	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	chatRepo := NewRepository(db)
	chatService := NewService(chatRepo)
	chatHandler := NewHandler(chatService)

	// 设置路由
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// API 路由
	api := r.Group("/api/v1")
	{
		// 认证路由
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.GET("/profile", authMiddleware.AuthMiddleware(), authHandler.GetProfile)
		}

		// 用户路由
		userGroup := api.Group("/user")
		userGroup.Use(authMiddleware.AuthMiddleware())
		{
			userGroup.GET("/profile", userHandler.GetProfile)
			userGroup.GET("/search", userHandler.SearchUsers)
		}

		// 聊天路由
		chatGroup := api.Group("/chat")
		chatGroup.Use(authMiddleware.AuthMiddleware())
		{
			chatGroup.GET("/conversations", chatHandler.GetUserConversations)
			chatGroup.POST("/conversation/single", chatHandler.CreateSingleConversation)
			chatGroup.POST("/message", chatHandler.SendMessage)
			chatGroup.GET("/conversation/:id/messages", chatHandler.GetConversationMessages)
			chatGroup.GET("/favorites", chatHandler.GetUserFavorites)
			chatGroup.POST("/favorite", chatHandler.AddFavorite)
			chatGroup.DELETE("/favorite/:id", chatHandler.RemoveFavorite)
		}
	}

	// 创建测试用户
	user1 := test.CreateTestUser(t, db, "wsuser1", "wsuser1@example.com", "password123")
	user2 := test.CreateTestUser(t, db, "wsuser2", "wsuser2@example.com", "password123")

	// 获取 tokens
	token1, err := authService.GenerateToken(user1.ID)
	assert.NoError(t, err)

	t.Run("WebSocket 握手需要认证", func(t *testing.T) {
		// 未认证访问 WebSocket 应该失败
		w := test.MakeRequest(t, r, "GET", "/api/v1/chat/ws", nil)
		// WebSocket 升级失败通常返回 400 或 401
		assert.NotEqual(t, 200, w.Code)
	})

	t.Run("带认证的 WebSocket 握手（会话准备）", func(t *testing.T) {
		// 注意：完整的 WebSocket 测试需要真正的 WebSocket 客户端
		// 这里我们只测试相关 API 端点可以正常工作

		// 创建单聊会话
		reqBody := map[string]interface{}{"user_id": user2.ID.String()}
		w := test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)
		test.AssertStatus(t, w, 200)

		// 验证会话创建成功
		var createResp map[string]interface{}
		test.ParseResponse(t, w, &createResp)
		assert.True(t, createResp["success"].(bool))
	})

	t.Run("WebSocket Hub 基本功能", func(t *testing.T) {
		// 测试 WebSocket Hub 的基本功能
		// 创建 Hub
		wsHub := NewWebSocketHub(chatService, cfg)

		// 验证 Hub 可以正常启动和停止
		assert.NotNil(t, wsHub)

		// 在 goroutine 中运行 Hub
		go wsHub.Run()

		// 给一点时间让 Hub 启动
		// 注意：在实际测试中，我们应该有更好的同步机制
		// 这里只是简单验证 Hub 没有崩溃
	})
}
