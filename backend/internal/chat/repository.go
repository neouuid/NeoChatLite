package chat

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// ==================== Conversation Repository Methods ====================

// CreateConversation 创建会话
func (r *Repository) CreateConversation(conv *Conversation) error {
	return r.db.Create(conv).Error
}

// GetConversationByID 根据ID获取会话
func (r *Repository) GetConversationByID(id uuid.UUID) (*Conversation, error) {
	var conv Conversation
	err := r.db.Preload("Members").Preload("Members.User").Where("id = ?", id).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// GetSingleConversation 获取单聊会话
func (r *Repository) GetSingleConversation(userID1, userID2 uuid.UUID) (*Conversation, error) {
	var conv Conversation
	err := r.db.Where("type = ?", "single").
		Joins("JOIN conversation_members cm1 ON cm1.conversation_id = conversations.id AND cm1.user_id = ?", userID1).
		Joins("JOIN conversation_members cm2 ON cm2.conversation_id = conversations.id AND cm2.user_id = ?", userID2).
		Preload("Members").Preload("Members.User").
		First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// GetUserConversations 获取用户的会话列表
func (r *Repository) GetUserConversations(userID uuid.UUID) ([]*Conversation, error) {
	var convs []*Conversation
	err := r.db.Joins("JOIN conversation_members ON conversation_members.conversation_id = conversations.id").
		Where("conversation_members.user_id = ?", userID).
		Preload("Members").Preload("Members.User").
		Order("conversations.updated_at DESC").
		Find(&convs).Error
	if err != nil {
		return nil, err
	}
	return convs, nil
}

// UpdateConversation 更新会话
func (r *Repository) UpdateConversation(conv *Conversation) error {
	return r.db.Save(conv).Error
}

// ==================== ConversationMember Repository Methods ====================

// AddConversationMember 添加会话成员
func (r *Repository) AddConversationMember(member *ConversationMember) error {
	return r.db.Create(member).Error
}

// GetConversationMember 获取会话成员
func (r *Repository) GetConversationMember(convID, userID uuid.UUID) (*ConversationMember, error) {
	var member ConversationMember
	err := r.db.Where("conversation_id = ? AND user_id = ?", convID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// GetConversationMembers 获取会话所有成员
func (r *Repository) GetConversationMembers(convID uuid.UUID) ([]*ConversationMember, error) {
	var members []*ConversationMember
	err := r.db.Where("conversation_id = ?", convID).
		Preload("User").
		Find(&members).Error
	if err != nil {
		return nil, err
	}
	return members, nil
}

// UpdateConversationMember 更新会话成员
func (r *Repository) UpdateConversationMember(member *ConversationMember) error {
	return r.db.Save(member).Error
}

// RemoveConversationMember 移除会话成员
func (r *Repository) RemoveConversationMember(convID, userID uuid.UUID) error {
	return r.db.Where("conversation_id = ? AND user_id = ?", convID, userID).
		Delete(&ConversationMember{}).Error
}

// ==================== Message Repository Methods ====================

// CreateMessage 创建消息
func (r *Repository) CreateMessage(msg *Message) error {
	return r.db.Create(msg).Error
}

// GetMessageByID 根据ID获取消息
func (r *Repository) GetMessageByID(id uuid.UUID) (*Message, error) {
	var msg Message
	err := r.db.Preload("Sender").Where("id = ?", id).First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// GetConversationMessages 获取会话消息
func (r *Repository) GetConversationMessages(convID uuid.UUID, before *time.Time, limit int) ([]*Message, error) {
	var msgs []*Message
	query := r.db.Where("conversation_id = ?", convID)

	if before != nil {
		query = query.Where("created_at < ?", *before)
	}

	if limit <= 0 {
		limit = 50
	}

	err := query.Preload("Sender").Preload("ReplyTo").
		Order("created_at DESC").
		Limit(limit).
		Find(&msgs).Error

	if err != nil {
		return nil, err
	}

	// 为群聊消息添加已读计数
	if len(msgs) > 0 {
		// 获取会话信息，判断是否为群聊
		var conv Conversation
		if err := r.db.Select("type").Where("id = ?", convID).First(&conv).Error; err == nil && conv.Type == ConversationTypeGroup {
			// 获取会话成员总数（不包括已删除的）
			var totalCount int64
			r.db.Model(&ConversationMember{}).
				Where("conversation_id = ?", convID).
				Count(&totalCount)

			// 收集所有消息ID
			msgIDs := make([]uuid.UUID, len(msgs))
			for i, msg := range msgs {
				msgIDs[i] = msg.ID
			}

			// 批量查询每条消息的已读计数
			type msgReadCount struct {
				MessageID uuid.UUID
				ReadCount int64
			}
			var readCounts []msgReadCount

			if len(msgIDs) > 0 {
				r.db.Model(&MessageRead{}).
					Select("message_id, COUNT(*) as read_count").
					Where("message_id IN ?", msgIDs).
					Group("message_id").
					Scan(&readCounts)
			}

			// 构建已读计数映射
			readCountMap := make(map[uuid.UUID]int64)
			for _, rc := range readCounts {
				readCountMap[rc.MessageID] = rc.ReadCount
			}

			// 为每条消息设置已读计数
			for i := range msgs {
				msgs[i].ReadCount = int(readCountMap[msgs[i].ID])
				msgs[i].TotalCount = int(totalCount)
			}
		}
	}

	// Reverse to get ascending order
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}

	return msgs, nil
}

// UpdateMessage 更新消息
func (r *Repository) UpdateMessage(msg *Message) error {
	return r.db.Save(msg).Error
}

// DeleteMessage 删除消息（软删除）
func (r *Repository) DeleteMessage(id uuid.UUID) error {
	return r.db.Delete(&Message{}, id).Error
}

// ==================== MessageRead Repository Methods ====================

// MarkMessageAsRead 标记消息为已读
func (r *Repository) MarkMessageAsRead(msgID, userID uuid.UUID) error {
	var read MessageRead
	err := r.db.Where("message_id = ? AND user_id = ?", msgID, userID).First(&read).Error
	if err == nil {
		// Already marked as read
		return nil
	}

	read = MessageRead{
		ID:        uuid.New(),
		MessageID: msgID,
		UserID:    userID,
	}
	return r.db.Create(&read).Error
}

// MarkConversationAsRead 标记会话所有消息为已读
func (r *Repository) MarkConversationAsRead(convID, userID uuid.UUID) error {
	// 更新成员最后阅读时间
	member, err := r.GetConversationMember(convID, userID)
	if err != nil {
		return err
	}
	now := time.Now()
	member.LastReadAt = &now
	member.UnreadCount = 0
	return r.UpdateConversationMember(member)
}

// GetUnreadCount 获取未读消息数
func (r *Repository) GetUnreadCount(convID, userID uuid.UUID) (int64, error) {
	member, err := r.GetConversationMember(convID, userID)
	if err != nil {
		return 0, err
	}
	return int64(member.UnreadCount), nil
}

// IncrementUnreadCount 增加未读计数
func (r *Repository) IncrementUnreadCount(convID, excludeUserID uuid.UUID) error {
	return r.db.Model(&ConversationMember{}).
		Where("conversation_id = ? AND user_id != ?", convID, excludeUserID).
		UpdateColumn("unread_count", gorm.Expr("unread_count + 1")).Error
}

// ==================== Favorite Repository Methods ====================

// AddFavorite 添加收藏
func (r *Repository) AddFavorite(fav *Favorite) error {
	return r.db.Create(fav).Error
}

// RemoveFavorite 移除收藏
func (r *Repository) RemoveFavorite(id uuid.UUID) error {
	return r.db.Delete(&Favorite{}, id).Error
}

// GetUserFavorites 获取用户收藏
func (r *Repository) GetUserFavorites(userID uuid.UUID) ([]*Favorite, error) {
	var favs []*Favorite
	err := r.db.Where("user_id = ?", userID).
		Preload("Message").Preload("Message.Sender").
		Order("created_at DESC").
		Find(&favs).Error
	if err != nil {
		return nil, err
	}
	return favs, nil
}

// CheckFavoriteExists 检查是否已收藏
func (r *Repository) CheckFavoriteExists(userID, msgID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&Favorite{}).Where("user_id = ? AND message_id = ?", userID, msgID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ==================== Group Repository Methods ====================

// CreateGroup 创建群组
func (r *Repository) CreateGroup(group *Group) error {
	return r.db.Create(group).Error
}

// GetGroupByID 根据ID获取群组
func (r *Repository) GetGroupByID(id uuid.UUID) (*Group, error) {
	var g Group
	err := r.db.Where("id = ?", id).First(&g).Error
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// GetUserGroups 获取用户的群组列表
func (r *Repository) GetUserGroups(userID uuid.UUID) ([]*Group, error) {
	var groups []*Group
	err := r.db.Joins("JOIN conversation_members ON conversation_members.conversation_id = groups.id").
		Where("conversation_members.user_id = ?", userID).
		Find(&groups).Error
	if err != nil {
		return nil, err
	}
	return groups, nil
}

// UpdateGroup 更新群组
func (r *Repository) UpdateGroup(group *Group) error {
	return r.db.Save(group).Error
}

// DeleteGroup 删除群组
func (r *Repository) DeleteGroup(id uuid.UUID) error {
	return r.db.Delete(&Group{}, id).Error
}

// GetGroupMemberCount 获取群组成员数量
func (r *Repository) GetGroupMemberCount(groupID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&ConversationMember{}).
		Where("conversation_id = ?", groupID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

// ==================== CallRecord Repository Methods ====================

// CreateCallRecord 创建通话记录
func (r *Repository) CreateCallRecord(record *CallRecord) error {
	return r.db.Create(record).Error
}

// GetCallRecordByID 根据ID获取通话记录
func (r *Repository) GetCallRecordByID(id uuid.UUID) (*CallRecord, error) {
	var record CallRecord
	err := r.db.Preload("Caller").Preload("Callee").Where("id = ?", id).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

// GetUserCallRecords 获取用户的通话记录列表
func (r *Repository) GetUserCallRecords(userID uuid.UUID, limit int) ([]*CallRecord, error) {
	var records []*CallRecord
	if limit <= 0 {
		limit = 50
	}
	err := r.db.Where("caller_id = ? OR callee_id = ?", userID, userID).
		Preload("Caller").Preload("Callee").
		Order("created_at DESC").
		Limit(limit).
		Find(&records).Error
	if err != nil {
		return nil, err
	}
	return records, nil
}

// GetActiveCall 获取用户的进行中通话
func (r *Repository) GetActiveCall(userID uuid.UUID) (*CallRecord, error) {
	var record CallRecord
	err := r.db.Where("(caller_id = ? OR callee_id = ?) AND status IN ?", userID, userID, []string{CallStatusCalling, CallStatusInProgress}).
		Preload("Caller").Preload("Callee").
		First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

// UpdateCallRecord 更新通话记录
func (r *Repository) UpdateCallRecord(record *CallRecord) error {
	return r.db.Save(record).Error
}

// UpdateCallStatus 更新通话状态
func (r *Repository) UpdateCallStatus(callID uuid.UUID, status string) error {
	return r.db.Model(&CallRecord{}).Where("id = ?", callID).Update("status", status).Error
}

// StartCall 开始通话（设置开始时间）
func (r *Repository) StartCall(callID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&CallRecord{}).Where("id = ?", callID).
		Updates(map[string]interface{}{
			"status":     CallStatusInProgress,
			"started_at": now,
		}).Error
}

// AnswerCall 接听通话
func (r *Repository) AnswerCall(callID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&CallRecord{}).Where("id = ?", callID).
		Updates(map[string]interface{}{
			"status":      CallStatusInProgress,
			"answered_at": now,
			"started_at":  now,
		}).Error
}

// EndCall 结束通话
func (r *Repository) EndCall(callID uuid.UUID) error {
	now := time.Now()
	var record CallRecord
	err := r.db.Where("id = ?", callID).First(&record).Error
	if err != nil {
		return err
	}

	// 计算通话时长
	duration := 0
	if record.StartedAt != nil {
		duration = int(now.Sub(*record.StartedAt).Seconds())
	}

	// 如果是呼叫中状态，根据情况设置为错过或取消
	status := CallStatusCompleted
	if record.Status == CallStatusCalling {
		if record.CallerID == uuid.Nil {
			status = CallStatusMissed
		} else {
			status = CallStatusCancelled
		}
	}

	return r.db.Model(&CallRecord{}).Where("id = ?", callID).
		Updates(map[string]interface{}{
			"status":   status,
			"ended_at": now,
			"duration": duration,
		}).Error
}

// ==================== Mention Repository Methods ====================

// CreateMention 创建提及
func (r *Repository) CreateMention(mention *Mention) error {
	return r.db.Create(mention).Error
}

// CreateMentions 批量创建提及
func (r *Repository) CreateMentions(mentions []*Mention) error {
	return r.db.Create(mentions).Error
}

// GetMessageMentions 获取消息的所有提及
func (r *Repository) GetMessageMentions(messageID uuid.UUID) ([]*Mention, error) {
	var mentions []*Mention
	err := r.db.Where("message_id = ?", messageID).
		Preload("User").
		Find(&mentions).Error
	if err != nil {
		return nil, err
	}
	return mentions, nil
}

// GetUserMentions 获取用户的提及列表
func (r *Repository) GetUserMentions(userID uuid.UUID, limit int) ([]*Mention, error) {
	var mentions []*Mention
	if limit <= 0 {
		limit = 50
	}
	err := r.db.Where("user_id = ?", userID).
		Preload("Message").Preload("Message.Sender").
		Order("created_at DESC").
		Limit(limit).
		Find(&mentions).Error
	if err != nil {
		return nil, err
	}
	return mentions, nil
}

// MarkMentionAsRead 标记提及为已读
func (r *Repository) MarkMentionAsRead(mentionID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&Mention{}).Where("id = ?", mentionID).
		Updates(map[string]interface{}{
			"has_read": true,
			"read_at":  now,
		}).Error
}

// MarkUserMentionsAsRead 标记用户的所有提及为已读
func (r *Repository) MarkUserMentionsAsRead(userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&Mention{}).Where("user_id = ? AND has_read = ?", userID, false).
		Updates(map[string]interface{}{
			"has_read": true,
			"read_at":  now,
		}).Error
}

// GetUnreadMentionCount 获取用户未读提及数量
func (r *Repository) GetUnreadMentionCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&Mention{}).Where("user_id = ? AND has_read = ?", userID, false).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

