package chat

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/neochat/backend/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GetUserIDFromContext 从上下文中获取用户ID
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, nil
	}
	return uuid.Parse(userIDStr.(string))
}

// ==================== Conversation Handlers ====================

// CreateSingleConversation 创建单聊会话
// @Summary 创建单聊会话
// @Description 创建与指定用户的单聊会话
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "用户ID"
// @Success 200 {object} response.ApiResponse{data=Conversation}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/conversation/single [post]
func (h *Handler) CreateSingleConversation(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	targetUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	conv, err := h.service.CreateSingleConversation(userID, targetUserID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, conv)
}

// GetConversation 获取会话
// @Summary 获取会话详情
// @Description 获取指定会话的详细信息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "会话ID"
// @Success 200 {object} response.ApiResponse{data=Conversation}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/conversation/{id} [get]
func (h *Handler) GetConversation(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid conversation id")
		return
	}

	conv, err := h.service.GetConversation(convID, userID)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, conv)
}

// GetUserConversations 获取用户会话列表
// @Summary 获取会话列表
// @Description 获取当前用户的所有会话
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=[]Conversation}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/conversations [get]
func (h *Handler) GetUserConversations(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	convs, err := h.service.GetUserConversations(userID)
	if err != nil {
		response.InternalServerError(c, "failed to get conversations")
		return
	}

	response.Success(c, convs)
}

// ==================== Message Handlers ====================

// SendMessage 发送消息
// @Summary 发送消息
// @Description 向指定会话发送消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]interface{} true "消息内容"
// @Success 200 {object} response.ApiResponse{data=Message}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/message [post]
func (h *Handler) SendMessage(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		ConversationID string      `json:"conversation_id"`
		Type           string      `json:"type"`
		Content        string      `json:"content"`
		MediaURL       string      `json:"media_url"`
		FileName       string      `json:"file_name"`
		FileSize       int64       `json:"file_size"`
		ReplyToID      *string     `json:"reply_to_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	convID, err := uuid.Parse(req.ConversationID)
	if err != nil {
		response.BadRequest(c, "invalid conversation id")
		return
	}

	if req.Type == "" {
		req.Type = MessageTypeText
	}
	if req.Content == "" && req.Type == MessageTypeText {
		response.BadRequest(c, "content is required")
		return
	}

	var replyToID *uuid.UUID
	if req.ReplyToID != nil {
		id, err := uuid.Parse(*req.ReplyToID)
		if err == nil {
			replyToID = &id
		}
	}

	msg, err := h.service.SendMessage(convID, userID, req.Type, req.Content, req.MediaURL, req.FileName, req.FileSize, replyToID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, msg)
}

// GetConversationMessages 获取会话消息
// @Summary 获取会话消息
// @Description 获取指定会话的消息列表
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "会话ID"
// @Param before query string false "在此时间之前的消息"
// @Param limit query int false "消息数量限制" default(50)
// @Success 200 {object} response.ApiResponse{data=[]Message}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/conversation/{id}/messages [get]
func (h *Handler) GetConversationMessages(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid conversation id")
		return
	}

	var before *time.Time
	if beforeStr := c.Query("before"); beforeStr != "" {
		if t, err := time.Parse(time.RFC3339, beforeStr); err == nil {
			before = &t
		}
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		_, _ = fmt.Sscanf(limitStr, "%d", &limit)
	}

	msgs, err := h.service.GetConversationMessages(convID, userID, before, limit)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, msgs)
}

// EditMessage 编辑消息
// @Summary 编辑消息
// @Description 编辑已发送的消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "消息ID"
// @Param request body map[string]string true "消息内容"
// @Success 200 {object} response.ApiResponse{data=Message}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/message/{id} [put]
func (h *Handler) EditMessage(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	msgID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid message id")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Content == "" {
		response.BadRequest(c, "content is required")
		return
	}

	msg, err := h.service.EditMessage(msgID, userID, req.Content)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, msg)
}

// DeleteMessage 删除消息
// @Summary 删除消息
// @Description 删除指定消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "消息ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/message/{id} [delete]
func (h *Handler) DeleteMessage(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	msgID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid message id")
		return
	}

	if err := h.service.DeleteMessage(msgID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// MarkConversationAsRead 标记会话为已读
// @Summary 标记会话为已读
// @Description 将指定会话的所有消息标记为已读
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "会话ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/conversation/{id}/read [post]
func (h *Handler) MarkConversationAsRead(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid conversation id")
		return
	}

	if err := h.service.MarkConversationAsRead(convID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ==================== Favorite Handlers ====================

// AddFavorite 添加收藏
// @Summary 添加收藏
// @Description 收藏指定消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "消息ID和备注"
// @Success 200 {object} response.ApiResponse{data=Favorite}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/favorite [post]
func (h *Handler) AddFavorite(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		MessageID string `json:"message_id"`
		Note      string `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	msgID, err := uuid.Parse(req.MessageID)
	if err != nil {
		response.BadRequest(c, "invalid message id")
		return
	}

	fav, err := h.service.AddFavorite(userID, msgID, req.Note)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, fav)
}

