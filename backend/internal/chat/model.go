package chat

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/neochat/backend/internal/user"
)

// 会话类型常量
const (
	ConversationTypeSingle = "single"
	ConversationTypeGroup  = "group"
)

// 消息类型常量
const (
	MessageTypeText   = "text"
	MessageTypeImage  = "image"
	MessageTypeFile   = "file"
	MessageTypeSystem = "system"
)

// 成员角色常量
const (
	MemberRoleMember = "member"
	MemberRoleAdmin  = "admin"
	MemberRoleOwner  = "owner"
)

// 通话类型常量
const (
	CallTypeVideo = "video"
	CallTypeVoice = "voice"
)

// 通话状态常量
const (
	CallStatusCalling    = "calling"
	CallStatusInProgress = "in_progress"
	CallStatusCompleted  = "completed"
	CallStatusMissed     = "missed"
	CallStatusRejected   = "rejected"
	CallStatusCancelled  = "cancelled"
)

// WebSocket 信令消息类型
const (
	SignalTypeOffer        = "offer"
	SignalTypeAnswer       = "answer"
	SignalTypeIceCandidate = "ice_candidate"
	SignalTypeCallInvite   = "call_invite"
	SignalTypeCallAccept   = "call_accept"
	SignalTypeCallReject   = "call_reject"
	SignalTypeCallEnd      = "call_end"
	SignalTypeCallHangup   = "call_hangup"
)

type Conversation struct {
	ID           uuid.UUID              `gorm:"type:uuid;primary_key" json:"id"`
	Type         string                 `gorm:"type:varchar(20);not null;index:idx_conv_type" json:"type"` // single, group
	Name         string                 `gorm:"type:varchar(100)" json:"name"`
	Avatar       string                 `gorm:"type:varchar(500)" json:"avatar"`
	LastMessage  string                 `gorm:"type:text" json:"last_message"`
	LastMsgAt    *time.Time             `gorm:"index:idx_conv_last_msg_at" json:"last_msg_at"`
	CreatedBy    uuid.UUID              `gorm:"type:uuid;index:idx_conv_created_by" json:"created_by"`
	CreatedAt    time.Time              `gorm:"index:idx_conv_created_at" json:"created_at"`
	UpdatedAt    time.Time              `gorm:"index:idx_conv_updated_at" json:"updated_at"`
	DeletedAt    gorm.DeletedAt         `gorm:"index:idx_conv_deleted_at" json:"-"`

	// Associations
	Members []*ConversationMember `gorm:"foreignKey:ConversationID" json:"members,omitempty"`
}

func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type ConversationMember struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ConversationID uuid.UUID      `gorm:"type:uuid;index:idx_member_conv_id;not null" json:"conversation_id"`
	UserID         uuid.UUID      `gorm:"type:uuid;index:idx_member_user_id;not null" json:"user_id"`
	Role           string         `gorm:"type:varchar(20);default:'member';index:idx_member_role" json:"role"` // member, admin, owner
	Nickname       string         `gorm:"type:varchar(50)" json:"nickname"`
	LastReadAt     *time.Time     `gorm:"index:idx_member_last_read" json:"last_read_at"`
	UnreadCount    int            `gorm:"default:0;index:idx_member_unread" json:"unread_count"`
	Muted          bool           `gorm:"default:false" json:"muted"`
	JoinedAt       time.Time      `gorm:"index:idx_member_joined_at" json:"joined_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index:idx_member_deleted_at" json:"-"`

	// Associations
	User *user.User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (cm *ConversationMember) BeforeCreate(tx *gorm.DB) error {
	if cm.ID == uuid.Nil {
		cm.ID = uuid.New()
	}
	return nil
}

type Message struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ConversationID uuid.UUID      `gorm:"type:uuid;index:idx_msg_conv_id;not null" json:"conversation_id"`
	SenderID       uuid.UUID      `gorm:"type:uuid;index:idx_msg_sender_id;not null" json:"sender_id"`
	Type           string         `gorm:"type:varchar(20);default:'text';index:idx_msg_type" json:"type"` // text, image, file, system
	Content        string         `gorm:"type:text" json:"content"`
	MediaURL       string         `gorm:"type:varchar(500)" json:"media_url"`
	FileName       string         `gorm:"type:varchar(255)" json:"file_name"`
	FileSize       int64          `json:"file_size"`
	ReplyToID      *uuid.UUID     `gorm:"type:uuid;index:idx_msg_reply_to" json:"reply_to_id"`
	IsEdited       bool           `gorm:"default:false" json:"is_edited"`
	CreatedAt      time.Time      `gorm:"index:idx_msg_created_at" json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index:idx_msg_deleted_at" json:"-"`

	// Not stored in DB, populated dynamically
	ReadCount  int `gorm:"-" json:"read_count,omitempty"`
	TotalCount int `gorm:"-" json:"total_count,omitempty"`

	// Associations
	Sender   *user.User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReplyTo  *Message   `gorm:"foreignKey:ReplyToID" json:"reply_to,omitempty"`
	Mentions []*Mention `gorm:"foreignKey:MessageID" json:"mentions,omitempty"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type MessageRead struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	MessageID uuid.UUID `gorm:"type:uuid;index:idx_read_msg_id;not null" json:"message_id"`
	UserID    uuid.UUID `gorm:"type:uuid;index:idx_read_user_id;not null" json:"user_id"`
	ReadAt    time.Time `gorm:"index:idx_read_at" json:"read_at"`
}

func (mr *MessageRead) BeforeCreate(tx *gorm.DB) error {
	if mr.ID == uuid.Nil {
		mr.ID = uuid.New()
	}
	return nil
}

type Group struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null;index:idx_group_name" json:"name"`
	Description string         `gorm:"type:varchar(500)" json:"description"`
	Avatar      string         `gorm:"type:varchar(500)" json:"avatar"`
	OwnerID     uuid.UUID      `gorm:"type:uuid;index:idx_group_owner;not null" json:"owner_id"`
	MaxMembers  int            `gorm:"default:500" json:"max_members"`
	CreatedAt   time.Time      `gorm:"index:idx_group_created_at" json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index:idx_group_deleted_at" json:"-"`

	// Not stored in DB, populated dynamically
	MemberCount int `gorm:"-" json:"member_count,omitempty"`
}

