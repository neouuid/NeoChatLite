package auth

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/test"
	"github.com/neochat/backend/pkg/utils"
)

// 测试库是共享内存 sqlite（cache=shared），每个用例各开一个连接池会互相等锁。
// 因此整个测试文件共用一份句柄。
var (
	secSeq  int64
	secOnce sync.Once
	secCfg  *config.Config
	secDB   *gorm.DB
	secSvc  *Service
	secRepo *Repository
)

func securityFixture(t *testing.T) (*Service, *Repository, *user.User) {
	t.Helper()
	test.SkipIntegrationTests(t)

	secOnce.Do(func() {
		secCfg = test.SetupTestConfig(t)

		// 用独立的临时文件库：包的其它测试文件也在用 TestDB 全局，
		// 共享内存库会被互相关闭/干扰。
		dir, err := os.MkdirTemp("", "neochat-auth-sec-*")
		require.NoError(t, err)
		dsn := filepath.Join(dir, "security.db")

		secDB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		require.NoError(t, err)
		require.NoError(t, secDB.AutoMigrate(
			&user.User{},
			&user.Friend{},
			&user.Blocklist{},
			&VerificationToken{},
			&RefreshToken{},
		))

		secRepo = NewRepository(secDB)
		secSvc = NewService(secRepo, secCfg, email.NewService(secCfg))
	})

	seq := atomic.AddInt64(&secSeq, 1)
	u := &user.User{
		ID:       uuid.New(),
		Username: fmt.Sprintf("sec_%d_%s", seq, uuid.NewString()[:8]),
		Email:    fmt.Sprintf("sec_%d_%s@example.com", seq, uuid.NewString()[:8]),
		Phone:    fmt.Sprintf("130001%05d", seq),
	}
	hash, err := utils.HashPassword("Passw0rd!")
	require.NoError(t, err)
	u.Password = hash
	require.NoError(t, secDB.Create(u).Error)

	return secSvc, secRepo, u
}

// TestAccessTokenCannotRefresh access token 不能用来换发新令牌
func TestAccessTokenCannotRefresh(t *testing.T) {
	svc, _, u := securityFixture(t)

	accessToken, err := utils.GenerateToken(u.ID, u.Username, secCfg)
	require.NoError(t, err)

	_, err = svc.RefreshToken(accessToken)
	require.Error(t, err, "access token 不应被接受为刷新令牌")
	assert.Contains(t, err.Error(), "invalid refresh token")
}

// TestRefreshTokenRotation 刷新令牌一次性使用，重放会让该用户全部令牌失效
func TestRefreshTokenRotation(t *testing.T) {
	svc, _, u := securityFixture(t)

	resp, err := svc.Login(&LoginRequest{Identifier: u.Username, Password: "Passw0rd!"})
	require.NoError(t, err)
	first := resp.RefreshToken

	rotated, err := svc.RefreshToken(first)
	require.NoError(t, err)
	assert.NotEqual(t, first, rotated.RefreshToken)

	// 重放旧令牌：拒绝，并吊销该用户全部刷新令牌
	_, err = svc.RefreshToken(first)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already used")

	// 全量吊销后，刚发的新令牌也失效
	_, err = svc.RefreshToken(rotated.RefreshToken)
	assert.Error(t, err)
}

// TestLogoutRevokesRefreshTokens 登出后刷新令牌不可再用
func TestLogoutRevokesRefreshTokens(t *testing.T) {
	svc, _, u := securityFixture(t)

	resp, err := svc.Login(&LoginRequest{Identifier: u.Username, Password: "Passw0rd!"})
	require.NoError(t, err)

	require.NoError(t, svc.Logout(u.ID))

	_, err = svc.RefreshToken(resp.RefreshToken)
	assert.Error(t, err, "登出后刷新令牌应失效")
}

// TestLoginLockoutAfterRepeatedFailures 连续失败后账号被锁定
func TestLoginLockoutAfterRepeatedFailures(t *testing.T) {
	svc, _, u := securityFixture(t)
	_, _, other := securityFixture(t)

	for i := 0; i < 5; i++ {
		_, err := svc.Login(&LoginRequest{Identifier: u.Username, Password: "wrong-password"})
		require.Error(t, err)
	}

	// 即使密码正确也应被锁定
	_, err := svc.Login(&LoginRequest{Identifier: u.Username, Password: "Passw0rd!"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "too many failed attempts")

	// 其它账号不受影响
	_, err = svc.Login(&LoginRequest{Identifier: other.Username, Password: "Passw0rd!"})
	assert.NoError(t, err)
}

// TestPasswordPolicy 注册/改密必须满足最小长度
func TestPasswordPolicy(t *testing.T) {
	svc, _, u := securityFixture(t)

	_, err := svc.Register(&RegisterRequest{Username: "shortpw", Password: "1234567"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least 8")

	err = svc.ChangePassword(u.ID, &ChangePasswordRequest{
		OldPassword: "Passw0rd!",
		NewPassword: "short",
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least 8")
}

// TestRefreshTokenRecordExpiry 过期记录不可用
func TestRefreshTokenRecordExpiry(t *testing.T) {
	svc, repo, u := securityFixture(t)

	token, err := utils.GenerateRefreshToken(u.ID, secCfg)
	require.NoError(t, err)
	claims, err := utils.ParseRefreshToken(token, secCfg)
	require.NoError(t, err)

	require.NoError(t, repo.CreateRefreshToken(&RefreshToken{
		ID:        uuid.MustParse(claims.ID),
		UserID:    u.ID,
		TokenHash: hashToken(token),
		ExpiresAt: time.Now().Add(-time.Minute),
	}))

	_, err = svc.RefreshToken(token)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "expired")
}
