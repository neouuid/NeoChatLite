package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/response"
	"github.com/neochat/backend/pkg/utils"
)

// CORSMiddleware CORS中间件
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		allowOrigins := cfg.Server.CORS.AllowOrigins
		if len(allowOrigins) == 0 {
			allowOrigins = []string{"*"}
		}

		allowMethods := cfg.Server.CORS.AllowMethods
		if len(allowMethods) == 0 {
			allowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
		}

		allowHeaders := cfg.Server.CORS.AllowHeaders
		if len(allowHeaders) == 0 {
			allowHeaders = []string{"*"}
		}

		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			// 检查origin是否在允许列表中
			allowed := false
			for _, o := range allowOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}
			if allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			}
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowOrigins[0])
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", strings.Join(allowMethods, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Headers", strings.Join(allowHeaders, ", "))

		// 处理OPTIONS预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

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
