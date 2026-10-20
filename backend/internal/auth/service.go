package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"github.com/neochat/backend/pkg/response"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/email"
	"github.com/neochat/backend/pkg/utils"
	"gorm.io/gorm"
)

type Service struct {
	repo         *Repository
	config       *config.Config
	emailService *email.Service
	// guard 登录失败计数：5 次失败锁 15 分钟
	guard *attemptGuard
}

func NewService(repo *Repository, cfg *config.Config, emailService *email.Service) *Service {
	return &Service{
		repo:         repo,
		config:       cfg,
		emailService: emailService,
		guard:        newAttemptGuard(5, 15*time.Minute, 15*time.Minute),
	}
}

// GenerateToken 生成访问令牌（用于测试）
func (s *Service) GenerateToken(userID uuid.UUID) (string, error) {
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return "", err
	}
	return utils.GenerateToken(u.ID, u.Username, s.config)
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

// DeleteAccountRequest 删除账户请求
type DeleteAccountRequest struct {
	Password string `json:"password"`
}

// UpdatePhoneRequest 更新手机号请求
type UpdatePhoneRequest struct {
	Phone string `json:"phone"`
	Code  string `json:"code"`
}

// UpdateEmailRequest 更新邮箱请求
type UpdateEmailRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// SendPhoneVerificationRequest 发送手机验证码请求
type SendPhoneVerificationRequest struct {
	Phone string `json:"phone"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token"`
	User         *user.User `json:"user"`
}

// Register 用户注册
func (s *Service) Register(req *RegisterRequest) (*AuthResponse, error) {
	if err := validatePassword(req.Password); err != nil {
		return nil, err
	}
	// 检查用户名是否存在
	exists, err := s.repo.CheckUsernameExists(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, response.Public("username already exists")
	}

	// 检查邮箱是否存在（如果提供了）
	if req.Email != "" {
		exists, err := s.repo.CheckEmailExists(req.Email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, response.Public("email already exists")
		}
	}

	// 检查手机号是否存在（如果提供了）
	if req.Phone != "" {
		exists, err := s.repo.CheckPhoneExists(req.Phone)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, response.Public("phone already exists")
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
		// 兜底：并发注册时唯一约束可能先于上面的存在性检查触发，
		// 这时也要给客户端可读提示，而不是 500。
		if isUniqueViolation(err) {
			return nil, response.Public("username, email or phone already exists")
		}
		return nil, err
	}

	// 生成令牌
	return s.generateAuthResponse(u)
}

// isUniqueViolation 判断唯一约束冲突（PostgreSQL 与 SQLite 的报错文案不同）
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key value") ||
		strings.Contains(msg, "unique constraint failed") ||
		strings.Contains(msg, "sqlstate 23505")
}

// Login 用户登录
func (s *Service) Login(req *LoginRequest) (*AuthResponse, error) {
	// 账号被锁定时直接拒绝，避免在线撞库
	if blocked, wait := s.guard.Blocked(req.Identifier); blocked {
		return nil, errLocked(wait)
	}

	// 查找用户
	u, err := s.repo.GetUserByUsernameOrEmailOrPhone(req.Identifier)
	if err != nil {
		s.guard.Fail(req.Identifier)
		return nil, response.Public("invalid credentials")
	}

	// 验证密码
	if !utils.CheckPasswordHash(req.Password, u.Password) {
		s.guard.Fail(req.Identifier)
		return nil, response.Public("invalid credentials")
	}

	// 登录成功，清除失败计数
	s.guard.Reset(req.Identifier)

	// 更新用户状态为在线
	u.Status = user.StatusOnline
	if err := s.repo.UpdateUser(u); err != nil {
		return nil, err
	}

	// 生成令牌
	return s.generateAuthResponse(u)
}

