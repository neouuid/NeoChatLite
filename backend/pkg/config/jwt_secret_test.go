package config

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestValidateJWTSecret 生产环境不允许默认/弱密钥
func TestValidateJWTSecret(t *testing.T) {
	cases := []struct {
		name    string
		secret  string
		wantErr bool
		keyword string
	}{
		{"空密钥", "", true, "empty"},
		{"默认占位密钥", DefaultJWTSecret, true, "default placeholder"},
		{"过短", "short-secret", true, "too short"},
		{"足够强", strings.Repeat("a", 32), false, ""},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			cfg := &Config{JWT: JWTConfig{Secret: c.secret}}
			err := ValidateJWTSecret(cfg)
			if c.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), c.keyword)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
