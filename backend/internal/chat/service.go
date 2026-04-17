package chat

import (
	"errors"
	"regexp"
	"time"

	"github.com/google/uuid"

	"github.com/neochat/backend/pkg/logger"
	"github.com/neochat/backend/pkg/redis"
)

type Service struct {
	repo *Repository
	hub  *WebSocketHub
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// SetWebSocketHub 设置WebSocket集线器
func (s *Service) SetWebSocketHub(hub *WebSocketHub) {
	s.hub = hub
}

// ==================== Conversation Service Methods ====================

// CreateSingleConversation 创建单聊会话
func (s *Service) CreateSingleConversation(userID1, userID2 uuid.UUID) (*Conversation, error) {
	if userID1 == userID2 {
		return nil, errors.New("cannot create conversation with yourself")
	}

	// 检查是否已存在
	existing, _ := s.repo.GetSingleConversation(userID1, userID2)
	if existing != nil {
		return existing, nil
	}

	// 创建会话
	now := time.Now()
	conv := &Conversation{
		ID:        uuid.New(),
		Type:      ConversationTypeSingle,
		CreatedBy: userID1,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.repo.CreateConversation(conv); err != nil {
		return nil, err
	}

	// 添加两个成员
	member1 := &ConversationMember{
		ID:             uuid.New(),
		ConversationID: conv.ID,
		UserID:         userID1,
		Role:           MemberRoleMember,
		JoinedAt:       now,
	}
	if err := s.repo.AddConversationMember(member1); err != nil {
		return nil, err
	}

	member2 := &ConversationMember{
		ID:             uuid.New(),
		ConversationID: conv.ID,
		UserID:         userID2,
		Role:           MemberRoleMember,
		JoinedAt:       now,
	}
	if err := s.repo.AddConversationMember(member2); err != nil {
		return nil, err
	}

	return s.repo.GetConversationByID(conv.ID)
}

// GetConversation 获取会话
func (s *Service) GetConversation(convID, userID uuid.UUID) (*Conversation, error) {
	// 尝试从 Redis 缓存获取
	cacheKey := redis.KeyPrefixConversation + convID.String()
	var conv Conversation

	if err := redis.GetJSON(cacheKey, &conv); err == nil && conv.ID != uuid.Nil {
		logger.Debugf("Cache hit for conversation: %s", convID)
		// 仍然需要验证用户是否是成员
		isMember := false
		for _, m := range conv.Members {
			if m.UserID == userID {
				isMember = true
				break
			}
		}
		if isMember {
			return &conv, nil
		}
	}

	// 缓存未命中或用户不是成员，从数据库获取
	logger.Debugf("Cache miss for conversation: %s", convID)
	convFromDB, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return nil, err
	}

	// 验证用户是否是会话成员
	isMember := false
	for _, m := range convFromDB.Members {
		if m.UserID == userID {
			isMember = true
			break
		}
	}
	if !isMember {
		return nil, errors.New("not a member of this conversation")
	}

	// 写入缓存
	if err := redis.SetJSON(cacheKey, convFromDB, redis.ConversationTTL); err != nil {
		logger.Warnf("Failed to cache conversation: %v", err)
	}

	return convFromDB, nil
}

// GetUserConversations 获取用户的会话列表
func (s *Service) GetUserConversations(userID uuid.UUID) ([]*Conversation, error) {
	// 尝试从 Redis 缓存获取
	cacheKey := redis.KeyPrefixConversations + userID.String()
	var convs []*Conversation

	if err := redis.GetJSON(cacheKey, &convs); err == nil && len(convs) > 0 {
		logger.Debugf("Cache hit for user conversations: %s", userID)
		return convs, nil
	}

	// 缓存未命中，从数据库获取
	logger.Debugf("Cache miss for user conversations: %s", userID)
	convs, err := s.repo.GetUserConversations(userID)
	if err != nil {
		return nil, err
	}

	// 写入缓存
	if err := redis.SetJSON(cacheKey, convs, redis.ConversationTTL); err != nil {
		logger.Warnf("Failed to cache user conversations: %v", err)
	}

	return convs, nil
}

// UpdateConversation 更新会话
func (s *Service) UpdateConversation(conv *Conversation) error {
	err := s.repo.UpdateConversation(conv)
	if err == nil {
		// 失效缓存
		_ = redis.InvalidateConversationCache(conv.ID.String())
	}
	return err
}

// ==================== Message Service Methods ====================

// SendMessage 发送消息
func (s *Service) SendMessage(convID, senderID uuid.UUID, msgType, content, mediaURL, fileName string, fileSize int64, replyToID *uuid.UUID) (*Message, error) {
	// 验证用户是否是会话成员
	_, err := s.repo.GetConversationMember(convID, senderID)
	if err != nil {
		return nil, errors.New("not a member of this conversation")
	}

	now := time.Now()
	msg := &Message{
		ID:             uuid.New(),
		ConversationID: convID,
		SenderID:       senderID,
		Type:           msgType,
		Content:        content,
		MediaURL:       mediaURL,
		FileName:       fileName,
		FileSize:       fileSize,
		ReplyToID:      replyToID,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}

	// 更新会话最后消息
	conv, err := s.repo.GetConversationByID(convID)
	if err == nil {
		conv.LastMessage = content
		conv.LastMsgAt = &now
		conv.UpdatedAt = now
		_ = s.repo.UpdateConversation(conv)
	}

	// 增加未读计数
	_ = s.repo.IncrementUnreadCount(convID, senderID)

	// 获取完整消息（包含发送者信息）
	fullMsg, err := s.repo.GetMessageByID(msg.ID)
	if err != nil {
		return nil, err
	}

	// 通过WebSocket广播新消息
	if s.hub != nil {
		s.hub.broadcast <- WSMessage{
			Type:   WSMessageTypeNewMessage,
			FromID: senderID,
			ConvID: convID,
			Data:   fullMsg,
		}
	}

	// 处理 @提及
	if msgType == MessageTypeText && content != "" {
		go s.processMentions(fullMsg, conv, senderID)
	}

	// 失效会话相关缓存
	go func() {
		_ = redis.InvalidateConversationCache(convID.String())
		// 失效所有成员的会话列表缓存
		if conv != nil {
			for _, member := range conv.Members {
				_ = redis.Delete(redis.KeyPrefixConversations + member.UserID.String())
			}
		}
	}()

	return fullMsg, nil
}

// processMentions 处理消息中的 @提及
func (s *Service) processMentions(msg *Message, conv *Conversation, senderID uuid.UUID) {
	// 解析 @提及
	mentionedUserIDs := s.parseMentions(msg.Content)
	if len(mentionedUserIDs) == 0 {
		return
	}

	// 获取会话所有成员
	members, err := s.repo.GetConversationMembers(msg.ConversationID)
	if err != nil {
		return
	}

	// 创建提及记录并发送通知
	var mentions []*Mention
	senderName := ""
	senderAvatar := ""

	if msg.Sender != nil {
		senderName = formatDisplayName(msg.Sender.Nickname, msg.Sender.Username)
		senderAvatar = msg.Sender.Avatar
	}

	// 构建成员ID到成员的映射
	memberMap := make(map[uuid.UUID]*ConversationMember)
	for _, member := range members {
		memberMap[member.UserID] = member
	}

	for _, mentionedUserID := range mentionedUserIDs {
		// 跳过发送者自己
		if mentionedUserID == senderID {
			continue
		}

		// 检查被提及的用户是否是会话成员
		if _, exists := memberMap[mentionedUserID]; !exists {
			continue
		}

		mention := &Mention{
			ID:        uuid.New(),
			MessageID: msg.ID,
			UserID:    mentionedUserID,
			HasRead:   false,
			CreatedAt: time.Now(),
		}
		mentions = append(mentions, mention)
	}

	if len(mentions) > 0 {
		// 批量创建提及
		_ = s.repo.CreateMentions(mentions)

		// 发送提及通知
		if s.hub != nil {
			for _, mention := range mentions {
				s.hub.SendMention(
					mention.UserID,
					msg.ID,
					msg.ConversationID,
					senderID,
					senderName,
					senderAvatar,
					msg.Content,
				)
			}
		}
	}
}

// parseMentions 解析消息中的 @提及，返回被提及的用户ID列表
// 格式: @[username](user_id) 或 @username
func (s *Service) parseMentions(content string) []uuid.UUID {
	var userIDs []uuid.UUID

	// 匹配格式: @[username](user_id)
	re := regexp.MustCompile(`@\[[^\]]+\]\(([0-9a-fA-F-]{36})\)`)
	matches := re.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) >= 2 {
			if userID, err := uuid.Parse(match[1]); err == nil {
				userIDs = append(userIDs, userID)
			}
		}
	}

	return userIDs
}

