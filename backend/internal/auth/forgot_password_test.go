package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/test"
	"github.com/neochat/backend/pkg/utils"
)

// 与 security_test.go 同样的原因：共享内存库会让包内多个测试文件互相等锁，
// 这里用独立的临时文件库。
var (
	forgotOnce sync.Once
	forgotDB   *gorm.DB
)

func forgotFixture(t *testing.T) *gorm.DB {
	t.Helper()
	forgotOnce.Do(func() {
		dir, err := os.MkdirTemp("", "neochat-forgot-*")
		require.NoError(t, err)
		forgotDB, err = gorm.Open(sqlite.Open(filepath.Join(dir, "forgot.db")), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		require.NoError(t, err)
		require.NoError(t, forgotDB.AutoMigrate(&user.User{}, &VerificationToken{}, &RefreshToken{}))
	})
	return forgotDB
}

func forgotRouter(t *testing.T, exposeToken bool) (*gin.Engine, string) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	cfg := test.SetupTestConfig(t)
	cfg.Server.ExposeResetToken = exposeToken
	db := forgotFixture(t)

	h := NewHandler(NewService(NewRepository(db), cfg, email.NewService(cfg)), cfg)

	r := gin.New()
	r.POST("/auth/forgot-password", h.ForgotPassword)

	username := "forgot_" + uuid.NewString()[:8]
	emailAddr := username + "@example.com"
	u := &user.User{
		ID:       uuid.New(),
		Username: username,
		Email:    emailAddr,
		Phone:    "130" + uuid.NewString()[:8],
	}
	hash, err := utils.HashPassword("Passw0rd!")
	require.NoError(t, err)
	u.Password = hash
	require.NoError(t, db.Create(u).Error)

	return r, emailAddr
}

func postForgot(t *testing.T, r *gin.Engine, body string) (int, map[string]interface{}) {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/auth/forgot-password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return w.Code, resp
}

// TestForgotPasswordHidesTokenByDefault 默认不把重置令牌回传给客户端
func TestForgotPasswordHidesTokenByDefault(t *testing.T) {
	test.SkipIntegrationTests(t)

	r, emailAddr := forgotRouter(t, false)
	code, resp := postForgot(t, r, `{"email":"`+emailAddr+`"}`)

	assert.Equal(t, http.StatusOK, code)
	data, _ := resp["data"].(map[string]interface{})
	require.NotNil(t, data)
	assert.NotContains(t, data, "token", "生产行为不应返回重置令牌")
}

// TestForgotPasswordExposesTokenForDev 开发模式下回传令牌，便于无 SMTP 时联调
func TestForgotPasswordExposesTokenForDev(t *testing.T) {
	test.SkipIntegrationTests(t)

	r, emailAddr := forgotRouter(t, true)
	code, resp := postForgot(t, r, `{"email":"`+emailAddr+`"}`)

	assert.Equal(t, http.StatusOK, code)
	data, _ := resp["data"].(map[string]interface{})
	require.NotNil(t, data)
	token, _ := data["token"].(string)
	assert.NotEmpty(t, token, "开发模式应返回重置令牌")
}

// TestForgotPasswordDoesNotLeakAccountExistence 未知邮箱也返回同样的成功响应
func TestForgotPasswordDoesNotLeakAccountExistence(t *testing.T) {
	test.SkipIntegrationTests(t)

	r, _ := forgotRouter(t, false)
	code, resp := postForgot(t, r, `{"email":"nobody@example.com"}`)

	assert.Equal(t, http.StatusOK, code, "不要用 404 暴露邮箱是否注册")
	assert.Equal(t, true, resp["success"])
}

func TestNonProductionInTests(t *testing.T) {
	assert.False(t, config.IsProduction())
}
