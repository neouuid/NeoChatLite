package chat

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Conversation struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Type         string         `gorm:"type:varchar(20);not null" json:"type"` // single, group
	Name         string         `gorm:"type:varchar(100)" json:"name"`
	Avatar       string         `gorm:"type:varchar(500)" json:"avatar"`
	LastMessage  string         `gorm:"type:text" json:"last_message"`
	LastMsgAt    *time.Time     `json:"last_msg_at"`
	CreatedBy    uuid.UUID      `gorm:"type:uuid;index" json:"created_by"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type ConversationMember struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ConversationID uuid.UUID      `gorm:"type:uuid;index;not null" json:"conversation_id"`
	UserID         uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	Role           string         `gorm:"type:varchar(20);default:'member'" json:"role"` // member, admin, owner
	Nickname       string         `gorm:"type:varchar(50)" json:"nickname"`
	LastReadAt     *time.Time     `json:"last_read_at"`
	UnreadCount    int            `gorm:"default:0" json:"unread_count"`
	Muted          bool           `gorm:"default:false" json:"muted"`
	JoinedAt       time.Time      `json:"joined_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (cm *ConversationMember) BeforeCreate(tx *gorm.DB) error {
	if cm.ID == uuid.Nil {
		cm.ID = uuid.New()
	}
	return nil
}

type Message struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ConversationID uuid.UUID      `gorm:"type:uuid;index;not null" json:"conversation_id"`
	SenderID       uuid.UUID      `gorm:"type:uuid;index;not null" json:"sender_id"`
	Type           string         `gorm:"type:varchar(20);default:'text'" json:"type"` // text, image, file, system
	Content        string         `gorm:"type:text" json:"content"`
	MediaURL       string         `gorm:"type:varchar(500)" json:"media_url"`
	FileName       string         `gorm:"type:varchar(255)" json:"file_name"`
	FileSize       int64          `json:"file_size"`
	ReplyToID      *uuid.UUID     `gorm:"type:uuid" json:"reply_to_id"`
	IsEdited       bool           `gorm:"default:false" json:"is_edited"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type MessageRead struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	MessageID   uuid.UUID `gorm:"type:uuid;index;not null" json:"message_id"`
	UserID      uuid.UUID `gorm:"type:uuid;index;not null" json:"user_id"`
	ReadAt      time.Time `json:"read_at"`
}

func (mr *MessageRead) BeforeCreate(tx *gorm.DB) error {
	if mr.ID == uuid.Nil {
		mr.ID = uuid.New()
	}
	return nil
}

type Group struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:varchar(500)" json:"description"`
	Avatar      string         `gorm:"type:varchar(500)" json:"avatar"`
	OwnerID     uuid.UUID      `gorm:"type:uuid;index;not null" json:"owner_id"`
	MaxMembers  int            `gorm:"default:500" json:"max_members"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (g *Group) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

type Favorite struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	MessageID uuid.UUID      `gorm:"type:uuid;index;not null" json:"message_id"`
	Note      string         `gorm:"type:varchar(500)" json:"note"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (f *Favorite) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}
