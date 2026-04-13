package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/neochat/backend/pkg/config"
	"github.com/stretchr/testify/assert"
)

func TestGenerateToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	userID := uuid.New()
	username := "testuser"

	token, err := GenerateToken(userID, username, cfg)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestGenerateRefreshToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	userID := uuid.New()

	token, err := GenerateRefreshToken(userID, cfg)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestParseToken_Valid(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	userID := uuid.New()
	username := "testuser"

	token, err := GenerateToken(userID, username, cfg)
	assert.NoError(t, err)

	claims, err := ParseToken(token, cfg)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
}

func TestParseToken_InvalidSecret(t *testing.T) {
	cfg1 := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key-1",
			ExpiryHour: 24,
		},
	}

	cfg2 := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key-2",
			ExpiryHour: 24,
		},
	}

	userID := uuid.New()
	username := "testuser"

	token, err := GenerateToken(userID, username, cfg1)
	assert.NoError(t, err)

	claims, err := ParseToken(token, cfg2)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestParseToken_InvalidToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	claims, err := ParseToken("invalid-token", cfg)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestParseToken_Expired(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	// 创建一个已过期的 token
	userID := uuid.New()
	username := "testuser"
	expirationTime := time.Now().Add(-time.Hour) // 1小时前已过期

	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.JWT.Secret))
	assert.NoError(t, err)

	parsedClaims, err := ParseToken(tokenString, cfg)
	assert.Error(t, err)
	assert.Nil(t, parsedClaims)
}

func TestTokenDifferentUsers(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
	}

	user1ID := uuid.New()
	user1Name := "user1"

	user2ID := uuid.New()
	user2Name := "user2"

	token1, err := GenerateToken(user1ID, user1Name, cfg)
	assert.NoError(t, err)

	token2, err := GenerateToken(user2ID, user2Name, cfg)
	assert.NoError(t, err)

	// 两个 token 应该不同
	assert.NotEqual(t, token1, token2)

	// 解析 token1 应该得到 user1
	claims1, err := ParseToken(token1, cfg)
	assert.NoError(t, err)
	assert.Equal(t, user1ID, claims1.UserID)
	assert.Equal(t, user1Name, claims1.Username)

	// 解析 token2 应该得到 user2
	claims2, err := ParseToken(token2, cfg)
	assert.NoError(t, err)
	assert.Equal(t, user2ID, claims2.UserID)
	assert.Equal(t, user2Name, claims2.Username)
}