// RemoveFavorite 移除收藏
// @Summary 移除收藏
// @Description 取消收藏指定消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "收藏ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/favorite/{id} [delete]
func (h *Handler) RemoveFavorite(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	favID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid favorite id")
		return
	}

	if err := h.service.RemoveFavorite(favID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetUserFavorites 获取收藏列表
// @Summary 获取收藏列表
// @Description 获取当前用户的收藏消息
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=[]Favorite}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/favorites [get]
func (h *Handler) GetUserFavorites(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	favs, err := h.service.GetUserFavorites(userID)
	if err != nil {
		response.InternalServerError(c, "failed to get favorites")
		return
	}

	response.Success(c, favs)
}

// ==================== Group Handlers ====================

// CreateGroup 创建群组
// @Summary 创建群组
// @Description 创建新的群组聊天
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]interface{} true "群组信息"
// @Success 200 {object} response.ApiResponse{data=map[string]interface{}}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group [post]
func (h *Handler) CreateGroup(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Avatar      string   `json:"avatar"`
		MemberIDs   []string `json:"member_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Name == "" {
		response.BadRequest(c, "group name is required")
		return
	}

	var memberIDs []uuid.UUID
	for _, idStr := range req.MemberIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			memberIDs = append(memberIDs, id)
		}
	}

	conv, group, err := h.service.CreateGroup(userID, req.Name, req.Description, req.Avatar, memberIDs)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"conversation": conv,
		"group":        group,
	})
}

// GetGroup 获取群组信息
// @Summary 获取群组信息
// @Description 获取指定群组的详细信息
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Success 200 {object} response.ApiResponse{data=Group}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id} [get]
func (h *Handler) GetGroup(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	group, err := h.service.GetGroup(groupID, userID)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, group)
}

// UpdateGroup 更新群组信息
// @Summary 更新群组信息
// @Description 更新群组的名称、描述等信息
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Param request body map[string]string true "群组信息"
// @Success 200 {object} response.ApiResponse{data=Group}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id} [put]
func (h *Handler) UpdateGroup(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	group, err := h.service.UpdateGroup(groupID, userID, req.Name, req.Description, req.Avatar)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, group)
}

// AddGroupMember 添加群成员
// @Summary 添加群成员
// @Description 将用户添加到群组
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Param request body map[string]string true "用户ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id}/members [post]
func (h *Handler) AddGroupMember(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	newMemberID, err := uuid.Parse(req.UserID)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	if err := h.service.AddGroupMember(groupID, userID, newMemberID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// RemoveGroupMember 移除群成员
// @Summary 移除群成员
// @Description 将成员从群组移除
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Param user_id path string true "成员用户ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id}/members/{user_id} [delete]
func (h *Handler) RemoveGroupMember(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	targetUserIDStr := c.Param("user_id")
	targetUserID, err := uuid.Parse(targetUserIDStr)
	if err != nil {
		response.BadRequest(c, "invalid target user id")
		return
	}

	if err := h.service.RemoveGroupMember(groupID, userID, targetUserID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// UpdateMemberRole 更新成员角色
// @Summary 更新成员角色
// @Description 更改群组成员的角色
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Param user_id path string true "成员用户ID"
// @Param request body map[string]string true "角色"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id}/members/{user_id}/role [put]
func (h *Handler) UpdateMemberRole(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	targetUserIDStr := c.Param("user_id")
	targetUserID, err := uuid.Parse(targetUserIDStr)
	if err != nil {
		response.BadRequest(c, "invalid target user id")
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Role != MemberRoleMember && req.Role != MemberRoleAdmin && req.Role != MemberRoleOwner {
		response.BadRequest(c, "invalid role")
		return
	}

	if err := h.service.UpdateMemberRole(groupID, userID, targetUserID, req.Role); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// LeaveGroup 退出群组
// @Summary 退出群组
// @Description 主动退出群组
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id}/leave [post]
func (h *Handler) LeaveGroup(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	if err := h.service.LeaveGroup(groupID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// DisbandGroup 解散群组
// @Summary 解散群组
// @Description 解散整个群组（仅群主）
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id} [delete]
func (h *Handler) DisbandGroup(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	if err := h.service.DisbandGroup(groupID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetGroupMembers 获取群成员列表
// @Summary 获取群成员列表
// @Description 获取群组的所有成员
// @Tags group
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "群组ID"
// @Success 200 {object} response.ApiResponse{data=[]ConversationMember}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/group/{id}/members [get]
func (h *Handler) GetGroupMembers(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	groupID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	members, err := h.service.GetGroupMembers(groupID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, members)
}

// ==================== Message Forward Handler ====================

// ForwardMessage 转发消息
// @Summary 转发消息
// @Description 将消息转发到多个会话
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]interface{} true "转发信息"
// @Success 200 {object} response.ApiResponse{data=[]Message}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/chat/messages/forward [post]
func (h *Handler) ForwardMessage(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		MessageID       string   `json:"message_id"`
		ConversationIDs []string `json:"conversation_ids"`
		AdditionalText  string   `json:"additional_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	msgID, err := uuid.Parse(req.MessageID)
	if err != nil {
		response.BadRequest(c, "invalid message id")
		return
	}

	var convIDs []uuid.UUID
	for _, idStr := range req.ConversationIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			convIDs = append(convIDs, id)
		}
	}

	if len(convIDs) == 0 {
		response.BadRequest(c, "no valid conversation ids")
		return
	}

	msgs, err := h.service.ForwardMessage(msgID, userID, convIDs, req.AdditionalText)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, msgs)
}