// formatDisplayName 格式化显示名称
func formatDisplayName(nickname, username string) string {
	if nickname != "" {
		return nickname
	}
	return username
}

// GetConversationMessages 获取会话消息
func (s *Service) GetConversationMessages(convID, userID uuid.UUID, before *time.Time, limit int) ([]*Message, error) {
	// 验证用户是否是会话成员
	_, err := s.repo.GetConversationMember(convID, userID)
	if err != nil {
		return nil, errors.New("not a member of this conversation")
	}

	return s.repo.GetConversationMessages(convID, before, limit)
}

// EditMessage 编辑消息
func (s *Service) EditMessage(msgID, userID uuid.UUID, content string) (*Message, error) {
	msg, err := s.repo.GetMessageByID(msgID)
	if err != nil {
		return nil, errors.New("message not found")
	}

	if msg.SenderID != userID {
		return nil, errors.New("not the message sender")
	}

	if msg.Type != MessageTypeText {
		return nil, errors.New("only text messages can be edited")
	}

	msg.Content = content
	msg.IsEdited = true
	msg.UpdatedAt = time.Now()

	if err := s.repo.UpdateMessage(msg); err != nil {
		return nil, err
	}

	// 失效会话缓存
	_ = redis.InvalidateConversationCache(msg.ConversationID.String())

	return msg, nil
}

