// 测试工具包
package test

import (
	"os"
	"testing"

	"github.com/neochat/backend/pkg/config"
)

// SetupTestConfig 设置测试配置
func SetupTestConfig(t *testing.T) *config.Config {
	t.Helper()

	// 首先尝试加载实际配置
	cfg := config.Load()
	if cfg != nil {
		return cfg
	}

	// 如果找不到配置文件，使用默认配置
	return &config.Config{
		Server: config.ServerConfig{
			Port:         8080,
			ReadTimeout:  30,
			WriteTimeout: 30,
			LogLevel:     "info",
		},
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     5432,
			User:     "test",
			Password: "test",
			DBName:   "neochat_test",
			SSLMode:  "disable",
		},
		Redis: config.RedisConfig{
			Host:     "localhost",
			Port:     6379,
			Password: "",
			DB:       0,
		},
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}
}

// SkipIntegrationTests 检查是否跳过集成测试
func SkipIntegrationTests(t *testing.T) {
	t.Helper()
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration tests. Set RUN_INTEGRATION_TESTS=true to run.")
	}
}

// StringPtr 返回字符串指针
func StringPtr(s string) *string {
	return &s
}

// IntPtr 返回整数指针
func IntPtr(i int) *int {
	return &i
}
