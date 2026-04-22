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
	TokenTypePhoneVerification = "phone_verification"
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

// Device 登录设备模型
type Device struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID     uuid.UUID      `gorm:"type:uuid;index:idx_device_user_id;not null" json:"user_id"`
	Name       string         `gorm:"type:varchar(100)" json:"name"`
	Type       string         `gorm:"type:varchar(50)" json:"type"` // mobile, desktop, web
	IPAddress  string         `gorm:"type:varchar(50)" json:"ip_address"`
	UserAgent  string         `gorm:"type:varchar(255)" json:"user_agent"`
	LastActive time.Time      `gorm:"index:idx_device_last_active" json:"last_active"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index:idx_device_deleted_at" json:"-"`
}

func (d *Device) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// LoginHistory 登录历史模型
type LoginHistory struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index:idx_login_user_id;not null" json:"user_id"`
	Type      string         `gorm:"type:varchar(20)" json:"type"` // login, logout
	IPAddress string         `gorm:"type:varchar(50)" json:"ip_address"`
	UserAgent string         `gorm:"type:varchar(255)" json:"user_agent"`
	Location  string         `gorm:"type:varchar(100)" json:"location"`
	CreatedAt time.Time      `gorm:"index:idx_login_created_at" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_login_deleted_at" json:"-"`
}

func (l *LoginHistory) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