// DeleteMessage 删除消息
func (s *Service) DeleteMessage(msgID, userID uuid.UUID) error {
	msg, err := s.repo.GetMessageByID(msgID)
	if err != nil {
		return errors.New("message not found")
	}

	// 验证是否是发送者或会话管理员
	if msg.SenderID != userID {
		// 检查是否是会话管理员或群主
		member, err := s.repo.GetConversationMember(msg.ConversationID, userID)
		if err == nil {
			if member.Role != MemberRoleAdmin && member.Role != MemberRoleOwner {
				return errors.New("not authorized to delete this message")
			}
		} else {
			return errors.New("not authorized to delete this message")
		}
	}

	err = s.repo.DeleteMessage(msgID)
	if err == nil {
		// 失效会话缓存
		_ = redis.InvalidateConversationCache(msg.ConversationID.String())
	}
	return err
}

// MarkConversationAsRead 标记会话为已读
func (s *Service) MarkConversationAsRead(convID, userID uuid.UUID) error {
	_, err := s.repo.GetConversationMember(convID, userID)
	if err != nil {
		return errors.New("not a member of this conversation")
	}

	return s.repo.MarkConversationAsRead(convID, userID)
}

// ==================== Favorite Service Methods ====================

// AddFavorite 添加收藏
func (s *Service) AddFavorite(userID, msgID uuid.UUID, note string) (*Favorite, error) {
	// 检查消息是否存在
	_, err := s.repo.GetMessageByID(msgID)
	if err != nil {
		return nil, errors.New("message not found")
	}

	// 检查是否已收藏
	exists, err := s.repo.CheckFavoriteExists(userID, msgID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("already favorited")
	}

	fav := &Favorite{
		ID:        uuid.New(),
		UserID:    userID,
		MessageID: msgID,
		Note:      note,
		CreatedAt: time.Now(),
	}

	if err := s.repo.AddFavorite(fav); err != nil {
		return nil, err
	}

	favs, err := s.repo.GetUserFavorites(userID)
	if err != nil {
		return fav, nil
	}

	for _, f := range favs {
		if f.ID == fav.ID {
			return f, nil
		}
	}

	return fav, nil
}

