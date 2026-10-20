package response

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/neochat/backend/pkg/logger"
)

// PublicError 是可以直接展示给客户端的业务错误。
// 其它错误（数据库、序列化等）一律按内部错误处理，不把细节回给调用方。
type PublicError struct{ message string }

func (e *PublicError) Error() string { return e.message }

// Public 构造一个可对外展示的错误
func Public(message string) error { return &PublicError{message: message} }

// PublicMessage 取出可展示的错误文案
func PublicMessage(err error) (string, bool) {
	var pe *PublicError
	if errors.As(err, &pe) {
		return pe.message, true
	}
	return "", false
}

// Fail 统一处理 service 层错误：
//   - PublicError：用 fallbackStatus + 原始文案
//   - 其它错误：记录日志并返回 500「internal error」
//
// 之前的写法是 response.BadRequest(c, err.Error())，
// 会把 PostgreSQL / GORM 的原始错误（表名、约束名、SQLSTATE）直接抛给客户端。
func Fail(c *gin.Context, err error, fallbackStatus int) {
	if msg, ok := PublicMessage(err); ok {
		c.JSON(fallbackStatus, gin.H{"success": false, "message": msg})
		return
	}
	logger.Errorf("internal error: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "internal error"})
}