// ==================== Call Handlers ====================

// InitiateCall 发起通话
// @Summary 发起通话
// @Description 向指定用户发起视频或语音通话
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "通话信息"
// @Success 200 {object} response.ApiResponse{data=CallRecord}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/call/initiate [post]
func (h *Handler) InitiateCall(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		CalleeID string `json:"callee_id"`
		Type     string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	calleeID, err := uuid.Parse(req.CalleeID)
	if err != nil {
		response.BadRequest(c, "invalid callee id")
		return
	}

	if req.Type != CallTypeVideo && req.Type != CallTypeVoice {
		response.BadRequest(c, "invalid call type")
		return
	}

	record, err := h.service.InitiateCall(userID, calleeID, req.Type)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, record)
}

// AcceptCall 接受通话
// @Summary 接受通话
// @Description 接受来电
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "通话ID"
// @Success 200 {object} response.ApiResponse{data=CallRecord}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/call/{id}/accept [post]
func (h *Handler) AcceptCall(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	callID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid call id")
		return
	}

	record, err := h.service.AcceptCall(callID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, record)
}

// RejectCall 拒绝通话
// @Summary 拒绝通话
// @Description 拒绝来电
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "通话ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/call/{id}/reject [post]
func (h *Handler) RejectCall(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	callID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid call id")
		return
	}

	if err := h.service.RejectCall(callID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// EndCall 结束通话
// @Summary 结束通话
// @Description 挂断当前通话
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "通话ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/call/{id}/end [post]
func (h *Handler) EndCall(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	callID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid call id")
		return
	}

	if err := h.service.EndCall(callID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetCallRecord 获取通话记录
// @Summary 获取通话记录
// @Description 获取指定通话的详细信息
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "通话ID"
// @Success 200 {object} response.ApiResponse{data=CallRecord}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/call/{id} [get]
func (h *Handler) GetCallRecord(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	callID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid call id")
		return
	}

	record, err := h.service.GetCallRecord(callID, userID)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, record)
}

