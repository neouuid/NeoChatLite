package user

import (
	"fmt"

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

// ==================== User Handlers ====================

// GetProfile 获取当前用户资料
// @Summary 获取当前用户资料
// @Description 获取已登录用户的详细资料
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=User}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/user/profile [get]
func (h *Handler) GetProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	user, err := h.service.GetUserProfile(userID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	response.Success(c, user)
}

// GetUserByID 获取指定用户资料
// @Summary 获取用户资料
// @Description 根据用户ID获取用户资料
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "用户ID"
// @Success 200 {object} response.ApiResponse{data=User}
// @Failure 401 {object} response.ApiResponse
// @Failure 404 {object} response.ApiResponse
// @Router /api/v1/user/{id} [get]
func (h *Handler) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	user, err := h.service.GetUserProfile(id)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	response.Success(c, user)
}

// SearchUsers 搜索用户
// @Summary 搜索用户
// @Description 根据关键词搜索用户
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param keyword query string true "搜索关键词"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} response.ApiResponse{data=map[string]interface{}}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/user/search [get]
func (h *Handler) SearchUsers(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		response.BadRequest(c, "keyword is required")
		return
	}

	page := 1
	pageSize := 20

	if pageStr := c.Query("page"); pageStr != "" {
		_, _ = fmt.Sscanf(pageStr, "%d", &page)
	}
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		_, _ = fmt.Sscanf(pageSizeStr, "%d", &pageSize)
	}

	users, total, err := h.service.SearchUsers(keyword, page, pageSize)
	if err != nil {
		response.InternalServerError(c, "failed to search users")
		return
	}

	response.Success(c, gin.H{
		"items":      users,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"has_more":   int64(page*pageSize) < total,
	})
}

// UpdateProfile 更新用户资料
// @Summary 更新用户资料
// @Description 更新当前用户的资料
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "更新信息"
// @Success 200 {object} response.ApiResponse{data=User}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/user/profile [put]
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		Nickname string `json:"nickname"`
		Bio      string `json:"bio"`
		Avatar   string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	user, err := h.service.UpdateProfile(userID, req.Nickname, req.Bio, req.Avatar)
	if err != nil {
		response.InternalServerError(c, "failed to update profile")
		return
	}

	response.Success(c, user)
}

// ==================== Friend Handlers ====================

// SendFriendRequest 发送好友请求
// @Summary 发送好友请求
// @Description 向指定用户发送好友请求
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "好友ID"
// @Success 200 {object} response.ApiResponse{data=Friend}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/request [post]
func (h *Handler) SendFriendRequest(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		FriendID string `json:"friend_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	friendID, err := uuid.Parse(req.FriendID)
	if err != nil {
		response.BadRequest(c, "invalid friend id")
		return
	}

	friend, err := h.service.SendFriendRequest(userID, friendID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, friend)
}

// AcceptFriendRequest 接受好友请求
// @Summary 接受好友请求
// @Description 接受好友请求
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "请求ID"
// @Success 200 {object} response.ApiResponse{data=Friend}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/request/{id}/accept [post]
func (h *Handler) AcceptFriendRequest(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	requestID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid request id")
		return
	}

	friend, err := h.service.AcceptFriendRequest(userID, requestID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, friend)
}

// RejectFriendRequest 拒绝好友请求
// @Summary 拒绝好友请求
// @Description 拒绝好友请求
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "请求ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/request/{id}/reject [post]
func (h *Handler) RejectFriendRequest(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	requestID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid request id")
		return
	}

	if err := h.service.RejectFriendRequest(userID, requestID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// CancelFriendRequest 取消好友请求
// @Summary 取消好友请求
// @Description 取消已发送的好友请求
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "请求ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/request/{id}/cancel [post]
func (h *Handler) CancelFriendRequest(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	requestID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid request id")
		return
	}

	if err := h.service.CancelFriendRequest(userID, requestID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetFriendRequests 获取好友请求列表
// @Summary 获取好友请求列表
// @Description 获取收到和发送的好友请求
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=map[string]interface{}}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/requests [get]
func (h *Handler) GetFriendRequests(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	pending, sent, err := h.service.GetFriendRequests(userID)
	if err != nil {
		response.InternalServerError(c, "failed to get friend requests")
		return
	}

	response.Success(c, gin.H{
		"pending": pending,
		"sent":    sent,
	})
}

// GetFriends 获取好友列表
// @Summary 获取好友列表
// @Description 获取当前用户的好友列表
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=[]User}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/list [get]
func (h *Handler) GetFriends(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	friends, err := h.service.GetFriends(userID)
	if err != nil {
		response.InternalServerError(c, "failed to get friends")
		return
	}

	response.Success(c, friends)
}

// DeleteFriend 删除好友
// @Summary 删除好友
// @Description 删除好友关系
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "好友ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/{id} [delete]
func (h *Handler) DeleteFriend(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	friendID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid friend id")
		return
	}

	if err := h.service.DeleteFriend(userID, friendID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// UpdateFriendAlias 更新好友备注
// @Summary 更新好友备注
// @Description 更新好友的备注名称
// @Tags friend
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "好友ID"
// @Param request body map[string]string true "备注"
// @Success 200 {object} response.ApiResponse{data=Friend}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/friend/{id}/alias [put]
func (h *Handler) UpdateFriendAlias(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	friendID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid friend id")
		return
	}

	var req struct {
		Alias string `json:"alias"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	friend, err := h.service.UpdateFriendAlias(userID, friendID, req.Alias)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, friend)
}

// ==================== Blocklist Handlers ====================

// BlockUser 拉黑用户
// @Summary 拉黑用户
// @Description 将用户加入黑名单
// @Tags block
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]string true "拉黑信息"
// @Success 200 {object} response.ApiResponse{data=Blocklist}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/block [post]
func (h *Handler) BlockUser(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req struct {
		BlockedID string `json:"blocked_id"`
		Reason    string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	blockedID, err := uuid.Parse(req.BlockedID)
	if err != nil {
		response.BadRequest(c, "invalid blocked id")
		return
	}

	block, err := h.service.BlockUser(userID, blockedID, req.Reason)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, block)
}

// UnblockUser 取消拉黑
// @Summary 取消拉黑
// @Description 将用户从黑名单移除
// @Tags block
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "被拉黑用户ID"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/block/{id} [delete]
func (h *Handler) UnblockUser(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	idStr := c.Param("id")
	blockedID, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid blocked id")
		return
	}

	if err := h.service.UnblockUser(userID, blockedID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetBlocklist 获取黑名单
// @Summary 获取黑名单
// @Description 获取当前用户的黑名单列表
// @Tags block
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=[]Blocklist}
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/block/list [get]
func (h *Handler) GetBlocklist(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	blocks, err := h.service.GetBlocklist(userID)
	if err != nil {
		response.InternalServerError(c, "failed to get blocklist")
		return
	}

	response.Success(c, blocks)
}
