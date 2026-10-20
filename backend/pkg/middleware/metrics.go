// 性能监控中间件
package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Metrics 保存性能指标数据
type Metrics struct {
	TotalRequests   int64
	RequestsPerPath map[string]int64
	ResponseTimes   map[string][]time.Duration
	ErrorCount      int64
	ErrorsPerPath   map[string]int64
	StartTime       time.Time
}

// mu 保护 globalMetrics：中间件会在每个请求的 goroutine 里写它，
// 没有锁时并发写 map 会触发 "fatal error: concurrent map writes"（进程直接退出）。
var mu sync.Mutex

var globalMetrics = &Metrics{
	RequestsPerPath: make(map[string]int64),
	ResponseTimes:   make(map[string][]time.Duration),
	ErrorsPerPath:   make(map[string]int64),
	StartTime:       time.Now(),
}

// MetricsMiddleware 性能监控中间件
func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()

		mu.Lock()
		globalMetrics.TotalRequests++
		globalMetrics.RequestsPerPath[path]++
		mu.Unlock()

		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()

		mu.Lock()
		// 记录响应时间，只保留最近 1000 个
		times := append(globalMetrics.ResponseTimes[path], duration)
		if len(times) > 1000 {
			times = times[len(times)-1000:]
		}
		globalMetrics.ResponseTimes[path] = times

		if status >= 400 {
			globalMetrics.ErrorCount++
			globalMetrics.ErrorsPerPath[path]++
		}
		mu.Unlock()
	}
}

// GetMetrics 获取当前性能指标
func GetMetrics() map[string]interface{} {
	mu.Lock()
	defer mu.Unlock()

	result := make(map[string]interface{})

	result["total_requests"] = globalMetrics.TotalRequests
	result["error_count"] = globalMetrics.ErrorCount
	result["uptime_seconds"] = time.Since(globalMetrics.StartTime).Seconds()
	result["requests_per_path"] = globalMetrics.RequestsPerPath
	result["errors_per_path"] = globalMetrics.ErrorsPerPath

	// 计算平均响应时间
	avgResponseTimes := make(map[string]string)
	for path, times := range globalMetrics.ResponseTimes {
		if len(times) > 0 {
			var total time.Duration
			for _, t := range times {
				total += t
			}
			avg := total / time.Duration(len(times))
			avgResponseTimes[path] = avg.String()
		}
	}
	result["avg_response_times"] = avgResponseTimes

	// 计算 P95 响应时间
	p95ResponseTimes := make(map[string]string)
	for path, times := range globalMetrics.ResponseTimes {
		if len(times) > 0 {
			p95 := calculatePercentile(times, 95)
			p95ResponseTimes[path] = p95.String()
		}
	}
	result["p95_response_times"] = p95ResponseTimes

	return result
}

// ResetMetrics 重置指标
func ResetMetrics() {
	globalMetrics = &Metrics{
		RequestsPerPath: make(map[string]int64),
		ResponseTimes:   make(map[string][]time.Duration),
		ErrorsPerPath:   make(map[string]int64),
		StartTime:       time.Now(),
	}
}

// calculatePercentile 计算百分位数
func calculatePercentile(times []time.Duration, percentile int) time.Duration {
	if len(times) == 0 {
		return 0
	}

	// 简单排序
	n := len(times)
	sorted := make([]time.Duration, n)
	copy(sorted, times)

	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if sorted[j] > sorted[j+1] {
				sorted[j], sorted[j+1] = sorted[j+1], sorted[j]
			}
		}
	}

	index := (percentile * n) / 100
	if index >= n {
		index = n - 1
	}
	return sorted[index]
}

// MetricsHandler 返回性能指标的 HTTP 处理器
func MetricsHandler(c *gin.Context) {
	metrics := GetMetrics()
	c.JSON(200, gin.H{
		"success": true,
		"data":    metrics,
	})
}