// RefreshToken 刷新令牌。
//
// 安全要点：
//   - 只接受 typ=refresh 的令牌（access token 不能用来续期）
//   - 令牌必须存在于服务端记录中，且未被吊销、未过期
//   - 每次刷新都吊销旧令牌并签发新令牌（轮换）；重放已吊销的令牌
//     会被视为令牌泄露，吊销该用户全部刷新令牌
func (s *Service) RefreshToken(refreshToken string) (*AuthResponse, error) {
	claims, err := utils.ParseRefreshToken(refreshToken, s.config)
	if err != nil {
		return nil, response.Public("invalid refresh token")
	}

	record, err := s.repo.GetRefreshTokenByHash(hashToken(refreshToken))
	if err != nil {
		return nil, response.Public("invalid refresh token")
	}

	if record.RevokedAt != nil {
		// 已用过的令牌被再次使用：可能是重放攻击，全部吊销
		_ = s.repo.RevokeAllRefreshTokens(record.UserID)
		return nil, response.Public("refresh token already used")
	}

	if time.Now().After(record.ExpiresAt) {
		return nil, response.Public("refresh token expired")
	}

	u, err := s.repo.GetUserByID(claims.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.Public("user not found")
		}
		return nil, err
	}

	// 轮换：先吊销旧令牌，再签发新令牌
	if err := s.repo.RevokeRefreshToken(record.ID); err != nil {
		return nil, err
	}
	return s.generateAuthResponse(u)
}

// Logout 吊销该用户全部刷新令牌（access token 到期自然失效）
func (s *Service) Logout(userID uuid.UUID) error {
	return s.repo.RevokeAllRefreshTokens(userID)
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
		return "", response.Public("email not found")
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

	// 发送密码重置邮件
	if s.emailService != nil {
		s.emailService.SendPasswordResetEmail(req.Email, token)
	}

	return token, nil
}

// ResetPassword 重置密码
func (s *Service) ResetPassword(req *ResetPasswordRequest) error {
	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Token, TokenTypePasswordReset)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.Public("invalid or expired token")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return response.Public("token has expired")
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

	// 密码已变更：吊销所有刷新令牌，旧会话必须重新登录
	_ = s.repo.RevokeAllRefreshTokens(u.ID)

	// 删除已使用的令牌
	return s.repo.DeleteVerificationToken(vt.ID)
}

// ChangePassword 修改密码
func (s *Service) ChangePassword(userID uuid.UUID, req *ChangePasswordRequest) error {
	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// 验证旧密码
	if !utils.CheckPasswordHash(req.OldPassword, u.Password) {
		return response.Public("invalid old password")
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

	// 改密后吊销所有刷新令牌（其它设备需要重新登录）
	return s.repo.RevokeAllRefreshTokens(u.ID)
}

// SendEmailVerification 发送邮箱验证邮件
func (s *Service) SendEmailVerification(userID uuid.UUID) (string, error) {
	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return "", err
	}

	if u.Email == "" {
		return "", response.Public("user has no email")
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

	// 发送邮箱验证邮件
	if s.emailService != nil {
		s.emailService.SendEmailVerificationEmail(u.Email, token)
	}

	return token, nil
}

// VerifyEmail 验证邮箱
func (s *Service) VerifyEmail(req *VerifyEmailRequest) error {
	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Code, TokenTypeEmailVerification)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.Public("invalid or expired code")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return response.Public("code has expired")
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

	// 刷新令牌必须在服务端留痕，否则无法吊销/轮换
	claims, err := utils.ParseRefreshToken(refreshToken, s.config)
	if err != nil {
		return nil, err
	}
	record := &RefreshToken{
		ID:        uuid.MustParse(claims.ID),
		UserID:    u.ID,
		TokenHash: hashToken(refreshToken),
		ExpiresAt: time.Unix(claims.ExpiresAt.Unix(), 0),
	}
	if err := s.repo.CreateRefreshToken(record); err != nil {
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

// DeleteAccount 删除账户
func (s *Service) DeleteAccount(userID uuid.UUID, req *DeleteAccountRequest) error {
	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// 验证密码
	if !utils.CheckPasswordHash(req.Password, u.Password) {
		return response.Public("invalid password")
	}

	// 删除用户（软删除）
	return s.repo.DeleteUser(userID)
}

// SendPhoneVerification 发送手机验证码
func (s *Service) SendPhoneVerification(userID uuid.UUID, phone string) (string, error) {
	// 检查手机号是否已被使用
	exists, err := s.repo.CheckPhoneExists(phone)
	if err != nil {
		return "", err
	}
	if exists {
		// 检查是否是当前用户的手机号
		u, err := s.repo.GetUserByID(userID)
		if err != nil {
			return "", err
		}
		if u.Phone != phone {
			return "", response.Public("phone already in use")
		}
	}

	// 删除用户之前的手机验证令牌
	if err := s.repo.DeleteUserVerificationTokens(userID, TokenTypePhoneVerification); err != nil {
		return "", err
	}

	// 生成6位数字验证码
	token := generateNumericCode(6)

	vt := &VerificationToken{
		UserID:    userID,
		Token:     token,
		Type:      TokenTypePhoneVerification,
		ExpiresAt: time.Now().Add(10 * time.Minute), // 10分钟过期
	}

	if err := s.repo.CreateVerificationToken(vt); err != nil {
		return "", err
	}

	// 直接返回验证码用于测试（生产环境需集成短信服务）
	return token, nil
}

// UpdatePhone 更新手机号
func (s *Service) UpdatePhone(userID uuid.UUID, req *UpdatePhoneRequest) error {
	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Code, TokenTypePhoneVerification)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.Public("invalid or expired code")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return response.Public("code has expired")
	}

	// 检查令牌是否属于当前用户
	if vt.UserID != userID {
		return response.Public("invalid code")
	}

	// 检查手机号是否已被其他用户使用
	exists, err := s.repo.CheckPhoneExists(req.Phone)
	if err != nil {
		return err
	}
	if exists {
		u, err := s.repo.GetUserByPhone(req.Phone)
		if err == nil && u.ID != userID {
			return response.Public("phone already in use")
		}
	}

	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// 更新手机号
	u.Phone = req.Phone
	if err := s.repo.UpdateUser(u); err != nil {
		return err
	}

	// 删除已使用的令牌
	return s.repo.DeleteVerificationToken(vt.ID)
}

