package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/response"
	"github.com/neochat/backend/pkg/utils"
)

// Middleware 认证中间件
type Middleware struct {
	config *config.Config
}

func NewMiddleware(cfg *config.Config) *Middleware {
	return &Middleware{config: cfg}
}

// AuthMiddleware JWT认证中间件
func (m *Middleware) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从Authorization header获取token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "authorization header is required")
			c.Abort()
			return
		}

		// 检查Bearer前缀
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			response.Unauthorized(c, "authorization header format must be Bearer {token}")
			c.Abort()
			return
		}

		// 解析token
		claims, err := utils.ParseToken(parts[1], m.config)
		if err != nil {
			response.Unauthorized(c, "invalid or expired token")
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("user_id", claims.UserID.String())
		c.Set("username", claims.Username)

		c.Next()
	}
}

// OptionalAuthMiddleware 可选认证中间件（token存在则解析，不存在也继续）
func (m *Middleware) OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.Next()
			return
		}

		claims, err := utils.ParseToken(parts[1], m.config)
		if err == nil {
			c.Set("user_id", claims.UserID.String())
			c.Set("username", claims.Username)
		}

		c.Next()
	}
}
