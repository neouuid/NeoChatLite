package middleware

import (
	"testing"
	"time"

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