// RemoveFavorite 移除收藏
func (s *Service) RemoveFavorite(favID, userID uuid.UUID) error {
	var favs []*Favorite
	favs, err := s.repo.GetUserFavorites(userID)
	if err != nil {
		return err
	}

	var targetFav *Favorite
	for _, f := range favs {
		if f.ID == favID {
			targetFav = f
			break
		}
	}

	if targetFav == nil {
		return errors.New("favorite not found")
	}

	return s.repo.RemoveFavorite(favID)
}

// GetUserFavorites 获取用户收藏
func (s *Service) GetUserFavorites(userID uuid.UUID) ([]*Favorite, error) {
	return s.repo.GetUserFavorites(userID)
}

// ==================== Group Service Methods ====================

// CreateGroup 创建群组
func (s *Service) CreateGroup(ownerID uuid.UUID, name, description, avatar string, memberIDs []uuid.UUID) (*Conversation, *Group, error) {
	if name == "" {
		return nil, nil, errors.New("group name is required")
	}

	now := time.Now()
	groupID := uuid.New()

	// 创建会话
	conv := &Conversation{
		ID:        groupID,
		Type:      ConversationTypeGroup,
		Name:      name,
		Avatar:    avatar,
		CreatedBy: ownerID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.repo.CreateConversation(conv); err != nil {
		return nil, nil, err
	}

	// 创建群组记录
	group := &Group{
		ID:          groupID,
		Name:        name,
		Description: description,
		Avatar:      avatar,
		OwnerID:     ownerID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.repo.CreateGroup(group); err != nil {
		return nil, nil, err
	}

	// 添加创建者为群主
	ownerMember := &ConversationMember{
		ID:             uuid.New(),
		ConversationID: groupID,
		UserID:         ownerID,
		Role:           MemberRoleOwner,
		JoinedAt:       now,
	}
	if err := s.repo.AddConversationMember(ownerMember); err != nil {
		return nil, nil, err
	}

	// 添加其他成员
	for _, memberID := range memberIDs {
		if memberID == ownerID {
			continue
		}
		member := &ConversationMember{
			ID:             uuid.New(),
			ConversationID: groupID,
			UserID:         memberID,
			Role:           MemberRoleMember,
			JoinedAt:       now,
		}
		if err := s.repo.AddConversationMember(member); err != nil {
			// 继续添加其他成员，不要因为一个失败而中断
			continue
		}
	}

	fullConv, err := s.repo.GetConversationByID(groupID)
	if err != nil {
		return nil, group, nil
	}

	return fullConv, group, nil
}

// GetGroup 获取群组
func (s *Service) GetGroup(groupID, userID uuid.UUID) (*Group, error) {
	// 验证用户是否是群成员
	_, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return nil, errors.New("not a member of this group")
	}

	group, err := s.repo.GetGroupByID(groupID)
	if err != nil {
		return nil, errors.New("group not found")
	}

	// 获取成员数量
	memberCount, _ := s.repo.GetGroupMemberCount(groupID)
	group.MemberCount = int(memberCount)

	return group, nil
}

// UpdateGroup 更新群组
func (s *Service) UpdateGroup(groupID, userID uuid.UUID, name, description, avatar string) (*Group, error) {
	group, err := s.repo.GetGroupByID(groupID)
	if err != nil {
		return nil, errors.New("group not found")
	}

	// 验证权限（只有群主和管理员可以修改）
	member, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return nil, errors.New("not a member of this group")
	}

	if member.Role != MemberRoleOwner && member.Role != MemberRoleAdmin {
		return nil, errors.New("not authorized to modify group")
	}

	if name != "" {
		group.Name = name
	}
	if description != "" {
		group.Description = description
	}
	if avatar != "" {
		group.Avatar = avatar
	}
	group.UpdatedAt = time.Now()

	if err := s.repo.UpdateGroup(group); err != nil {
		return nil, err
	}

	// 同时更新会话信息
	conv, _ := s.repo.GetConversationByID(groupID)
	if conv != nil {
		if name != "" {
			conv.Name = name
		}
		if avatar != "" {
			conv.Avatar = avatar
		}
		conv.UpdatedAt = time.Now()
		_ = s.repo.UpdateConversation(conv)
	}

	// 失效会话缓存
	_ = redis.InvalidateConversationCache(groupID.String())

	return group, nil
}

