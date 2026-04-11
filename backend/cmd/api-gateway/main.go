package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/database"
	"github.com/neochat/backend/pkg/redis"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	if err := database.Init(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// 自动迁移数据库
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化 Redis
	if err := redis.Init(cfg); err != nil {
		log.Printf("Warning: Failed to initialize Redis: %v", err)
		log.Println("Continuing without Redis...")
	}
	defer func() {
		if redis.Client != nil {
			if err := redis.Close(); err != nil {
				log.Printf("Error closing Redis: %v", err)
			}
		}
	}()

	// 设置 Gin
	r := gin.Default()

	// 健康检查
	r.GET("/health", healthHandler)
	r.GET("/health/db", dbHealthHandler)
	r.GET("/health/redis", redisHealthHandler)

	// API 路由
	api := r.Group("/api/v1")
	{
		api.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "NeoChat API v1",
				"version": "1.0.0",
			})
		})
	}

	// 启动服务器
	srv := &http.Server{
		Addr:         ":" + string(rune(cfg.Server.Port)),
		Handler:      r,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	// 在 goroutine 中启动服务器
	go func() {
		log.Printf("Server starting on port %d", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号来优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// 设置 5 秒的超时时间
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
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
