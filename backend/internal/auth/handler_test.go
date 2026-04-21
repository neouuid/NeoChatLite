package auth

import (
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"github.com/neochat/backend/internal/chat"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/test"
	"github.com/neochat/backend/pkg/utils"
)

func TestAuthIntegration(t *testing.T) {
	test.SkipIntegrationTests(t)

	// 设置测试环境
	cfg := test.SetupTestConfig(t)

	// 设置数据库并迁移
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&user.Friend{},
		&user.Blocklist{},
		&VerificationToken{},
		&chat.Conversation{},
		&chat.ConversationMember{},
		&chat.Message{},
		&chat.MessageRead{},
		&chat.Group{},
		&chat.Favorite{},
		&chat.CallRecord{},
		&chat.Mention{},
	)
	defer test.CleanupTestDatabase(t)

	// 初始化各模块
	authRepo := NewRepository(db)
	emailService := email.NewService(cfg)
	authService := NewService(authRepo, cfg, emailService)
	authHandler := NewHandler(authService)
	authMiddleware := NewMiddleware(cfg)

	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	chatRepo := chat.NewRepository(db)
	chatService := chat.NewService(chatRepo)
	chatHandler := chat.NewHandler(chatService)

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

	// CreateTestUser 辅助函数 - 复制到这里避免循环导入
	createTestUser := func(username, email, password string) *user.User {
		t.Helper()
		hashedPassword, err := utils.HashPassword(password)
		if err != nil {
			t.Fatalf("Failed to hash password: %v", err)
		}
		testUser := &user.User{
			Username: username,
			Email:    email,
			Password: hashedPassword,
			Nickname: username,
		}
		if err := db.Create(testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}
		return testUser
	}

	t.Run("用户注册流程", func(t *testing.T) {
		// 测试注册
		reqBody := test.RegisterRequest{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}

		w := test.MakeRequest(t, r, "POST", "/api/v1/auth/register", reqBody)
		test.AssertStatus(t, w, 200)

		var response map[string]interface{}
		test.ParseResponse(t, w, &response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])
	})

	t.Run("用户登录流程", func(t *testing.T) {
		// 先创建测试用户
		createTestUser("loginuser", "login@example.com", "password123")

		// 测试登录
		reqBody := map[string]interface{}{
			"identifier": "login@example.com",
			"password":   "password123",
		}

		w := test.MakeRequest(t, r, "POST", "/api/v1/auth/login", reqBody)
		test.AssertStatus(t, w, 200)

		var response map[string]interface{}
		test.ParseResponse(t, w, &response)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.NotNil(t, data["access_token"])
		assert.NotNil(t, data["user"])
	})

	t.Run("获取用户资料（需要认证）", func(t *testing.T) {
		// 创建测试用户
		user := createTestUser("profileuser", "profile@example.com", "password123")

		// 获取 token
		token, err := authService.GenerateToken(user.ID)
		assert.NoError(t, err)

		// 测试获取资料
		w := test.MakeRequest(t, r, "GET", "/api/v1/auth/profile", nil, token)
		test.AssertStatus(t, w, 200)

		var response map[string]interface{}
		test.ParseResponse(t, w, &response)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.Equal(t, "profileuser", data["username"])
		assert.Equal(t, "profile@example.com", data["email"])
	})

	t.Run("未认证访问受保护路由", func(t *testing.T) {
		w := test.MakeRequest(t, r, "GET", "/api/v1/auth/profile", nil)
		test.AssertStatus(t, w, 401)
	})

	t.Run("无效 token 访问", func(t *testing.T) {
		w := test.MakeRequest(t, r, "GET", "/api/v1/auth/profile", nil, "invalid-token")
		test.AssertStatus(t, w, 401)
	})

	t.Run("重复邮箱注册", func(t *testing.T) {
		// 先注册一次
		reqBody := test.RegisterRequest{
			Username: "duplicate1",
			Email:    "duplicate@example.com",
			Password: "password123",
		}
		test.MakeRequest(t, r, "POST", "/api/v1/auth/register", reqBody)

		// 尝试用相同邮箱再次注册
		reqBody2 := test.RegisterRequest{
			Username: "duplicate2",
			Email:    "duplicate@example.com",
			Password: "password123",
		}
		w := test.MakeRequest(t, r, "POST", "/api/v1/auth/register", reqBody2)
		test.AssertStatus(t, w, 400)
	})

	t.Run("错误密码登录", func(t *testing.T) {
		// 创建测试用户
		createTestUser("wrongpassuser", "wrongpass@example.com", "password123")

		// 尝试用错误密码登录
		reqBody := map[string]interface{}{
			"identifier": "wrongpass@example.com",
			"password":   "wrongpassword",
		}
		w := test.MakeRequest(t, r, "POST", "/api/v1/auth/login", reqBody)
		test.AssertStatus(t, w, 401)
	})

	t.Run("不存在的用户登录", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"identifier": "notexists@example.com",
			"password":   "password123",
		}
		w := test.MakeRequest(t, r, "POST", "/api/v1/auth/login", reqBody)
		test.AssertStatus(t, w, 401)
	})
}
