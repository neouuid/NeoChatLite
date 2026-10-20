package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/stretchr/testify/assert"
)

// TestRateLimiterAllowsUpToBurst 令牌桶：最多 burst 次，之后拒绝
func TestRateLimiterAllowsUpToBurst(t *testing.T) {
	now := time.Now()
	rl := NewRateLimiter(3, time.Minute)
	rl.now = func() time.Time { return now }

	assert.True(t, rl.Allow("1.2.3.4"))
	assert.True(t, rl.Allow("1.2.3.4"))
	assert.True(t, rl.Allow("1.2.3.4"))
	assert.False(t, rl.Allow("1.2.3.4"), "超出 burst 后应被拒绝")

	// 其它 IP 不受影响
	assert.True(t, rl.Allow("5.6.7.8"))
}

// TestRateLimiterRefills 时间推进后令牌会补充
func TestRateLimiterRefills(t *testing.T) {
	now := time.Now()
	rl := NewRateLimiter(2, time.Minute) // 2 次/分钟
	rl.now = func() time.Time { return now }

	assert.True(t, rl.Allow("ip"))
	assert.True(t, rl.Allow("ip"))
	assert.False(t, rl.Allow("ip"))

	// 30 秒后补充 1 个令牌
	now = now.Add(30 * time.Second)
	assert.True(t, rl.Allow("ip"))
	assert.False(t, rl.Allow("ip"))
}

// TestRateLimitByUserIsolatesUsers 限流按用户隔离：一个用户被限不影响另一个
func TestRateLimitByUserIsolatesUsers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	// 模拟认证中间件：从查询参数取 user_id
	r.Use(func(c *gin.Context) {
		c.Set("user_id", c.Query("u"))
		c.Next()
	})
	r.POST("/m", RateLimitByUser(2, time.Minute), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	call := func(user string) int {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/m?u="+user, nil)
		r.ServeHTTP(w, req)
		return w.Code
	}

	assert.Equal(t, http.StatusOK, call("alice"))
	assert.Equal(t, http.StatusOK, call("alice"))
	assert.Equal(t, http.StatusTooManyRequests, call("alice"), "同一用户超出上限应 429")

	// 另一个用户不受影响
	assert.Equal(t, http.StatusOK, call("bob"))
	assert.Equal(t, http.StatusOK, call("bob"))
	assert.Equal(t, http.StatusTooManyRequests, call("bob"))
}
