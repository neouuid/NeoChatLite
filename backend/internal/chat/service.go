package chat

import (
	"errors"
	"time"

	"github.com/google/uuid"
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
	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return nil, err
	}

	// 验证用户是否是会话成员
	isMember := false
	for _, m := range conv.Members {
		if m.UserID == userID {
			isMember = true
			break
		}
	}
	if !isMember {
		return nil, errors.New("not a member of this conversation")
	}

	return conv, nil
}

// GetUserConversations 获取用户的会话列表
func (s *Service) GetUserConversations(userID uuid.UUID) ([]*Conversation, error) {
	return s.repo.GetUserConversations(userID)
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

	return fullMsg, nil
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

	return msg, nil
}

// DeleteMessage 删除消息
func (s *Service) DeleteMessage(msgID, userID uuid.UUID) error {
	msg, err := s.repo.GetMessageByID(msgID)
	if err != nil {
		return errors.New("message not found")
	}

	// 验证是否是发送者或会话管理员（TODO: 实现管理员权限检查）
	if msg.SenderID != userID {
		return errors.New("not authorized to delete this message")
	}

	return s.repo.DeleteMessage(msgID)
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

	return s.repo.AddConversationMember(newMember)
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

	return s.repo.RemoveConversationMember(groupID, targetUserID)
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
	return s.repo.UpdateConversationMember(targetMember)
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

	return s.repo.RemoveConversationMember(groupID, userID)
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

