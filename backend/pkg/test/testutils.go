// 测试工具包
package test

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/neochat/backend/pkg/config"
)

// TestDB 保存测试数据库实例
var TestDB *gorm.DB

// SetupTestConfig 设置测试配置
func SetupTestConfig(t *testing.T) *config.Config {
	t.Helper()
	return config.TestConfig()
}

// SetupTestDatabase 设置测试数据库（SQLite 内存数据库）
// 注意：调用者需要自己提供迁移模型
func SetupTestDatabase(t *testing.T, cfg *config.Config, models ...interface{}) *gorm.DB {
	t.Helper()

	dsn := cfg.Database.DSN()

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	}

	db, err := gorm.Open(sqlite.Open(dsn), gormConfig)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("Failed to get database instance: %v", err)
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetMaxOpenConns(1)

	// 执行迁移
	if len(models) > 0 {
		log.Println("Running test database migrations...")
		err = db.AutoMigrate(models...)
		if err != nil {
			t.Fatalf("Failed to migrate test database: %v", err)
		}
	}

	TestDB = db
	return db
}

// CleanupTestDatabase 清理测试数据库
func CleanupTestDatabase(t *testing.T) {
	t.Helper()
	if TestDB != nil {
		sqlDB, err := TestDB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// MakeRequest 执行测试请求
func MakeRequest(t *testing.T, router *gin.Engine, method, path string, body interface{}, authToken ...string) *httptest.ResponseRecorder {
	t.Helper()

	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		if err != nil {
			t.Fatalf("Failed to marshal request body: %v", err)
		}
	}

	req, err := http.NewRequest(method, path, bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	if len(authToken) > 0 && authToken[0] != "" {
		req.Header.Set("Authorization", "Bearer "+authToken[0])
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	return w
}

// ParseResponse 解析响应
func ParseResponse(t *testing.T, w *httptest.ResponseRecorder, target interface{}) {
	t.Helper()

	if err := json.Unmarshal(w.Body.Bytes(), target); err != nil {
		t.Fatalf("Failed to parse response: %v, body: %s", err, w.Body.String())
	}
}

// AssertStatus 断言状态码
func AssertStatus(t *testing.T, w *httptest.ResponseRecorder, expected int) {
	t.Helper()

	if w.Code != expected {
		t.Errorf("Expected status %d, got %d, body: %s", expected, w.Code, w.Body.String())
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

// APISuccessResponse 通用 API 成功响应
type APISuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

// APIErrorResponse 通用 API 错误响应
type APIErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Message string `json:"message"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       uuid.UUID `json:"id"`
		Username string    `json:"username"`
		Email    string    `json:"email"`
		Nickname string    `json:"nickname"`
	} `json:"user"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
