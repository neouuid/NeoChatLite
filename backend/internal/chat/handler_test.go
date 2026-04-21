package chat

import (
	"fmt"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/test"
)

func TestChatIntegration(t *testing.T) {
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
	user1 := test.CreateTestUser(t, db, "user1", "user1@example.com", "password123")
	user2 := test.CreateTestUser(t, db, "user2", "user2@example.com", "password123")

	// 获取 tokens
	token1, err := authService.GenerateToken(user1.ID)
	assert.NoError(t, err)

	t.Run("创建单聊会话", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"user_id": user2.ID.String(),
		}

		w := test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)
		test.AssertStatus(t, w, 200)

		var response map[string]interface{}
		test.ParseResponse(t, w, &response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])
	})

	t.Run("获取会话列表", func(t *testing.T) {
		// 先创建一个会话
		reqBody := map[string]interface{}{"user_id": user2.ID.String()}
		test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)

		// 获取会话列表
		w := test.MakeRequest(t, r, "GET", "/api/v1/chat/conversations", nil, token1)
		test.AssertStatus(t, w, 200)

		var response map[string]interface{}
		test.ParseResponse(t, w, &response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])
	})

	t.Run("发送消息", func(t *testing.T) {
		// 先创建会话
		reqBody := map[string]interface{}{"user_id": user2.ID.String()}
		w := test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)

		var createResp map[string]interface{}
		test.ParseResponse(t, w, &createResp)
		conversationData := createResp["data"].(map[string]interface{})
		conversationID := conversationData["id"].(string)

		// 发送消息
		msgReq := map[string]interface{}{
			"conversation_id": conversationID,
			"content":         "Hello, this is a test message!",
			"type":            "text",
		}

		w2 := test.MakeRequest(t, r, "POST", "/api/v1/chat/message", msgReq, token1)
		test.AssertStatus(t, w2, 200)

		var msgResp map[string]interface{}
		test.ParseResponse(t, w2, &msgResp)
		assert.True(t, msgResp["success"].(bool))
		assert.NotNil(t, msgResp["data"])
	})

	t.Run("获取消息列表", func(t *testing.T) {
		// 创建会话
		reqBody := map[string]interface{}{"user_id": user2.ID.String()}
		w := test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)

		var createResp map[string]interface{}
		test.ParseResponse(t, w, &createResp)
		conversationData := createResp["data"].(map[string]interface{})
		conversationID := conversationData["id"].(string)

		// 发送几条消息
		for i := 0; i < 3; i++ {
			msgReq := map[string]interface{}{
				"conversation_id": conversationID,
				"content":         fmt.Sprintf("Message %d", i+1),
				"type":            "text",
			}
			test.MakeRequest(t, r, "POST", "/api/v1/chat/message", msgReq, token1)
		}

		// 获取消息列表
		w2 := test.MakeRequest(t, r, "GET", fmt.Sprintf("/api/v1/chat/conversation/%s/messages", conversationID), nil, token1)
		test.AssertStatus(t, w2, 200)

		var msgResp map[string]interface{}
		test.ParseResponse(t, w2, &msgResp)
		assert.True(t, msgResp["success"].(bool))
		assert.NotNil(t, msgResp["data"])
	})

	t.Run("收藏和取消收藏消息", func(t *testing.T) {
		// 创建会话
		reqBody := map[string]interface{}{"user_id": user2.ID.String()}
		w := test.MakeRequest(t, r, "POST", "/api/v1/chat/conversation/single", reqBody, token1)

		var createResp map[string]interface{}
		test.ParseResponse(t, w, &createResp)
		conversationData := createResp["data"].(map[string]interface{})
		conversationID := conversationData["id"].(string)

		// 发送消息
		msgReq := map[string]interface{}{
			"conversation_id": conversationID,
			"content":         "Message to favorite",
			"type":            "text",
		}
		w2 := test.MakeRequest(t, r, "POST", "/api/v1/chat/message", msgReq, token1)

		var msgResp map[string]interface{}
		test.ParseResponse(t, w2, &msgResp)
		msgData := msgResp["data"].(map[string]interface{})
		messageID := msgData["id"].(string)

		// 收藏消息
		favReq := map[string]interface{}{
			"message_id": messageID,
			"note":       "This is a great message!",
		}
		w3 := test.MakeRequest(t, r, "POST", "/api/v1/chat/favorite", favReq, token1)
		test.AssertStatus(t, w3, 200)

		var favResp map[string]interface{}
		test.ParseResponse(t, w3, &favResp)
		assert.True(t, favResp["success"].(bool))

		// 获取收藏列表
		w4 := test.MakeRequest(t, r, "GET", "/api/v1/chat/favorites", nil, token1)
		test.AssertStatus(t, w4, 200)

		var favListResp map[string]interface{}
		test.ParseResponse(t, w4, &favListResp)
		assert.True(t, favListResp["success"].(bool))
		assert.NotNil(t, favListResp["data"])

		// 取消收藏
		favData := favResp["data"].(map[string]interface{})
		favoriteID := favData["id"].(string)
		w5 := test.MakeRequest(t, r, "DELETE", fmt.Sprintf("/api/v1/chat/favorite/%s", favoriteID), nil, token1)
		test.AssertStatus(t, w5, 200)
	})

	t.Run("未认证访问聊天接口", func(t *testing.T) {
		w := test.MakeRequest(t, r, "GET", "/api/v1/chat/conversations", nil)
		test.AssertStatus(t, w, 401)
	})
}
