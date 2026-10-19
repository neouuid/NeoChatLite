package middleware

import "github.com/gin-gonic/gin"

// SecurityHeaders 设置一组基础安全响应头。
//
// 这些头不能替代正确的输入校验，但能挡掉一批常见的浏览器侧攻击
// （MIME 嗅探、点击劫持、referrer 泄露）。
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.Writer.Header()
		header.Set("X-Content-Type-Options", "nosniff")
		header.Set("X-Frame-Options", "DENY")
		header.Set("Referrer-Policy", "no-referrer")
		header.Set("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self)")

		// 仅在 TLS 终结于本服务时下发 HSTS
		if c.Request.TLS != nil {
			header.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		c.Next()
	}
}
