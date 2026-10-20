package response

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestFailShowsPublicMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Fail(c, Public("message not found"), http.StatusBadRequest)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "message not found")
}

// TestFailHidesInternalError 数据库错误不能原样回给客户端
func TestFailHidesInternalError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	internal := errors.New(`ERROR: duplicate key value violates unique constraint "idx_user_email" (SQLSTATE 23505)`)
	Fail(c, internal, http.StatusBadRequest)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	body := w.Body.String()
	assert.Contains(t, body, "internal error")
	assert.NotContains(t, body, "SQLSTATE", "内部细节不能泄露")
	assert.NotContains(t, body, "idx_user_email", "表/索引名不能泄露")
}
