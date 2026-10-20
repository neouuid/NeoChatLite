package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// rateBucket 令牌桶
type rateBucket struct {
	tokens float64
	last   time.Time
}

// RateLimiter 按 key（通常是客户端 IP）限流。
//
// 单实例内存实现：多实例部署时应换成 Redis 计数，
// 否则每个实例各自允许 limit 次。
type RateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*rateBucket
	// rate 每秒补充的令牌数；burst 桶容量
	rate  float64
	burst float64
	now   func() time.Time
}

// NewRateLimiter 在 window 时间内最多允许 limit 次请求
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		buckets: make(map[string]*rateBucket),
		rate:    float64(limit) / window.Seconds(),
		burst:   float64(limit),
		now:     time.Now,
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		cutoff := rl.now().Add(-10 * time.Minute)
		rl.mu.Lock()
		for key, bucket := range rl.buckets {
			if bucket.last.Before(cutoff) {
				delete(rl.buckets, key)
			}
		}
		rl.mu.Unlock()
	}
}

// Allow 消耗一个令牌，返回是否放行
func (rl *RateLimiter) Allow(key string) bool {
	now := rl.now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, ok := rl.buckets[key]
	if !ok {
		rl.buckets[key] = &rateBucket{tokens: rl.burst - 1, last: now}
		return true
	}

	// 按经过时间补充令牌
	elapsed := now.Sub(bucket.last).Seconds()
	bucket.tokens += elapsed * rl.rate
	if bucket.tokens > rl.burst {
		bucket.tokens = rl.burst
	}
	bucket.last = now

	if bucket.tokens < 1 {
		return false
	}
	bucket.tokens--
	return true
}

// RateLimitByIP 基于客户端 IP 的限流中间件
func RateLimitByIP(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	return func(c *gin.Context) {
		if !limiter.Allow(c.ClientIP()) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "too many requests, please slow down",
			})
			return
		}
		c.Next()
	}
}

// RateLimitByUser 按用户维度限流（需在认证中间件之后使用）。
//
// 认证接口按 IP 限流是为了挡撞库；而消息、上传这类"已登录后的高频写操作"
// 应该按用户限流：同一 NAT 后面的大量用户不该被互相牵连，
// 但单个账号刷屏必须被挡住。
func RateLimitByUser(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		userID, _ := userIDVal.(string)
		if !exists || userID == "" {
			// 理论上不会发生（认证中间件已拦截），这里保守放行
			c.Next()
			return
		}

		if !limiter.Allow(userID) {
			retryAfter := int(window.Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "too many requests, please slow down",
			})
			return
		}
		c.Next()
	}
}
