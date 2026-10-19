package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/neochat/backend/pkg/config"
)

// 令牌类型。access 用于调用接口，refresh 只能用于换发新令牌。
// 不区分类型的话，access token 可以直接当 refresh token 用（无限续期），
// refresh token 也能直接当访问令牌用（7 天有效）。
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Claims JWT 声明
type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Username  string    `json:"username,omitempty"`
	TokenType string    `json:"typ"`
	jwt.RegisteredClaims
}

// GenerateToken 生成访问令牌
func GenerateToken(userID uuid.UUID, username string, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(time.Hour * time.Duration(cfg.JWT.ExpiryHour))
	claims := &Claims{
		UserID:    userID,
		Username:  username,
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.NewString(),
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

// GenerateRefreshToken 生成刷新令牌
func GenerateRefreshToken(userID uuid.UUID, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(time.Hour * 24 * 7) // 7天
	claims := &Claims{
		UserID:    userID,
		TokenType: TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.NewString(),
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

// ParseToken 解析令牌（不校验类型，仅内部使用）
func ParseToken(tokenString string, cfg *config.Config) (*Claims, error) {
	return parseToken(tokenString, cfg, "")
}

// ParseAccessToken 解析访问令牌，拒绝 refresh token
func ParseAccessToken(tokenString string, cfg *config.Config) (*Claims, error) {
	return parseToken(tokenString, cfg, TokenTypeAccess)
}

// ParseRefreshToken 解析刷新令牌，拒绝 access token
func ParseRefreshToken(tokenString string, cfg *config.Config) (*Claims, error) {
	return parseToken(tokenString, cfg, TokenTypeRefresh)
}

func parseToken(tokenString string, cfg *config.Config, expectedType string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(cfg.JWT.Secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	if expectedType != "" && claims.TokenType != expectedType {
		return nil, errors.New("unexpected token type")
	}
	return claims, nil
}
