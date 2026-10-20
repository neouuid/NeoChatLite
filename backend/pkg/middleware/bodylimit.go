// 请求体大小限制
package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// MaxBytesError 与标准库 http.MaxBytesError 对齐，便于判断
func isBodyTooLarge(err error) bool {
	var maxErr *http.MaxBytesError
	return errors.As(err, &maxErr)
}

// BodyLimit 限制请求体大小。
//
// - 普通 JSON 接口用 maxBytes（默认 8MB）：消息正文再大也不该走这里
// - 上传接口用 uploadMaxBytes：文件本身由 handler 按类型校验，这里只兜底
//
// 没有这个中间件时，一个客户端可以 POST 任意大小的 body，
// 服务端会整个读进内存再解析。
func BodyLimit(maxBytes, uploadMaxBytes int64) gin.HandlerFunc {
	if maxBytes <= 0 {
		maxBytes = 8 << 20
	}
	if uploadMaxBytes <= 0 {
		uploadMaxBytes = 256 << 20
	}

	return func(c *gin.Context) {
		limit := maxBytes
		if strings.Contains(c.FullPath(), "/upload") {
			limit = uploadMaxBytes
		}

		// 有 Content-Length 时先快速拒绝，避免白读一遍
		if c.Request.ContentLength > limit {
			abortTooLarge(c, limit)
			return
		}

		// 分块传输没有 Content-Length，用 MaxBytesReader 兜底
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		c.Next()
	}
}

func abortTooLarge(c *gin.Context, limit int64) {
	c.Header("Connection", "close")
	c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
		"success": false,
		"message": "request body too large",
		"limit":   limit,
	})
}

// BodyTooLarge 供 handler 在读取 body 失败后判断是否是超限
func BodyTooLarge(err error) bool { return isBodyTooLarge(err) }
