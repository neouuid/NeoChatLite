// E2E 端到端测试套件
package e2e

import (
	"os"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/chat"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/database"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/test"
)

// TestContext 保存 E2E 测试上下文
type TestContext struct {
	Config      *config.Config
	Router      *gin.Engine
	AuthHandler *auth.Handler
	UserHandler *user.Handler
	ChatHandler *chat.Handler
	AuthService *auth.Service
}

var globalTestContext *TestContext

func TestMain(m *testing.M) {
	// 检查是否运行 E2E 测试
	if os.Getenv("RUN_E2E_TESTS") != "true" {
		os.Exit(0)
	}

	// 设置测试环境
	gin.SetMode(gin.TestMode)

	// 初始化测试上下文
	setupTestContext()

	// 运行测试
	code := m.Run()

	// 清理
	teardownTestContext()

	os.Exit(code)
}

func setupTestContext() {
	cfg := config.TestConfig()

	// 设置数据库
	db := test.SetupTestDatabase(nil, cfg,
		&user.User{},
		&user.Friend{},
		&user.Blocklist{},
		&auth.VerificationToken{},
		&chat.Conversation{},
		&chat.ConversationMember{},
		&chat.Message{},
		&chat.MessageRead{},
		&chat.Group{},
		&chat.Favorite{},
		&chat.CallRecord{},
		&chat.Mention{},
	)

	// 初始化各模块
	authRepo := auth.NewRepository(db)
	emailService := email.NewService(cfg)
	authService := auth.NewService(authRepo, cfg, emailService)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.NewMiddleware(cfg)

	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	chatRepo := chat.NewRepository(db)
	chatService := chat.NewService(chatRepo)
	chatHandler := chat.NewHandler(chatService)

	// 设置路由
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
			userGroup.POST("/friend/request", userHandler.SendFriendRequest)
			userGroup.GET("/friends", userHandler.GetFriends)
			userGroup.GET("/friend-requests", userHandler.GetFriendRequests)
			userGroup.PUT("/friend-request/:id/accept", userHandler.AcceptFriendRequest)
			userGroup.PUT("/friend-request/:id/reject", userHandler.RejectFriendRequest)
		}

		// 聊天路由
		chatGroup := api.Group("/chat")
		chatGroup.Use(authMiddleware.AuthMiddleware())
		{
			chatGroup.GET("/conversations", chatHandler.GetUserConversations)
			chatGroup.POST("/conversation/single", chatHandler.CreateSingleConversation)
			chatGroup.POST("/conversation/group", chatHandler.CreateGroup)
			chatGroup.POST("/message", chatHandler.SendMessage)
			chatGroup.GET("/conversation/:id/messages", chatHandler.GetConversationMessages)
			chatGroup.GET("/favorites", chatHandler.GetUserFavorites)
			chatGroup.POST("/favorite", chatHandler.AddFavorite)
			chatGroup.DELETE("/favorite/:id", chatHandler.RemoveFavorite)
		}
	}

	globalTestContext = &TestContext{
		Config:      cfg,
		Router:      r,
		AuthHandler: authHandler,
		UserHandler: userHandler,
		ChatHandler: chatHandler,
		AuthService: authService,
	}
}

func teardownTestContext() {
	if database.DB != nil {
		database.Close()
	}
}

// SkipE2ETests 检查是否跳过 E2E 测试
func SkipE2ETests(t *testing.T) {
	t.Helper()
	if os.Getenv("RUN_E2E_TESTS") != "true" {
		t.Skip("Skipping E2E tests. Set RUN_E2E_TESTS=true to run.")
	}
}
