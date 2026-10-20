package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func newLimitRouter(maxBytes, uploadMax int64) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(BodyLimit(maxBytes, uploadMax))
	r.POST("/api/v1/chat/messages", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.POST("/api/v1/upload", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func TestBodyLimitRejectsOversizedJSON(t *testing.T) {
	r := newLimitRouter(1024, 4096)

	body := `{"content":"` + strings.Repeat("x", 2048) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/messages", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusRequestEntityTooLarge, w.Code)
	assert.Contains(t, w.Body.String(), "request body too large")
}

func TestBodyLimitAllowsUploadUpToLargerLimit(t *testing.T) {
	r := newLimitRouter(1024, 8192)

	// 3KB：超过普通接口上限，但在上传上限内
	body := strings.Repeat("x", 3072)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", strings.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "上传接口应使用放宽后的上限")
}

func TestBodyLimitAllowsSmallBody(t *testing.T) {
	r := newLimitRouter(1024, 8192)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/messages", strings.NewReader(`{"content":"hi"}`))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}
