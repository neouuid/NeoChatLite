package middleware

import (
	"sync"
	"testing"

	"github.com/gin-gonic/gin"
	"net/http/httptest"
)

func TestMetricsConcurrentWrites(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(MetricsMiddleware())
	r.GET("/x", func(c *gin.Context) { c.Status(200) })

	var wg sync.WaitGroup
	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", "/x", nil)
			r.ServeHTTP(w, req)
		}()
	}
	wg.Wait()
}
