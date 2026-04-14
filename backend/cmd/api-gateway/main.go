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
	"github.com/neochat/backend/pkg/email"
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

	// 初始化各模块
	emailService := email.NewService(cfg)
	authRepo := auth.NewRepository(database.DB)
	authService := auth.NewService(authRepo, cfg, emailService)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.NewMiddleware(cfg)

	userRepo := user.NewRepository(database.DB)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	chatRepo := chat.NewRepository(database.DB)
	chatService := chat.NewService(chatRepo)
	chatHandler := chat.NewHandler(chatService)
	uploadHandler := chat.NewUploadHandler(chatService, cfg)
	wsHub := chat.NewWebSocketHub(chatService, cfg)
	chatService.SetWebSocketHub(wsHub)
	go wsHub.Run()

	// 设置路由
	deps := &HandlerDependencies{
		AuthHandler:    authHandler,
		UserHandler:    userHandler,
		ChatHandler:    chatHandler,
		UploadHandler:  uploadHandler,
		WsHub:          wsHub,
		AuthMiddleware: authMiddleware,
		Cfg:            cfg,
	}
	SetupRoutes(r, deps)

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
