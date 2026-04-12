package user

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// ==================== User Repository Methods ====================

// GetUserByID 根据ID获取用户
func (r *Repository) GetUserByID(id uuid.UUID) (*User, error) {
	var u User
	err := r.db.Where("id = ?", id).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByUsername 根据用户名获取用户
func (r *Repository) GetUserByUsername(username string) (*User, error) {
	var u User
	err := r.db.Where("username = ?", username).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// SearchUsers 搜索用户
func (r *Repository) SearchUsers(keyword string, limit, offset int) ([]*User, int64, error) {
	var users []*User
	var total int64

	query := r.db.Model(&User{}).Where(
		"username LIKE ? OR nickname LIKE ? OR email LIKE ?",
		"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%",
	)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// 清除密码
	for i := range users {
		users[i].Password = ""
	}

	return users, total, nil
}

// UpdateUser 更新用户
func (r *Repository) UpdateUser(u *User) error {
	return r.db.Save(u).Error
}

// ==================== Friend Repository Methods ====================

// CreateFriendRequest 创建好友请求
func (r *Repository) CreateFriendRequest(friend *Friend) error {
	return r.db.Create(friend).Error
}

// GetFriendRequest 获取好友请求
func (r *Repository) GetFriendRequest(id uuid.UUID) (*Friend, error) {
	var f Friend
	err := r.db.Where("id = ?", id).First(&f).Error
	if err != nil {
		return nil, err
	}
	return &f, nil
}

// GetFriendRequestByUsers 获取两个用户之间的好友关系
func (r *Repository) GetFriendRequestByUsers(userID, friendID uuid.UUID) (*Friend, error) {
	var f Friend
	err := r.db.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		userID, friendID, friendID, userID,
	).First(&f).Error
	if err != nil {
		return nil, err
	}
	return &f, nil
}

// GetPendingFriendRequests 获取待处理的好友请求
func (r *Repository) GetPendingFriendRequests(userID uuid.UUID) ([]*Friend, error) {
	var friends []*Friend
	err := r.db.Where("friend_id = ? AND status = ?", userID, "pending").
		Preload("User").Find(&friends).Error
	if err != nil {
		return nil, err
	}
	return friends, nil
}

// GetSentFriendRequests 获取已发送的好友请求
func (r *Repository) GetSentFriendRequests(userID uuid.UUID) ([]*Friend, error) {
	var friends []*Friend
	err := r.db.Where("user_id = ? AND status = ?", userID, "pending").
		Preload("Friend").Find(&friends).Error
	if err != nil {
		return nil, err
	}
	return friends, nil
}

// GetFriends 获取好友列表
func (r *Repository) GetFriends(userID uuid.UUID) ([]*Friend, error) {
	var friends []*Friend
	err := r.db.Where(
		"(user_id = ? OR friend_id = ?) AND status = ?",
		userID, userID, "accepted",
	).Preload("User").Preload("Friend").Find(&friends).Error
	if err != nil {
		return nil, err
	}
	return friends, nil
}

// UpdateFriend 更新好友关系
func (r *Repository) UpdateFriend(f *Friend) error {
	return r.db.Save(f).Error
}

// DeleteFriend 删除好友关系
func (r *Repository) DeleteFriend(id uuid.UUID) error {
	return r.db.Delete(&Friend{}, id).Error
}

// CheckFriendStatus 检查好友状态
func (r *Repository) CheckFriendStatus(userID, friendID uuid.UUID) (string, error) {
	var f Friend
	err := r.db.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		userID, friendID, friendID, userID,
	).First(&f).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "none", nil
		}
		return "", err
	}

	return f.Status, nil
}

// ==================== Blocklist Repository Methods ====================

// CreateBlock 创建拉黑记录
func (r *Repository) CreateBlock(block *Blocklist) error {
	return r.db.Create(block).Error
}

// GetBlock 获取拉黑记录
func (r *Repository) GetBlock(id uuid.UUID) (*Blocklist, error) {
	var b Blocklist
	err := r.db.Where("id = ?", id).First(&b).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// GetBlockByUsers 获取两个用户之间的拉黑记录
func (r *Repository) GetBlockByUsers(userID, blockedID uuid.UUID) (*Blocklist, error) {
	var b Blocklist
	err := r.db.Where("user_id = ? AND blocked_id = ?", userID, blockedID).First(&b).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// GetBlocklist 获取拉黑列表
func (r *Repository) GetBlocklist(userID uuid.UUID) ([]*Blocklist, error) {
	var blocks []*Blocklist
	err := r.db.Where("user_id = ?", userID).Preload("Blocked").Find(&blocks).Error
	if err != nil {
		return nil, err
	}
	return blocks, nil
}

// DeleteBlock 删除拉黑记录
func (r *Repository) DeleteBlock(id uuid.UUID) error {
	return r.db.Delete(&Blocklist{}, id).Error
}

// CheckIsBlocked 检查是否被拉黑
func (r *Repository) CheckIsBlocked(userID, targetID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&Blocklist{}).Where(
		"(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
		userID, targetID, targetID, userID,
	).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