// AddGroupMember 添加群成员
func (s *Service) AddGroupMember(groupID, userID, newMemberID uuid.UUID) error {
	// 验证用户是否是群成员
	_, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return errors.New("not a member of this group")
	}

	// 检查新成员是否已经在群里
	existing, _ := s.repo.GetConversationMember(groupID, newMemberID)
	if existing != nil {
		return errors.New("user already in group")
	}

	// 添加成员
	newMember := &ConversationMember{
		ID:             uuid.New(),
		ConversationID: groupID,
		UserID:         newMemberID,
		Role:           MemberRoleMember,
		JoinedAt:       time.Now(),
	}

	err = s.repo.AddConversationMember(newMember)
	if err == nil {
		// 失效会话缓存
		_ = redis.InvalidateConversationCache(groupID.String())
	}
	return err
}

// RemoveGroupMember 移除群成员
func (s *Service) RemoveGroupMember(groupID, userID, targetUserID uuid.UUID) error {
	member, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return errors.New("not a member of this group")
	}

	// 检查权限
	if userID != targetUserID {
		// 不是移除自己，需要群主或管理员权限
		if member.Role != MemberRoleOwner && member.Role != MemberRoleAdmin {
			return errors.New("not authorized to remove members")
		}

		// 管理员不能移除群主或其他管理员
		targetMember, err := s.repo.GetConversationMember(groupID, targetUserID)
		if err != nil {
			return errors.New("target user not in group")
		}
		if targetMember.Role == MemberRoleOwner {
			return errors.New("cannot remove group owner")
		}
		if member.Role == MemberRoleAdmin && targetMember.Role == MemberRoleAdmin {
			return errors.New("cannot remove other admins")
		}
	}

	err = s.repo.RemoveConversationMember(groupID, targetUserID)
	if err == nil {
		// 失效会话缓存
		_ = redis.InvalidateConversationCache(groupID.String())
	}
	return err
}

// UpdateMemberRole 更新成员角色
func (s *Service) UpdateMemberRole(groupID, userID, targetUserID uuid.UUID, role string) error {
	member, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return errors.New("not a member of this group")
	}

	// 只有群主可以修改角色
	if member.Role != MemberRoleOwner {
		return errors.New("only group owner can modify roles")
	}

	targetMember, err := s.repo.GetConversationMember(groupID, targetUserID)
	if err != nil {
		return errors.New("target user not in group")
	}

	// 不能修改群主的角色
	if targetMember.Role == MemberRoleOwner {
		return errors.New("cannot modify owner's role")
	}

	targetMember.Role = role
	err = s.repo.UpdateConversationMember(targetMember)
	if err == nil {
		// 失效会话缓存
		_ = redis.InvalidateConversationCache(groupID.String())
	}
	return err
}

// LeaveGroup 退出群组
func (s *Service) LeaveGroup(groupID, userID uuid.UUID) error {
	member, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return errors.New("not a member of this group")
	}

	// 群主不能直接退出，需要先转让群主或解散群组
	if member.Role == MemberRoleOwner {
		return errors.New("owner cannot leave group, transfer ownership or disband first")
	}

	err = s.repo.RemoveConversationMember(groupID, userID)
	if err == nil {
		// 失效会话缓存
		_ = redis.InvalidateConversationCache(groupID.String())
	}
	return err
}

