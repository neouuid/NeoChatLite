package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/neochat/backend/pkg/config"
)

var Client *redis.Client
var ctx = context.Background()

// 缓存键前缀
const (
	KeyPrefixUser          = "user:"
	KeyPrefixConversation  = "conv:"
	KeyPrefixConversations = "convs:"
	KeyPrefixMessages      = "msgs:"
	KeyPrefixGroup         = "group:"
	KeyPrefixOnline        = "online:"
)

// 默认缓存过期时间
const (
	DefaultTTL      = 5 * time.Minute
	UserTTL         = 10 * time.Minute
	ConversationTTL = 5 * time.Minute
	MessagesTTL     = 2 * time.Minute
	OnlineTTL       = 30 * time.Second
)

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
	if Client == nil {
		return nil // Redis 未初始化，静默失败
	}
	return Client.Set(ctx, key, value, expiration).Err()
}

// Get 获取值
func Get(key string) (string, error) {
	if Client == nil {
		return "", fmt.Errorf("redis not initialized")
	}
	return Client.Get(ctx, key).Result()
}

// Delete 删除键
func Delete(key string) error {
	if Client == nil {
		return nil
	}
	return Client.Del(ctx, key).Err()
}

// DeleteByPattern 按模式删除键
func DeleteByPattern(pattern string) error {
	if Client == nil {
		return nil
	}
	iter := Client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		_ = Client.Del(ctx, iter.Val()).Err()
	}
	return iter.Err()
}

// Exists 检查键是否存在
func Exists(key string) (bool, error) {
	if Client == nil {
		return false, nil
	}
	result, err := Client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// SetJSON 设置 JSON 值
func SetJSON(key string, value interface{}, expiration time.Duration) error {
	if Client == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return Client.Set(ctx, key, data, expiration).Err()
}

// GetJSON 获取 JSON 值
func GetJSON(key string, dest interface{}) error {
	if Client == nil {
		return fmt.Errorf("redis not initialized")
	}
	data, err := Client.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(data), dest)
}

// SetUserOnline 设置用户在线状态
func SetUserOnline(userID string) error {
	if Client == nil {
		return nil
	}
	key := KeyPrefixOnline + userID
	return Client.Set(ctx, key, "1", OnlineTTL).Err()
}

// SetUserOffline 设置用户离线状态
func SetUserOffline(userID string) error {
	if Client == nil {
		return nil
	}
	key := KeyPrefixOnline + userID
	return Client.Del(ctx, key).Err()
}

// IsUserOnline 检查用户是否在线
func IsUserOnline(userID string) (bool, error) {
	if Client == nil {
		return false, nil
	}
	key := KeyPrefixOnline + userID
	exists, err := Client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

// InvalidateUserCache 失效用户相关缓存
func InvalidateUserCache(userID string) error {
	if Client == nil {
		return nil
	}
	Delete(KeyPrefixUser + userID)
	DeleteByPattern(KeyPrefixConversations + userID + ":*")
	return nil
}

// InvalidateConversationCache 失效会话相关缓存
func InvalidateConversationCache(convID string) error {
	if Client == nil {
		return nil
	}
	Delete(KeyPrefixConversation + convID)
	Delete(KeyPrefixMessages + convID)
	return nil
}

// Close 关闭 Redis 连接
func Close() error {
	if Client == nil {
		return nil
	}
	return Client.Close()
}
