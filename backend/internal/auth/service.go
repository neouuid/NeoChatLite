package auth

import (
	"errors"

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

// AuthResponse 认证响应
type AuthResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
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
