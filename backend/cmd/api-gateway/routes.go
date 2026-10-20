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
	"github.com/neochat/backend/pkg/middleware"
	"github.com/neochat/backend/pkg/redis"
)

// HandlerDependencies 包含所有路由处理器依赖
type HandlerDependencies struct {
	AuthHandler    *auth.Handler
	UserHandler    *user.Handler
	ChatHandler    *chat.Handler
	UploadHandler  *chat.UploadHandler
	WsHub          *chat.WebSocketHub
	AuthMiddleware *auth.Middleware
	Cfg            *config.Config
}

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine, deps *HandlerDependencies) {
	// 添加 CORS 中间件
	r.Use(auth.CORSMiddleware(deps.Cfg))

	// 添加性能监控中间件
	r.Use(middleware.MetricsMiddleware())

	// 基础安全响应头
	r.Use(middleware.SecurityHeaders())

	// 健康检查和监控
	r.GET("/health", healthHandler)
	r.GET("/health/db", dbHealthHandler)
	r.GET("/health/redis", redisHealthHandler)
	r.GET("/metrics", middleware.MetricsHandler)

	// Swagger API 文档
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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
		// 认证接口是撞库的主要目标，按 IP 限流
		authLimit := deps.Cfg.Server.AuthRateLimitPerMinute
		if authLimit <= 0 {
			authLimit = 20
		}

		// 已登录后的高频写操作按用户限流
		msgLimit := deps.Cfg.Server.MessageRateLimitPer10s
		if msgLimit <= 0 {
			msgLimit = 20
		}
		uploadLimit := deps.Cfg.Server.UploadRateLimitPerMinute
		if uploadLimit <= 0 {
			uploadLimit = 10
		}
		authGroup := api.Group("/auth", middleware.RateLimitByIP(authLimit, time.Minute))
		{
			authGroup.POST("/register", deps.AuthHandler.Register)
			authGroup.POST("/login", deps.AuthHandler.Login)
			authGroup.POST("/refresh", deps.AuthHandler.RefreshToken)
			authGroup.POST("/logout", deps.AuthHandler.Logout)
			authGroup.GET("/profile", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.GetProfile)
			authGroup.PUT("/profile", deps.AuthMiddleware.AuthMiddleware(), deps.UserHandler.UpdateProfile)
			authGroup.GET("/me", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.GetMe)
			authGroup.POST("/forgot-password", deps.AuthHandler.ForgotPassword)
			authGroup.POST("/reset-password", deps.AuthHandler.ResetPassword)
			authGroup.POST("/change-password", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.ChangePassword)
			authGroup.POST("/send-verification-email", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.SendEmailVerification)
			authGroup.POST("/verify-email", deps.AuthHandler.VerifyEmail)
			// 新增的安全相关路由
			authGroup.POST("/delete-account", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.DeleteAccount)
			authGroup.POST("/send-phone-verification", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.SendPhoneVerification)
			authGroup.POST("/update-phone", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.UpdatePhone)
			authGroup.POST("/update-email", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.UpdateEmail)
			authGroup.GET("/login-history", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.GetLoginHistory)
			authGroup.GET("/devices", deps.AuthMiddleware.AuthMiddleware(), deps.AuthHandler.GetDevices)
		}

		// ── 用户路由 ──
		// 主路径为 RESTful 复数 /users；旧路径 /user 保留为兼容别名。
		for _, g := range []*gin.RouterGroup{
			api.Group("/users", deps.AuthMiddleware.AuthMiddleware()),
			api.Group("/user", deps.AuthMiddleware.AuthMiddleware()),
		} {
			g.GET("/profile", deps.UserHandler.GetProfile)
			g.PUT("/profile", deps.UserHandler.UpdateProfile)
			g.GET("/search", deps.UserHandler.SearchUsers)
			g.GET("/:id", deps.UserHandler.GetUserByID)
		}

		// ── 好友路由 ──
		// 主路径 /friends；旧路径 /friend/* 保留为兼容别名。
		friendsGroup := api.Group("/friends", deps.AuthMiddleware.AuthMiddleware())
		{
			friendsGroup.GET("", deps.UserHandler.GetFriends)
			friendsGroup.DELETE("/:id", deps.UserHandler.DeleteFriend)
			friendsGroup.PUT("/:id", deps.UserHandler.UpdateFriendAlias)
			friendsGroup.PUT("/:id/alias", deps.UserHandler.UpdateFriendAlias)
			friendsGroup.POST("/requests", deps.UserHandler.SendFriendRequest)
			friendsGroup.GET("/requests", deps.UserHandler.GetFriendRequests)
			friendsGroup.POST("/requests/:id/accept", deps.UserHandler.AcceptFriendRequest)
			friendsGroup.POST("/requests/:id/reject", deps.UserHandler.RejectFriendRequest)
			friendsGroup.POST("/requests/:id/cancel", deps.UserHandler.CancelFriendRequest)
		}

		// 兼容：旧好友路径
		friendGroup := api.Group("/friend", deps.AuthMiddleware.AuthMiddleware())
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

		// ── 黑名单路由 ──
		// 主路径 /blocklist；旧路径 /block/* 保留为兼容别名。
		blocklistGroup := api.Group("/blocklist", deps.AuthMiddleware.AuthMiddleware())
		{
			blocklistGroup.GET("", deps.UserHandler.GetBlocklist)
			blocklistGroup.POST("", deps.UserHandler.BlockUser)
			blocklistGroup.DELETE("/:id", deps.UserHandler.UnblockUser)
		}

		// 兼容：旧黑名单路径
		blockGroup := api.Group("/block", deps.AuthMiddleware.AuthMiddleware())
		{
			blockGroup.GET("/list", deps.UserHandler.GetBlocklist)
			blockGroup.POST("/", deps.UserHandler.BlockUser)
			blockGroup.DELETE("/:id", deps.UserHandler.UnblockUser)
		}

		// ── 聊天路由 ──
		chatGroup := api.Group("/chat", deps.AuthMiddleware.AuthMiddleware())
		{
			// 会话（主路径：复数 /conversations）
			chatGroup.GET("/conversations", deps.ChatHandler.GetUserConversations)
			chatGroup.POST("/conversations", deps.ChatHandler.CreateSingleConversation)
			chatGroup.GET("/conversations/:id", deps.ChatHandler.GetConversation)
			chatGroup.PUT("/conversations/:id", deps.ChatHandler.UpdateConversation)
			chatGroup.DELETE("/conversations/:id", deps.ChatHandler.DeleteConversation)
			chatGroup.POST("/conversations/:id/read", deps.ChatHandler.MarkConversationAsRead)
			chatGroup.PUT("/conversations/:id/mute", deps.ChatHandler.SetConversationMuted)
			chatGroup.PUT("/conversations/:id/pin", deps.ChatHandler.SetConversationPinned)

			// 消息（会话下挂载，同时保留旧的扁平路径）
			chatGroup.GET("/conversations/:id/messages", deps.ChatHandler.GetConversationMessages)
			chatGroup.POST("/conversations/:id/messages", deps.ChatHandler.SendMessage)
			chatGroup.PUT("/conversations/:id/messages/:message_id", deps.ChatHandler.EditMessage)
			chatGroup.DELETE("/conversations/:id/messages/:message_id", deps.ChatHandler.DeleteMessage)

			chatGroup.POST("/messages",
				middleware.RateLimitByUser(msgLimit, 10*time.Second),
				deps.ChatHandler.SendMessage)
			chatGroup.PUT("/messages/:id", deps.ChatHandler.EditMessage)
			chatGroup.DELETE("/messages/:id", deps.ChatHandler.DeleteMessage)

			// 兼容：旧会话/消息路径
			chatGroup.GET("/conversation/:id", deps.ChatHandler.GetConversation)
			chatGroup.POST("/conversation/single", deps.ChatHandler.CreateSingleConversation)
			chatGroup.POST("/conversation/:id/read", deps.ChatHandler.MarkConversationAsRead)
			chatGroup.GET("/conversation/:id/messages", deps.ChatHandler.GetConversationMessages)
			chatGroup.POST("/message",
				middleware.RateLimitByUser(msgLimit, 10*time.Second),
				deps.ChatHandler.SendMessage)
			chatGroup.PUT("/message/:id", deps.ChatHandler.EditMessage)
			chatGroup.DELETE("/message/:id", deps.ChatHandler.DeleteMessage)

			// 离线消息增量同步（客户端重连后补拉）
			chatGroup.GET("/sync", deps.ChatHandler.SyncOfflineMessages)

			// 收藏（主路径复数，旧路径兼容）
			chatGroup.GET("/favorites", deps.ChatHandler.GetUserFavorites)
			chatGroup.POST("/favorites", deps.ChatHandler.AddFavorite)
			chatGroup.DELETE("/favorites/:id", deps.ChatHandler.RemoveFavorite)
			chatGroup.POST("/favorite", deps.ChatHandler.AddFavorite)
			chatGroup.DELETE("/favorite/:id", deps.ChatHandler.RemoveFavorite)

			// 消息转发
			chatGroup.POST("/messages/forward", deps.ChatHandler.ForwardMessage)

			// 搜索
			chatGroup.GET("/search/messages", deps.ChatHandler.SearchMessages)
			chatGroup.GET("/search/groups", deps.ChatHandler.SearchGroups)

			// 提及
			chatGroup.GET("/mentions", deps.ChatHandler.GetUserMentions)
			chatGroup.GET("/mentions/unread-count", deps.ChatHandler.GetUnreadMentionCount)
			chatGroup.POST("/mention/:id/read", deps.ChatHandler.MarkMentionAsRead)
			chatGroup.POST("/mentions/read-all", deps.ChatHandler.MarkAllMentionsAsRead)

			// WebSocket
			// WebSocket 单独注册（见下方 api.GET），此处不再挂载
		}

		// WebSocket：浏览器无法自定义请求头，用 WebSocketAuthMiddleware 支持 ?token=
		api.GET("/chat/ws", deps.AuthMiddleware.WebSocketAuthMiddleware(), deps.WsHub.WebSocketHandler)

		// 文件上传路由
		// 上传文件不再通过静态目录直接暴露：必须带鉴权，
		// 且文件被某条消息引用时还要求调用者是会话成员。
		// 允许 ?token= 是因为 <img>/<video>/<audio> 无法自定义请求头。
		filesGroup := api.Group("/files", deps.AuthMiddleware.AuthMiddlewareOrQuery())
		{
			filesGroup.GET("/*path", deps.ChatHandler.DownloadFile)
		}

		uploadGroup := api.Group("/upload",
			deps.AuthMiddleware.AuthMiddleware(),
			middleware.RateLimitByUser(uploadLimit, time.Minute),
		)
		{
			uploadGroup.POST("", deps.UploadHandler.UploadFile)
		}

		// ── 群组路由 ──
		// 主路径 /groups；旧路径 /group 保留为兼容别名。
		for _, g := range []*gin.RouterGroup{
			api.Group("/groups", deps.AuthMiddleware.AuthMiddleware()),
			api.Group("/group", deps.AuthMiddleware.AuthMiddleware()),
		} {
			g.POST("", deps.ChatHandler.CreateGroup)
			g.POST("/", deps.ChatHandler.CreateGroup)
			g.GET("/:id", deps.ChatHandler.GetGroup)
			g.PUT("/:id", deps.ChatHandler.UpdateGroup)
			g.DELETE("/:id", deps.ChatHandler.DisbandGroup)
			g.POST("/:id/leave", deps.ChatHandler.LeaveGroup)
			g.GET("/:id/members", deps.ChatHandler.GetGroupMembers)
			g.POST("/:id/members", deps.ChatHandler.AddGroupMember)
			g.DELETE("/:id/members/:user_id", deps.ChatHandler.RemoveGroupMember)
			g.PUT("/:id/members/:user_id/role", deps.ChatHandler.UpdateMemberRole)
		}

		// ── 通话路由 ──
		// 主路径 /calls；旧路径 /call/* 保留为兼容别名。
		callsGroup := api.Group("/calls", deps.AuthMiddleware.AuthMiddleware())
		{
			callsGroup.GET("", deps.ChatHandler.GetUserCallRecords)
			callsGroup.POST("/initiate", deps.ChatHandler.InitiateCall)
			callsGroup.POST("/:id/accept", deps.ChatHandler.AcceptCall)
			callsGroup.POST("/:id/reject", deps.ChatHandler.RejectCall)
			callsGroup.POST("/:id/end", deps.ChatHandler.EndCall)
			callsGroup.GET("/:id", deps.ChatHandler.GetCallRecord)
		}

		// 兼容：旧通话路径
		callGroup := api.Group("/call", deps.AuthMiddleware.AuthMiddleware())
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