// UpdateEmail 更新邮箱
func (s *Service) UpdateEmail(userID uuid.UUID, req *UpdateEmailRequest) error {
	// 获取验证令牌
	vt, err := s.repo.GetVerificationToken(req.Code, TokenTypeEmailVerification)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.Public("invalid or expired code")
		}
		return err
	}

	// 检查令牌是否过期
	if vt.IsExpired() {
		return response.Public("code has expired")
	}

	// 检查令牌是否属于当前用户
	if vt.UserID != userID {
		return response.Public("invalid code")
	}

	// 检查邮箱是否已被其他用户使用
	exists, err := s.repo.CheckEmailExists(req.Email)
	if err != nil {
		return err
	}
	if exists {
		u, err := s.repo.GetUserByEmail(req.Email)
		if err == nil && u.ID != userID {
			return response.Public("email already in use")
		}
	}

	// 获取用户
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// 更新邮箱
	u.Email = req.Email
	if err := s.repo.UpdateUser(u); err != nil {
		return err
	}

	// 删除已使用的令牌
	return s.repo.DeleteVerificationToken(vt.ID)
}

// GetUserDevices 获取用户的登录设备
func (s *Service) GetUserDevices(userID uuid.UUID) ([]*Device, error) {
	return s.repo.GetUserDevices(userID)
}

// GetUserLoginHistory 获取用户的登录历史
func (s *Service) GetUserLoginHistory(userID uuid.UUID, page int, pageSize int) ([]*LoginHistory, int64, error) {
	return s.repo.GetUserLoginHistory(userID, page, pageSize)
}

// CreateLoginHistoryRecord 创建登录历史记录
func (s *Service) CreateLoginHistoryRecord(userID uuid.UUID, loginType string, ipAddress string, userAgent string) error {
	history := &LoginHistory{
		UserID:    userID,
		Type:      loginType,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		CreatedAt: time.Now(),
	}
	return s.repo.CreateLoginHistory(history)
}

// generateNumericCode 生成指定长度的数字验证码
func generateNumericCode(length int) string {
	code := make([]byte, length)
	for i := 0; i < length; i++ {
		code[i] = byte('0' + (time.Now().UnixNano() % 10))
		time.Sleep(1 * time.Nanosecond)
	}
	return string(code)
}
