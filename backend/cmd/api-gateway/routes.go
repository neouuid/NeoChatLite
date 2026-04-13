package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/chat"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/database"
	"github.com/neochat/backend/pkg/logger"
	"github.com/neochat/backend/pkg/redis"
)

// HandlerDependencies 包含所有路由处理器依赖
type HandlerDependencies struct {
	AuthHandler  *auth.Handler
	UserHandler  *user.Handler
	ChatHandler  *chat.Handler
	UploadHandler *chat.UploadHandler
	WsHub        *chat.WebSocketHub
	AuthMiddleware *auth.Middleware
	Cfg          *config.Config
}

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine, deps *HandlerDependencies) {
	// 添加 CORS 中间件
	r.Use(auth.CORSMiddleware(deps.Cfg))

	// 健康检查
	r.GET("/health", healthHandler)
	r.GET("/health/db", dbHealthHandler)
	r.GET("/health/redis", redisHealthHandler)

	// Swagger API 文档
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 静态文件服务 - 上传文件访问
	uploadDir := deps.Cfg.Storage.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	r.Static("/uploads", uploadDir)

	// API 路由
	api := r.Group("/api/v1")
	{
		api.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "NeoChat API v1",
				"version": "1.0.0",
			})
		})

		// 认证路由
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", deps.AuthHandler.Register)
			authGroup.POST("/login", deps.AuthHandler.Login)
			authGroup.POST("/refresh", deps.AuthHandler.RefreshToken)
			authGroup.GET("/profile", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.GetProfile)
			authGroup.POST("/forgot-password", deps.AuthHandler.ForgotPassword)
			authGroup.POST("/reset-password", deps.AuthHandler.ResetPassword)
			authGroup.POST("/change-password", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.ChangePassword)
			authGroup.POST("/send-verification-email", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.SendEmailVerification)
			authGroup.POST("/verify-email", deps.AuthHandler.VerifyEmail)
		}

		// 用户路由
		userGroup := api.Group("/user")
		userGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			userGroup.GET("/profile", deps.UserHandler.GetProfile)
			userGroup.PUT("/profile", deps.UserHandler.UpdateProfile)
			userGroup.GET("/search", deps.UserHandler.SearchUsers)
			userGroup.GET("/:id", deps.UserHandler.GetUserByID)
		}

		// 好友路由
		friendGroup := api.Group("/friend")
		friendGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			friendGroup.GET("/list", deps.UserHandler.GetFriends)
			friendGroup.DELETE("/:id", deps.UserHandler.DeleteFriend)
			friendGroup.PUT("/:id/alias", deps.UserHandler.UpdateFriendAlias)
			friendGroup.POST("/request", deps.UserHandler.SendFriendRequest)
			friendGroup.GET("/requests", deps.UserHandler.GetFriendRequests)
			friendGroup.POST("/request/:id/accept", deps.UserHandler.AcceptFriendRequest)
			friendGroup.POST("/request/:id/reject", deps.UserHandler.RejectFriendRequest)
			friendGroup.POST("/request/:id/cancel", deps.UserHandler.CancelFriendRequest)
		}

		// 黑名单路由
		blockGroup := api.Group("/block")
		blockGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			blockGroup.GET("/list", deps.UserHandler.GetBlocklist)
			blockGroup.POST("/", deps.UserHandler.BlockUser)
			blockGroup.DELETE("/:id", deps.UserHandler.UnblockUser)
		}

		// 聊天路由
		chatGroup := api.Group("/chat")
		chatGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			// 会话路由
			chatGroup.GET("/conversations", deps.ChatHandler.GetUserConversations)
			chatGroup.GET("/conversation/:id", deps.ChatHandler.GetConversation)
			chatGroup.POST("/conversation/single", deps.ChatHandler.CreateSingleConversation)
			chatGroup.POST("/conversation/:id/read", deps.ChatHandler.MarkConversationAsRead)

			// 消息路由
			chatGroup.GET("/conversation/:id/messages", deps.ChatHandler.GetConversationMessages)
			chatGroup.POST("/message", deps.ChatHandler.SendMessage)
			chatGroup.PUT("/message/:id", deps.ChatHandler.EditMessage)
			chatGroup.DELETE("/message/:id", deps.ChatHandler.DeleteMessage)

			// 收藏路由
			chatGroup.GET("/favorites", deps.ChatHandler.GetUserFavorites)
			chatGroup.POST("/favorite", deps.ChatHandler.AddFavorite)
			chatGroup.DELETE("/favorite/:id", deps.ChatHandler.RemoveFavorite)

			// 消息转发路由
			chatGroup.POST("/messages/forward", deps.ChatHandler.ForwardMessage)

			// WebSocket
			chatGroup.GET("/ws", deps.WsHub.WebSocketHandler)
		}

		// 文件上传路由
		uploadGroup := api.Group("/upload")
		uploadGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			uploadGroup.POST("", deps.UploadHandler.UploadFile)
		}

		// 群组路由
		groupGroup := api.Group("/group")
		groupGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			groupGroup.POST("/", deps.ChatHandler.CreateGroup)
			groupGroup.GET("/:id", deps.ChatHandler.GetGroup)
			groupGroup.PUT("/:id", deps.ChatHandler.UpdateGroup)
			groupGroup.DELETE("/:id", deps.ChatHandler.DisbandGroup)
			groupGroup.POST("/:id/leave", deps.ChatHandler.LeaveGroup)
			groupGroup.GET("/:id/members", deps.ChatHandler.GetGroupMembers)
			groupGroup.POST("/:id/members", deps.ChatHandler.AddGroupMember)
			groupGroup.DELETE("/:id/members/:user_id", deps.ChatHandler.RemoveGroupMember)
			groupGroup.PUT("/:id/members/:user_id/role", deps.ChatHandler.UpdateMemberRole)
		}

		// 通话路由
		callGroup := api.Group("/call")
		callGroup.Use(deps.AuthMiddleware.AuthMiddleware())
		{
			callGroup.POST("/initiate", deps.ChatHandler.InitiateCall)
			callGroup.POST("/:id/accept", deps.ChatHandler.AcceptCall)
			callGroup.POST("/:id/reject", deps.ChatHandler.RejectCall)
			callGroup.POST("/:id/end", deps.ChatHandler.EndCall)
			callGroup.GET("/:id", deps.ChatHandler.GetCallRecord)
			callGroup.GET("/s", deps.ChatHandler.GetUserCallRecords)
		}
	}
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
