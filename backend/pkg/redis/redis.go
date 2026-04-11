package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/neochat/backend/pkg/config"
)

var Client *redis.Client
var ctx = context.Background()

// Init 初始化 Redis 连接
func Init(cfg *config.Config) error {
	Client = redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
		PoolSize: 10,
	})

	// 测试连接
	pong, err := Client.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to redis: %w", err)
	}

	log.Printf("Redis connected successfully: %s", pong)
	return nil
}

// Set 设置键值
func Set(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(ctx, key, value, expiration).Err()
}

// Get 获取值
func Get(key string) (string, error) {
	return Client.Get(ctx, key).Result()
}

// Delete 删除键
func Delete(key string) error {
	return Client.Del(ctx, key).Err()
}

// Exists 检查键是否存在
func Exists(key string) (bool, error) {
	result, err := Client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// SetJSON 设置 JSON 值
func SetJSON(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(ctx, key, value, expiration).Err()
}

// Close 关闭 Redis 连接
func Close() error {
	return Client.Close()
}