// GetUserCallRecords 获取用户通话记录列表
// @Summary 获取通话记录列表
// @Description 获取当前用户的通话记录
// @Tags call
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "记录数量限制" default(50)
// @Success 200 {object} response.ApiResponse{data=[]CallRecord}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/calls [get]
func (h *Handler) GetUserCallRecords(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		_, _ = fmt.Sscanf(limitStr, "%d", &limit)
	}

	records, err := h.service.GetUserCallRecords(userID, limit)
	if err != nil {
		response.InternalServerError(c, "failed to get call records")
		return
	}

	response.Success(c, records)
}


	// ==================== Search Handlers ====================

	// SearchMessages 搜索消息
	// @Summary 搜索消息
	// @Description 在用户参与的会话中搜索消息内容
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Param q query string true "搜索关键词"
	// @Param limit query int false "结果数量限制" default(50)
	// @Success 200 {object} response.ApiResponse{data=[]Message}
	// @Failure 400 {object} response.ApiResponse
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/search/messages [get]
	func (h *Handler) SearchMessages(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		query := c.Query("q")
		if query == "" {
			response.BadRequest(c, "search query is required")
			return
		}

		limit := 50
		if limitStr := c.Query("limit"); limitStr != "" {
			_, _ = fmt.Sscanf(limitStr, "%d", &limit)
		}

		msgs, err := h.service.SearchMessages(userID, query, limit)
		if err != nil {
			response.InternalServerError(c, "failed to search messages")
			return
		}

		response.Success(c, msgs)
	}

	// SearchGroups 搜索群组
	// @Summary 搜索群组
	// @Description 在用户加入的群组中搜索
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Param q query string true "搜索关键词"
	// @Param limit query int false "结果数量限制" default(50)
	// @Success 200 {object} response.ApiResponse{data=[]Group}
	// @Failure 400 {object} response.ApiResponse
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/search/groups [get]
	func (h *Handler) SearchGroups(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		query := c.Query("q")
		if query == "" {
			response.BadRequest(c, "search query is required")
			return
		}

		limit := 50
		if limitStr := c.Query("limit"); limitStr != "" {
			_, _ = fmt.Sscanf(limitStr, "%d", &limit)
		}

		groups, err := h.service.SearchGroups(userID, query, limit)
		if err != nil {
			response.InternalServerError(c, "failed to search groups")
			return
		}

		response.Success(c, groups)
	}

	// ==================== Mention Handlers ====================

	// GetUserMentions 获取用户提及列表
	// @Summary 获取提及列表
	// @Description 获取当前用户被@的消息列表
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Param limit query int false "结果数量限制" default(50)
	// @Success 200 {object} response.ApiResponse{data=[]Mention}
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/mentions [get]
	func (h *Handler) GetUserMentions(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		limit := 50
		if limitStr := c.Query("limit"); limitStr != "" {
			_, _ = fmt.Sscanf(limitStr, "%d", &limit)
		}

		mentions, err := h.service.GetUserMentions(userID, limit)
		if err != nil {
			response.InternalServerError(c, "failed to get mentions")
			return
		}

		response.Success(c, mentions)
	}

	// MarkMentionAsRead 标记提及为已读
	// @Summary 标记提及为已读
	// @Description 将指定提及标记为已读
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Param id path string true "提及ID"
	// @Success 200 {object} response.ApiResponse
	// @Failure 400 {object} response.ApiResponse
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/mention/{id}/read [post]
	func (h *Handler) MarkMentionAsRead(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		idStr := c.Param("id")
		mentionID, err := uuid.Parse(idStr)
		if err != nil {
			response.BadRequest(c, "invalid mention id")
			return
		}

		if err := h.service.MarkMentionAsRead(mentionID, userID); err != nil {
			response.BadRequest(c, err.Error())
			return
		}

		response.Success(c, nil)
	}

	// MarkAllMentionsAsRead 标记所有提及为已读
	// @Summary 标记所有提及为已读
	// @Description 将当前用户的所有提及标记为已读
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Success 200 {object} response.ApiResponse
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/mentions/read-all [post]
	func (h *Handler) MarkAllMentionsAsRead(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		if err := h.service.MarkUserMentionsAsRead(userID); err != nil {
			response.InternalServerError(c, "failed to mark all mentions as read")
			return
		}

		response.Success(c, nil)
	}

	// GetUnreadMentionCount 获取未读提及数量
	// @Summary 获取未读提及数量
	// @Description 获取当前用户的未读提及数量
	// @Tags chat
	// @Accept json
	// @Produce json
	// @Security BearerAuth
	// @Success 200 {object} response.ApiResponse{data=int64}
	// @Failure 401 {object} response.ApiResponse
	// @Router /api/v1/chat/mentions/unread-count [get]
	func (h *Handler) GetUnreadMentionCount(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil || userID == uuid.Nil {
			response.Unauthorized(c, "unauthorized")
			return
		}

		count, err := h.service.GetUnreadMentionCount(userID)
		if err != nil {
			response.InternalServerError(c, "failed to get unread mention count")
			return
		}

		response.Success(c, gin.H{"count": count})
	}

