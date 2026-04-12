package user

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// 用户状态常量
const (
	StatusOnline  = "online"
	StatusOffline = "offline"
	StatusAway    = "away"
	StatusBusy    = "busy"
	StatusDND     = "dnd" // Do Not Disturb
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Username  string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email     string         `gorm:"type:varchar(100);uniqueIndex" json:"email"`
	Phone     string         `gorm:"type:varchar(20);uniqueIndex" json:"phone"`
	Password  string         `gorm:"type:varchar(255);not null" json:"-"`
	Nickname  string         `gorm:"type:varchar(50)" json:"nickname"`
	Avatar    string         `gorm:"type:varchar(500)" json:"avatar"`
	Bio       string         `gorm:"type:varchar(500)" json:"bio"`
	Status    string         `gorm:"type:varchar(20);default:'online'" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Friend struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	FriendID  uuid.UUID      `gorm:"type:uuid;index;not null" json:"friend_id"`
	Alias     string         `gorm:"type:varchar(50)" json:"alias"`
	Status    string         `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, accepted, blocked
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Friend *User `gorm:"foreignKey:FriendID" json:"friend,omitempty"`
}

// 好友状态常量
const (
	FriendStatusPending  = "pending"
	FriendStatusAccepted = "accepted"
	FriendStatusBlocked  = "blocked"
)

func (f *Friend) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

type Blocklist struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	BlockedID uuid.UUID      `gorm:"type:uuid;index;not null" json:"blocked_id"`
	Reason    string         `gorm:"type:varchar(200)" json:"reason"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	Blocked *User `gorm:"foreignKey:BlockedID" json:"blocked,omitempty"`
}

func (b *Blocklist) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}
