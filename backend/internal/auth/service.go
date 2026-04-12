package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/utils"
	"gorm.io/gorm"
)

type Service struct {
	repo   *Repository
	config *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, config: cfg}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email,omitempty"`
	Phone    string `json:"phone,omitempty"`
	Nickname string `json:"nickname,omitempty"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Identifier string `json:"identifier"` // 用户名、邮箱或手机号
	Password   string `json:"password"`
}

// ForgotPasswordRequest 忘记密码请求
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// VerifyEmailRequest 验证邮箱请求
type VerifyEmailRequest struct {
	Code string `json:"code"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token"`
	User         *user.User `json:"user"`
}

// Register 用户注册
func (s *Service) Register(req *RegisterRequest) (*AuthResponse, error) {
	// 检查用户名是否存在
	exists, err := s.repo.CheckUsernameExists(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username already exists")
	}

	// 检查邮箱是否存在（如果提供了）
	if req.Email != "" {
		exists, err := s.repo.CheckEmailExists(req.Email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("email already exists")
		}
	}

	// 检查手机号是否存在（如果提供了）
	if req.Phone != "" {
		exists, err := s.repo.CheckPhoneExists(req.Phone)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("phone already exists")
		}
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 创建用户
	u := &user.User{
		ID:       uuid.New(),
		Username: req.Username,
		Password: hashedPassword,
		Email:    req.Email,
		Phone:    req.Phone,
		Nickname: req.Nickname,
		Status:   user.StatusOnline,
	}

	if u.Nickname == "" {
		u.Nickname = u.Username
	}

	if err := s.repo.CreateUser(u); err != nil {
		return nil, err
	}

	// 生成令牌
	return s.generateAuthResponse(u)
}

// Login 用户登录
func (s *Service) Login(req *LoginRequest) (*AuthResponse, error) {
	// 查找用户
	u, err := s.repo.GetUserByUsernameOrEmailOrPhone(req.Identifier)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// 验证密码
	if !utils.CheckPasswordHash(req.Password, u.Password) {
		return nil, errors.New("invalid credentials")
	}

	// 更新用户状态为在线
	u.Status = user.StatusOnline
	if err := s.repo.UpdateUser(u); err != nil {
		return nil, err
	}

	// 生成令牌
	return s.generateAuthResponse(u)
}

// RefreshToken 刷新令牌
func (s *Service) RefreshToken(refreshToken string) (*AuthResponse, error) {
	// 解析刷新令牌
	claims, err := utils.ParseToken(refreshToken, s.config)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// 查找用户
	u, err := s.repo.GetUserByID(claims.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// 生成新的令牌
	return s.generateAuthResponse(u)
}

// GetUser 获取用户信息
func (s *Service) GetUser(id uuid.UUID) (*user.User, error) {
	return s.repo.GetUserByID(id)
}

// ForgotPassword 忘记密码（发送验证码）
func (s *Service) ForgotPassword(req *ForgotPasswordRequest) (string, error) {
	// 检查邮箱是否存在
	exists, err := s.repo.CheckEmailExists(req.Email)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", errors.New("email not found")
	}

	// 获取用户
	u, err := s.repo.GetUserByEmail(req.Email)
	if err != nil {
		return "", err
	}

	// 删除用户之前的密码重置令牌
	if err := s.repo.DeleteUserVerificationTokens(u.ID, TokenTypePasswordReset); err != nil {
		return "", err
	}

	// 生成新的重置令牌
	token, err := generateRandomToken(32)
	if err != nil {
		return "", err
	}

	vt := &VerificationToken{
		UserID:    u.ID,
		Token:     token,
		Type:      TokenTypePasswordReset,
		ExpiresAt: time.Now().Add(1 * time.Hour), // 1小时过期
	}

	if err := s.repo.CreateVerificationToken(vt); err != nil {
		return "", err
	}

	// TODO: 这里应该发送验证码到邮箱
	// 暂时返回token用于测试
	return token, nil
}

// ResetPassword 重置密码
func (s *Service) ResetPassword(req *ResetPasswordRequest) error {
	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Token, TokenTypePasswordReset)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid or expired token")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return errors.New("token has expired")
	}

	// 获取用户
	u, err := s.repo.GetUserByID(vt.UserID)
	if err != nil {
		return err
	}

	// 加密新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 更新密码
	u.Password = hashedPassword
	if err := s.repo.UpdateUser(u); err != nil {
		return err
	}

	// 删除已使用的令牌
	return s.repo.DeleteVerificationToken(vt.ID)
}

// ChangePassword 修改密码
func (s *Service) ChangePassword(userID uuid.UUID, req *ChangePasswordRequest) error {
	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// 验证旧密码
	if !utils.CheckPasswordHash(req.OldPassword, u.Password) {
		return errors.New("invalid old password")
	}

	// 加密新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 更新密码
	u.Password = hashedPassword
	return s.repo.UpdateUser(u)
}

// SendEmailVerification 发送邮箱验证邮件
func (s *Service) SendEmailVerification(userID uuid.UUID) (string, error) {
	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return "", err
	}

	if u.Email == "" {
		return "", errors.New("user has no email")
	}

	// 删除用户之前的邮箱验证令牌
	if err := s.repo.DeleteUserVerificationTokens(u.ID, TokenTypeEmailVerification); err != nil {
		return "", err
	}

	// 生成新的验证令牌
	token, err := generateRandomToken(32)
	if err != nil {
		return "", err
	}

	vt := &VerificationToken{
		UserID:    u.ID,
		Token:     token,
		Type:      TokenTypeEmailVerification,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24小时过期
	}

	if err := s.repo.CreateVerificationToken(vt); err != nil {
		return "", err
	}

	// TODO: 这里应该发送验证邮件到用户邮箱
	// 暂时返回token用于测试
	return token, nil
}

// VerifyEmail 验证邮箱
func (s *Service) VerifyEmail(req *VerifyEmailRequest) error {
	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Code, TokenTypeEmailVerification)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid or expired code")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return errors.New("code has expired")
	}

	// 删除已使用的令牌
	return s.repo.DeleteVerificationToken(vt.ID)
}

// generateAuthResponse 生成认证响应
func (s *Service) generateAuthResponse(u *user.User) (*AuthResponse, error) {
	accessToken, err := utils.GenerateToken(u.ID, u.Username, s.config)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(u.ID, s.config)
	if err != nil {
		return nil, err
	}

	// 不返回密码
	userCopy := *u
	userCopy.Password = ""

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         &userCopy,
	}, nil
}

// generateRandomToken 生成随机令牌
func generateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