func (g *Group) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

type Favorite struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index:idx_fav_user_id;not null" json:"user_id"`
	MessageID uuid.UUID      `gorm:"type:uuid;index:idx_fav_msg_id;not null" json:"message_id"`
	Note      string         `gorm:"type:varchar(500)" json:"note"`
	CreatedAt time.Time      `gorm:"index:idx_fav_created_at" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_fav_deleted_at" json:"-"`

	// Associations
	Message *Message `gorm:"foreignKey:MessageID" json:"message,omitempty"`
}

func (f *Favorite) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

type CallRecord struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	CallerID       uuid.UUID      `gorm:"type:uuid;index:idx_call_caller_id;not null" json:"caller_id"`
	CalleeID       uuid.UUID      `gorm:"type:uuid;index:idx_call_callee_id;not null" json:"callee_id"`
	ConversationID *uuid.UUID     `gorm:"type:uuid;index:idx_call_conv_id" json:"conversation_id"`
	Type           string         `gorm:"type:varchar(20);not null;index:idx_call_type" json:"type"` // video, voice
	Status         string         `gorm:"type:varchar(20);not null;index:idx_call_status" json:"status"` // calling, in_progress, completed, missed, rejected, cancelled
	StartedAt      *time.Time     `json:"started_at"`
	AnsweredAt     *time.Time     `json:"answered_at"`
	EndedAt        *time.Time     `json:"ended_at"`
	Duration       int            `json:"duration"` // 通话时长（秒）
	CreatedAt      time.Time      `gorm:"index:idx_call_created_at" json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index:idx_call_deleted_at" json:"-"`

	// Associations
	Caller *user.User `gorm:"foreignKey:CallerID" json:"caller,omitempty"`
	Callee *user.User `gorm:"foreignKey:CalleeID" json:"callee,omitempty"`
}

func (cr *CallRecord) BeforeCreate(tx *gorm.DB) error {
	if cr.ID == uuid.Nil {
		cr.ID = uuid.New()
	}
	return nil
}

// Mention @提及模型
type Mention struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	MessageID uuid.UUID      `gorm:"type:uuid;index:idx_mention_msg_id;not null" json:"message_id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index:idx_mention_user_id;not null" json:"user_id"`
	HasRead   bool           `gorm:"default:false;index:idx_mention_unread" json:"has_read"`
	ReadAt    *time.Time     `gorm:"index:idx_mention_read_at" json:"read_at"`
	CreatedAt time.Time      `gorm:"index:idx_mention_created_at" json:"created_at"`

	// Associations
	Message *Message   `gorm:"foreignKey:MessageID" json:"message,omitempty"`
	User    *user.User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (m *Mention) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// WebSocket 信令消息结构
type SignalMessage struct {
	Type      string      `json:"type"`       // 消息类型
	CallID    uuid.UUID   `json:"call_id"`    // 通话ID
	From      uuid.UUID   `json:"from"`       // 发送者ID
	To        uuid.UUID   `json:"to"`         // 接收者ID
	Payload   interface{} `json:"payload"`    // 信令数据（SDP/ICE等）
	CreatedAt time.Time   `json:"created_at"` // 创建时间
}

// 通话邀请消息
type CallInvitePayload struct {
	CallID        uuid.UUID `json:"call_id"`
	CallerID      uuid.UUID `json:"caller_id"`
	CalleeID      uuid.UUID `json:"callee_id"`
	Type          string    `json:"type"`           // video, voice
	CallerName    string    `json:"caller_name"`    // 呼叫者名称
	CallerAvatar  string    `json:"caller_avatar"`  // 呼叫者头像
}

// SDP 载荷
type SDPPayload struct {
	Type string `json:"type"` // offer/answer
	SDP  string `json:"sdp"`
}

// ICE 候选载荷
type ICECandidatePayload struct {
	Candidate     string `json:"candidate"`
	SDPMid        string `json:"sdpMid"`
	SDPMLineIndex int    `json:"sdpMLineIndex"`
}
