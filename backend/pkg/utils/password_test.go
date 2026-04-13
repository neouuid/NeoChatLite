package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "正常密码加密",
			password: "testPassword123",
			wantErr:  false,
		},
		{
			name:     "空密码加密",
			password: "",
			wantErr:  false,
		},
		{
			name:     "长密码加密（bcrypt 限制在 72 字节内）",
			password: "this-is-a-long-password-within-72-bytes-limit",
			wantErr:  false,
		},
		{
			name:     "特殊字符密码",
			password: "P@ssw0rd!#$%^&*()",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			assert.NotEmpty(t, hash)
			assert.NotEqual(t, tt.password, hash)
		})
	}
}

func TestCheckPasswordHash(t *testing.T) {
	// 首先创建一个测试密码的哈希
	testPassword := "testPassword123"
	hash, err := HashPassword(testPassword)
	assert.NoError(t, err)

	tests := []struct {
		name     string
		password string
		hash     string
		want     bool
	}{
		{
			name:     "正确密码验证",
			password: testPassword,
			hash:     hash,
			want:     true,
		},
		{
			name:     "错误密码验证",
			password: "wrongPassword",
			hash:     hash,
			want:     false,
		},
		{
			name:     "空密码验证",
			password: "",
			hash:     hash,
			want:     false,
		},
		{
			name:     "无效哈希验证",
			password: testPassword,
			hash:     "invalid-hash",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPasswordHash(tt.password, tt.hash)
			assert.Equal(t, tt.want, result)
		})
	}
}

func TestHashPasswordConsistency(t *testing.T) {
	password := "consistentPassword123"

	// 两次加密应该产生不同的哈希（因为盐值不同）
	hash1, err := HashPassword(password)
	assert.NoError(t, err)

	hash2, err := HashPassword(password)
	assert.NoError(t, err)

	assert.NotEqual(t, hash1, hash2, "两次加密应该产生不同的哈希值")

	// 但两个哈希都应该能验证原始密码
	assert.True(t, CheckPasswordHash(password, hash1))
	assert.True(t, CheckPasswordHash(password, hash2))
}
