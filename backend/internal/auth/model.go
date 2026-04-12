package auth

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// VerificationTokenType 验证令牌类型
const (
	TokenTypeEmailVerification = "email_verification"
	TokenTypePasswordReset     = "password_reset"
)

// VerificationToken 验证令牌模型
type VerificationToken struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	Token     string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"token"`
	Type      string         `gorm:"type:varchar(50);not null" json:"type"`
	ExpiresAt time.Time      `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (v *VerificationToken) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// IsExpired 检查令牌是否已过期
func (v *VerificationToken) IsExpired() bool {
	return time.Now().After(v.ExpiresAt)
}
