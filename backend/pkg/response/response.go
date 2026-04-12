package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ApiResponse 标准API响应格式
type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMessage 成功响应（带消息）
func SuccessWithMessage(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// Error 错误响应
func Error(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ApiResponse{
		Success: false,
		Message: message,
	})
}

// ErrorWithDetails 错误响应（带详情）
func ErrorWithDetails(c *gin.Context, statusCode int, message string, errors interface{}) {
	c.JSON(statusCode, ApiResponse{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}

// BadRequest 400错误
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// Unauthorized 401错误
func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, message)
}

// NotFound 404错误
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message)
}

// InternalServerError 500错误
func InternalServerError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message)
}
