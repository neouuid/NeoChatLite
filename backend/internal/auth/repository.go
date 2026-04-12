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