// DisbandGroup 解散群组
func (s *Service) DisbandGroup(groupID, userID uuid.UUID) error {
	group, err := s.repo.GetGroupByID(groupID)
	if err != nil {
		return errors.New("group not found")
	}

	// 只有群主可以解散群组
	if group.OwnerID != userID {
		return errors.New("only group owner can disband group")
	}

	// 删除群组记录
	if err := s.repo.DeleteGroup(groupID); err != nil {
		return err
	}

	// 失效会话缓存
	_ = redis.InvalidateConversationCache(groupID.String())

	// 会话会通过级联删除或软删除处理
	return nil
}

// GetGroupMembers 获取群成员列表
func (s *Service) GetGroupMembers(groupID, userID uuid.UUID) ([]*ConversationMember, error) {
	// 验证用户是否是群成员
	_, err := s.repo.GetConversationMember(groupID, userID)
	if err != nil {
		return nil, errors.New("not a member of this group")
	}

	return s.repo.GetConversationMembers(groupID)
}

// ForwardMessage 转发消息
func (s *Service) ForwardMessage(msgID, userID uuid.UUID, convIDs []uuid.UUID, additionalText string) ([]*Message, error) {
	// 获取原消息
	originalMsg, err := s.repo.GetMessageByID(msgID)
	if err != nil {
		return nil, errors.New("original message not found")
	}

	var forwardedMsgs []*Message

	for _, convID := range convIDs {
		// 验证用户是否是目标会话成员
		_, err := s.repo.GetConversationMember(convID, userID)
		if err != nil {
			continue // 跳过无权访问的会话
		}

		now := time.Now()

		// 构建转发消息内容
		forwardContent := originalMsg.Content
		if additionalText != "" {
			forwardContent = additionalText + "\n\n" + forwardContent
		}

		// 创建新消息
		newMsg := &Message{
			ID:             uuid.New(),
			ConversationID: convID,
			SenderID:       userID,
			Type:           originalMsg.Type,
			Content:        forwardContent,
			MediaURL:       originalMsg.MediaURL,
			FileName:       originalMsg.FileName,
			FileSize:       originalMsg.FileSize,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		if err := s.repo.CreateMessage(newMsg); err != nil {
			continue
		}

		// 更新会话最后消息
		conv, err := s.repo.GetConversationByID(convID)
		if err == nil {
			conv.LastMessage = forwardContent
			conv.LastMsgAt = &now
			conv.UpdatedAt = now
			_ = s.repo.UpdateConversation(conv)
		}

		// 增加未读计数
		_ = s.repo.IncrementUnreadCount(convID, userID)

		// 获取完整消息（包含发送者信息）
		fullMsg, err := s.repo.GetMessageByID(newMsg.ID)
		if err == nil {
			forwardedMsgs = append(forwardedMsgs, fullMsg)

			// 通过WebSocket广播新消息
			if s.hub != nil {
				s.hub.broadcast <- WSMessage{
					Type:   WSMessageTypeNewMessage,
					FromID: userID,
					ConvID: convID,
					Data:   fullMsg,
				}
			}

			// 失效会话缓存
			_ = redis.InvalidateConversationCache(convID.String())
		}
	}

	return forwardedMsgs, nil
}

// ==================== Call Service Methods ====================

// InitiateCall 发起通话
func (s *Service) InitiateCall(callerID, calleeID uuid.UUID, callType string) (*CallRecord, error) {
	if callerID == calleeID {
		return nil, errors.New("cannot call yourself")
	}

	// 检查是否已有进行中的通话
	activeCall, _ := s.repo.GetActiveCall(callerID)
	if activeCall != nil {
		return nil, errors.New("already in an active call")
	}

	activeCall, _ = s.repo.GetActiveCall(calleeID)
	if activeCall != nil {
		return nil, errors.New("callee is busy")
	}

	now := time.Now()
	record := &CallRecord{
		ID:        uuid.New(),
		CallerID:  callerID,
		CalleeID:  calleeID,
		Type:      callType,
		Status:    CallStatusCalling,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// 获取或创建单聊会话
	conv, _ := s.repo.GetSingleConversation(callerID, calleeID)
	if conv != nil {
		record.ConversationID = &conv.ID
	}

	if err := s.repo.CreateCallRecord(record); err != nil {
		return nil, err
	}

	return s.repo.GetCallRecordByID(record.ID)
}

// AcceptCall 接受通话
func (s *Service) AcceptCall(callID, userID uuid.UUID) (*CallRecord, error) {
	record, err := s.repo.GetCallRecordByID(callID)
	if err != nil {
		return nil, errors.New("call not found")
	}

	if record.CalleeID != userID {
		return nil, errors.New("not authorized to accept this call")
	}

	if record.Status != CallStatusCalling {
		return nil, errors.New("call is not in calling state")
	}

	if err := s.repo.AnswerCall(callID); err != nil {
		return nil, err
	}

	return s.repo.GetCallRecordByID(callID)
}

// RejectCall 拒绝通话
func (s *Service) RejectCall(callID, userID uuid.UUID) error {
	record, err := s.repo.GetCallRecordByID(callID)
	if err != nil {
		return errors.New("call not found")
	}

	if record.CalleeID != userID {
		return errors.New("not authorized to reject this call")
	}

	if record.Status != CallStatusCalling {
		return errors.New("call is not in calling state")
	}

	// 更新状态为已拒绝
	return s.repo.UpdateCallStatus(callID, CallStatusRejected)
}

// EndCall 结束通话
func (s *Service) EndCall(callID, userID uuid.UUID) error {
	record, err := s.repo.GetCallRecordByID(callID)
	if err != nil {
		return errors.New("call not found")
	}

	if record.CallerID != userID && record.CalleeID != userID {
		return errors.New("not authorized to end this call")
	}

	if record.Status != CallStatusCalling && record.Status != CallStatusInProgress {
		return errors.New("call is not active")
	}

	return s.repo.EndCall(callID)
}

// GetCallRecord 获取通话记录
func (s *Service) GetCallRecord(callID, userID uuid.UUID) (*CallRecord, error) {
	record, err := s.repo.GetCallRecordByID(callID)
	if err != nil {
		return nil, errors.New("call not found")
	}

	if record.CallerID != userID && record.CalleeID != userID {
		return nil, errors.New("not authorized to access this call")
	}

	return record, nil
}

// GetUserCallRecords 获取用户的通话记录列表
func (s *Service) GetUserCallRecords(userID uuid.UUID, limit int) ([]*CallRecord, error) {
	return s.repo.GetUserCallRecords(userID, limit)
}

// ==================== Mention Service Methods ====================

// GetUserMentions 获取用户的提及列表
func (s *Service) GetUserMentions(userID uuid.UUID, limit int) ([]*Mention, error) {
	return s.repo.GetUserMentions(userID, limit)
}

// MarkMentionAsRead 标记提及为已读
func (s *Service) MarkMentionAsRead(mentionID, userID uuid.UUID) error {
	// 验证提及是否属于该用户
	mentions, err := s.repo.GetUserMentions(userID, 100)
	if err != nil {
		return errors.New("mention not found")
	}

	var targetMention *Mention
	for _, m := range mentions {
		if m.ID == mentionID {
			targetMention = m
			break
		}
	}

	if targetMention == nil {
		return errors.New("mention not found")
	}

	return s.repo.MarkMentionAsRead(mentionID)
}

// MarkUserMentionsAsRead 标记用户的所有提及为已读
func (s *Service) MarkUserMentionsAsRead(userID uuid.UUID) error {
	return s.repo.MarkUserMentionsAsRead(userID)
}

// GetUnreadMentionCount 获取用户未读提及数量
func (s *Service) GetUnreadMentionCount(userID uuid.UUID) (int64, error) {
	return s.repo.GetUnreadMentionCount(userID)
}
