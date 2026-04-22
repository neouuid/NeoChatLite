package auth

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/neochat/backend/internal/user"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// CreateUser 创建用户
func (r *Repository) CreateUser(u *user.User) error {
	return r.db.Create(u).Error
}

// GetUserByID 根据 ID 获取用户
func (r *Repository) GetUserByID(id uuid.UUID) (*user.User, error) {
	var u user.User
	err := r.db.Where("id = ?", id).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByUsername 根据用户名获取用户
func (r *Repository) GetUserByUsername(username string) (*user.User, error) {
	var u user.User
	err := r.db.Where("username = ?", username).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByEmail 根据邮箱获取用户
func (r *Repository) GetUserByEmail(email string) (*user.User, error) {
	var u user.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByPhone 根据手机号获取用户
func (r *Repository) GetUserByPhone(phone string) (*user.User, error) {
	var u user.User
	err := r.db.Where("phone = ?", phone).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UpdateUser 更新用户
func (r *Repository) UpdateUser(u *user.User) error {
	return r.db.Save(u).Error
}

// CheckUsernameExists 检查用户名是否存在
func (r *Repository) CheckUsernameExists(username string) (bool, error) {
	var count int64
	err := r.db.Model(&user.User{}).Where("username = ?", username).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckEmailExists 检查邮箱是否存在
func (r *Repository) CheckEmailExists(email string) (bool, error) {
	if email == "" {
		return false, nil
	}
	var count int64
	err := r.db.Model(&user.User{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckPhoneExists 检查手机号是否存在
func (r *Repository) CheckPhoneExists(phone string) (bool, error) {
	if phone == "" {
		return false, nil
	}
	var count int64
	err := r.db.Model(&user.User{}).Where("phone = ?", phone).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetUserByUsernameOrEmailOrPhone 根据用户名、邮箱或手机号查找用户
func (r *Repository) GetUserByUsernameOrEmailOrPhone(identifier string) (*user.User, error) {
	var u user.User
	err := r.db.Where("username = ? OR email = ? OR phone = ?", identifier, identifier, identifier).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &u, nil
}

// CreateVerificationToken 创建验证令牌
func (r *Repository) CreateVerificationToken(token *VerificationToken) error {
	return r.db.Create(token).Error
}

// GetVerificationToken 获取验证令牌
func (r *Repository) GetVerificationToken(token string, tokenType string) (*VerificationToken, error) {
	var vt VerificationToken
	err := r.db.Where("token = ? AND type = ?", token, tokenType).First(&vt).Error
	if err != nil {
		return nil, err
	}
	return &vt, nil
}

// DeleteVerificationToken 删除验证令牌
func (r *Repository) DeleteVerificationToken(id uuid.UUID) error {
	return r.db.Delete(&VerificationToken{}, id).Error
}

// DeleteUserVerificationTokens 删除用户的所有指定类型验证令牌
func (r *Repository) DeleteUserVerificationTokens(userID uuid.UUID, tokenType string) error {
	return r.db.Where("user_id = ? AND type = ?", userID, tokenType).Delete(&VerificationToken{}).Error
}

// DeleteUser 软删除用户
func (r *Repository) DeleteUser(id uuid.UUID) error {
	return r.db.Delete(&user.User{}, id).Error
}

// CreateDevice 创建登录设备记录
func (r *Repository) CreateDevice(device *Device) error {
	return r.db.Create(device).Error
}

// GetUserDevices 获取用户的登录设备
func (r *Repository) GetUserDevices(userID uuid.UUID) ([]*Device, error) {
	var devices []*Device
	err := r.db.Where("user_id = ?", userID).Order("last_active DESC").Find(&devices).Error
	return devices, err
}

// DeleteDevice 删除设备记录
func (r *Repository) DeleteDevice(userID uuid.UUID, deviceID uuid.UUID) error {
	return r.db.Where("user_id = ? AND id = ?", userID, deviceID).Delete(&Device{}).Error
}

// CreateLoginHistory 创建登录历史记录
func (r *Repository) CreateLoginHistory(history *LoginHistory) error {
	return r.db.Create(history).Error
}

// GetUserLoginHistory 获取用户的登录历史（分页）
func (r *Repository) GetUserLoginHistory(userID uuid.UUID, page int, pageSize int) ([]*LoginHistory, int64, error) {
	var history []*LoginHistory
	var total int64

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	err := r.db.Model(&LoginHistory{}).Where("user_id = ?", userID).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.db.Where("user_id = ?", userID).Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&history).Error
	return history, total, err
}
