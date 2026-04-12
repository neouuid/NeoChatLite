package auth

import (
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

// Register 注册接口
// @Summary 用户注册
// @Description 创建新用户账户
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册信息"
// @Success 200 {object} response.ApiResponse{data=AuthResponse}
// @Failure 400 {object} response.ApiResponse
// @Failure 500 {object} response.ApiResponse
// @Router /api/v1/auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	// 验证必填字段
	if req.Username == "" {
		response.BadRequest(c, "username is required")
		return
	}
	if req.Password == "" {
		response.BadRequest(c, "password is required")
		return
	}

	resp, err := h.service.Register(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, resp)
}

// Login 登录接口
// @Summary 用户登录
// @Description 使用用户名/邮箱/手机号和密码登录
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录信息"
// @Success 200 {object} response.ApiResponse{data=AuthResponse}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Identifier == "" {
		response.BadRequest(c, "identifier is required")
		return
	}
	if req.Password == "" {
		response.BadRequest(c, "password is required")
		return
	}

	resp, err := h.service.Login(&req)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, resp)
}

// RefreshToken 刷新令牌接口
// @Summary 刷新访问令牌
// @Description 使用刷新令牌获取新的访问令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "刷新令牌"
// @Success 200 {object} response.ApiResponse{data=AuthResponse}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/auth/refresh [post]
func (h *Handler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.RefreshToken == "" {
		response.BadRequest(c, "refresh_token is required")
		return
	}

	resp, err := h.service.RefreshToken(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, resp)
}

// GetProfile 获取当前用户信息
// @Summary 获取当前用户信息
// @Description 获取已登录用户的详细信息
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse{data=user.User}
// @Failure 401 {object} response.ApiResponse
// @Failure 404 {object} response.ApiResponse
// @Router /api/v1/auth/profile [get]
func (h *Handler) GetProfile(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		response.Unauthorized(c, "invalid user ID")
		return
	}

	u, err := h.service.GetUser(userID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	// 不返回密码
	u.Password = ""

	response.Success(c, u)
}

// ForgotPassword 忘记密码接口
// @Summary 忘记密码
// @Description 发送验证码到邮箱以重置密码
// @Tags auth
// @Accept json
// @Produce json
// @Param request body ForgotPasswordRequest true "邮箱信息"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 404 {object} response.ApiResponse
// @Router /api/v1/auth/forgot-password [post]
func (h *Handler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Email == "" {
		response.BadRequest(c, "email is required")
		return
	}

	token, err := h.service.ForgotPassword(&req)
	if err != nil {
		if err.Error() == "email not found" {
			response.NotFound(c, err.Error())
		} else {
			response.BadRequest(c, err.Error())
		}
		return
	}

	response.Success(c, gin.H{
		"message": "verification code sent to email",
		"token":   token, // 仅用于测试，生产环境应移除
	})
}

// ResetPassword 重置密码接口
// @Summary 重置密码
// @Description 使用验证码重置密码
// @Tags auth
// @Accept json
// @Produce json
// @Param request body ResetPasswordRequest true "重置密码信息"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Router /api/v1/auth/reset-password [post]
func (h *Handler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Token == "" {
		response.BadRequest(c, "token is required")
		return
	}
	if req.NewPassword == "" {
		response.BadRequest(c, "new_password is required")
		return
	}

	if err := h.service.ResetPassword(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "password reset successfully",
	})
}

// ChangePassword 修改密码接口
// @Summary 修改密码
// @Description 已登录用户修改密码
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body ChangePasswordRequest true "密码信息"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/auth/change-password [post]
func (h *Handler) ChangePassword(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		response.Unauthorized(c, "invalid user ID")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.OldPassword == "" {
		response.BadRequest(c, "old_password is required")
		return
	}
	if req.NewPassword == "" {
		response.BadRequest(c, "new_password is required")
		return
	}

	if err := h.service.ChangePassword(userID, &req); err != nil {
		if err.Error() == "invalid old password" {
			response.Unauthorized(c, err.Error())
		} else {
			response.BadRequest(c, err.Error())
		}
		return
	}

	response.Success(c, gin.H{
		"message": "password changed successfully",
	})
}

// SendEmailVerification 发送邮箱验证邮件
// @Summary 发送邮箱验证邮件
// @Description 向已登录用户发送邮箱验证邮件
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/auth/send-verification-email [post]
func (h *Handler) SendEmailVerification(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		response.Unauthorized(c, "invalid user ID")
		return
	}

	token, err := h.service.SendEmailVerification(userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "verification email sent",
		"code":    token, // 仅用于测试，生产环境应移除
	})
}

// VerifyEmail 验证邮箱
// @Summary 验证邮箱
// @Description 使用验证码验证邮箱
// @Tags auth
// @Accept json
// @Produce json
// @Param request body VerifyEmailRequest true "验证码"
// @Success 200 {object} response.ApiResponse
// @Failure 400 {object} response.ApiResponse
// @Router /api/v1/auth/verify-email [post]
func (h *Handler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Code == "" {
		response.BadRequest(c, "code is required")
		return
	}

	if err := h.service.VerifyEmail(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "email verified successfully",
	})
}
