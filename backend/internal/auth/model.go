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
	UserID    uuid.UUID      `gorm:"type:uuid;index:idx_token_user_id;not null" json:"user_id"`
	Token     string         `gorm:"type:varchar(255);uniqueIndex:idx_token_unique;not null" json:"token"`
	Type      string         `gorm:"type:varchar(50);index:idx_token_type;not null" json:"type"`
	ExpiresAt time.Time      `gorm:"index:idx_token_expires;not null" json:"expires_at"`
	CreatedAt time.Time      `gorm:"index:idx_token_created_at" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_token_deleted_at" json:"-"`
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
