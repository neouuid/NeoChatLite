package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/chat"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/database"
	"github.com/neochat/backend/pkg/logger"
	"github.com/neochat/backend/pkg/redis"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化日志
	initLogger(cfg.Server.LogLevel)
	logger.Info("Starting NeoChat API Gateway...")

	// 初始化数据库
	if err := database.Init(cfg); err != nil {
		logger.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			logger.Errorf("Error closing database: %v", err)
		}
	}()

	// 自动迁移数据库
	if err := database.AutoMigrate(); err != nil {
		logger.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化 Redis
	if err := redis.Init(cfg); err != nil {
		logger.Warnf("Failed to initialize Redis: %v", err)
		logger.Info("Continuing without Redis...")
	}
	defer func() {
		if redis.Client != nil {
			if err := redis.Close(); err != nil {
				logger.Errorf("Error closing Redis: %v", err)
			}
		}
	}()

	// 设置 Gin
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(auth.CORSMiddleware(cfg))

	// 初始化认证模块
	authRepo := auth.NewRepository(database.DB)
	authService := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.NewMiddleware(cfg)

	// 初始化用户/好友模块
	userRepo := user.NewRepository(database.DB)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	// 初始化聊天模块
	chatRepo := chat.NewRepository(database.DB)
	chatService := chat.NewService(chatRepo)
	chatHandler := chat.NewHandler(chatService)
	uploadHandler := chat.NewUploadHandler(chatService, cfg)
	wsHub := chat.NewWebSocketHub(chatService, cfg)
	chatService.SetWebSocketHub(wsHub)
	go wsHub.Run()

	// 健康检查
	r.GET("/health", healthHandler)
	r.GET("/health/db", dbHealthHandler)
	r.GET("/health/redis", redisHealthHandler)

	// 静态文件服务 - 上传文件访问
	uploadDir := cfg.Storage.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	r.Static("/uploads", uploadDir)

	// API 路由
	api := r.Group("/api/v1")
	{
		api.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "NeoChat API v1",
				"version": "1.0.0",
			})
		})

		// 认证路由
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.RefreshToken)
			authGroup.GET("/profile", authMiddleware.AuthMiddleware(), authHandler.GetProfile)
			authGroup.POST("/forgot-password", authHandler.ForgotPassword)
			authGroup.POST("/change-password", authMiddleware.AuthMiddleware(), authHandler.ChangePassword)
		}

		// 用户路由
		userGroup := api.Group("/user")
		userGroup.Use(authMiddleware.AuthMiddleware())
		{
			userGroup.GET("/profile", userHandler.GetProfile)
			userGroup.PUT("/profile", userHandler.UpdateProfile)
			userGroup.GET("/search", userHandler.SearchUsers)
			userGroup.GET("/:id", userHandler.GetUserByID)
		}

		// 好友路由
		friendGroup := api.Group("/friend")
		friendGroup.Use(authMiddleware.AuthMiddleware())
		{
			friendGroup.GET("/list", userHandler.GetFriends)
			friendGroup.DELETE("/:id", userHandler.DeleteFriend)
			friendGroup.PUT("/:id/alias", userHandler.UpdateFriendAlias)
			friendGroup.POST("/request", userHandler.SendFriendRequest)
			friendGroup.GET("/requests", userHandler.GetFriendRequests)
			friendGroup.POST("/request/:id/accept", userHandler.AcceptFriendRequest)
			friendGroup.POST("/request/:id/reject", userHandler.RejectFriendRequest)
			friendGroup.POST("/request/:id/cancel", userHandler.CancelFriendRequest)
		}

		// 黑名单路由
		blockGroup := api.Group("/block")
		blockGroup.Use(authMiddleware.AuthMiddleware())
		{
			blockGroup.GET("/list", userHandler.GetBlocklist)
			blockGroup.POST("/", userHandler.BlockUser)
			blockGroup.DELETE("/:id", userHandler.UnblockUser)
		}

		// 聊天路由
		chatGroup := api.Group("/chat")
		chatGroup.Use(authMiddleware.AuthMiddleware())
		{
			// 会话路由
			chatGroup.GET("/conversations", chatHandler.GetUserConversations)
			chatGroup.GET("/conversation/:id", chatHandler.GetConversation)
			chatGroup.POST("/conversation/single", chatHandler.CreateSingleConversation)
			chatGroup.POST("/conversation/:id/read", chatHandler.MarkConversationAsRead)

			// 消息路由
			chatGroup.GET("/conversation/:id/messages", chatHandler.GetConversationMessages)
			chatGroup.POST("/message", chatHandler.SendMessage)
			chatGroup.PUT("/message/:id", chatHandler.EditMessage)
			chatGroup.DELETE("/message/:id", chatHandler.DeleteMessage)

			// 收藏路由
			chatGroup.GET("/favorites", chatHandler.GetUserFavorites)
			chatGroup.POST("/favorite", chatHandler.AddFavorite)
			chatGroup.DELETE("/favorite/:id", chatHandler.RemoveFavorite)

			// 消息转发路由
			chatGroup.POST("/messages/forward", chatHandler.ForwardMessage)

			// WebSocket
			chatGroup.GET("/ws", wsHub.WebSocketHandler)
		}

		// 文件上传路由
		uploadGroup := api.Group("/upload")
		uploadGroup.Use(authMiddleware.AuthMiddleware())
		{
			uploadGroup.POST("", uploadHandler.UploadFile)
		}

		// 群组路由
		groupGroup := api.Group("/group")
		groupGroup.Use(authMiddleware.AuthMiddleware())
		{
			groupGroup.POST("/", chatHandler.CreateGroup)
			groupGroup.GET("/:id", chatHandler.GetGroup)
			groupGroup.PUT("/:id", chatHandler.UpdateGroup)
			groupGroup.DELETE("/:id", chatHandler.DisbandGroup)
			groupGroup.POST("/:id/leave", chatHandler.LeaveGroup)
			groupGroup.GET("/:id/members", chatHandler.GetGroupMembers)
			groupGroup.POST("/:id/members", chatHandler.AddGroupMember)
			groupGroup.DELETE("/:id/members/:user_id", chatHandler.RemoveGroupMember)
			groupGroup.PUT("/:id/members/:user_id/role", chatHandler.UpdateMemberRole)
		}

		// 通话路由
		callGroup := api.Group("/call")
		callGroup.Use(authMiddleware.AuthMiddleware())
		{
			callGroup.POST("/initiate", chatHandler.InitiateCall)
			callGroup.POST("/:id/accept", chatHandler.AcceptCall)
			callGroup.POST("/:id/reject", chatHandler.RejectCall)
			callGroup.POST("/:id/end", chatHandler.EndCall)
			callGroup.GET("/:id", chatHandler.GetCallRecord)
			callGroup.GET("/s", chatHandler.GetUserCallRecords)
		}
	}

	// 启动服务器
	srv := &http.Server{
		Addr:         ":" + fmt.Sprintf("%d", cfg.Server.Port),
		Handler:      r,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	// 在 goroutine 中启动服务器
	go func() {
		logger.Infof("Server starting on port %d", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号来优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	// 设置 5 秒的超时时间
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown:", err)
	}

	logger.Info("Server exiting")
}

// healthHandler 总健康检查
func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"service":   "neochat-api-gateway",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// dbHealthHandler 数据库健康检查
func dbHealthHandler(c *gin.Context) {
	sqlDB, err := database.DB.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"db":     "connected",
	})
}

// redisHealthHandler Redis 健康检查
func redisHealthHandler(c *gin.Context) {
	if redis.Client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "error",
			"error":  "redis not initialized",
		})
		return
	}

	pong, err := redis.Client.Ping(c).Result()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"redis":  pong,
	})
}

// initLogger 初始化日志系统
func initLogger(level string) {
	switch level {
	case "debug":
		logger.SetLevel(logger.LevelDebug)
	case "info":
		logger.SetLevel(logger.LevelInfo)
	case "warn":
		logger.SetLevel(logger.LevelWarn)
	case "error":
		logger.SetLevel(logger.LevelError)
	default:
		logger.SetLevel(logger.LevelInfo)
	}
	logger.Infof("Log level set to: %s", level)
}
