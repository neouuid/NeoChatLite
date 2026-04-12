package user

import (
	"errors"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ==================== User Service Methods ====================

// GetUserProfile 获取用户资料
func (s *Service) GetUserProfile(id uuid.UUID) (*User, error) {
	u, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	// 清除密码
	u.Password = ""
	return u, nil
}

// SearchUsers 搜索用户
func (s *Service) SearchUsers(keyword string, page, pageSize int) ([]*User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.repo.SearchUsers(keyword, pageSize, offset)
}

// UpdateProfile 更新用户资料
func (s *Service) UpdateProfile(userID uuid.UUID, nickname, bio, avatar string) (*User, error) {
	u, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	if nickname != "" {
		u.Nickname = nickname
	}
	if bio != "" {
		u.Bio = bio
	}
	if avatar != "" {
		u.Avatar = avatar
	}

	if err := s.repo.UpdateUser(u); err != nil {
		return nil, err
	}

	u.Password = ""
	return u, nil
}

// ==================== Friend Service Methods ====================

// SendFriendRequest 发送好友请求
func (s *Service) SendFriendRequest(userID, friendID uuid.UUID) (*Friend, error) {
	if userID == friendID {
		return nil, errors.New("cannot add yourself as friend")
	}

	// 检查是否已经是好友或有待处理的请求
	status, err := s.repo.CheckFriendStatus(userID, friendID)
	if err != nil {
		return nil, err
	}

	if status != "none" {
		return nil, errors.New("friend request already exists or already friends")
	}

	// 检查是否被拉黑
	isBlocked, err := s.repo.CheckIsBlocked(userID, friendID)
	if err != nil {
		return nil, err
	}
	if isBlocked {
		return nil, errors.New("cannot send request to blocked user")
	}

	friend := &Friend{
		ID:       uuid.New(),
		UserID:   userID,
		FriendID: friendID,
		Status:   FriendStatusPending,
	}

	if err := s.repo.CreateFriendRequest(friend); err != nil {
		return nil, err
	}

	return friend, nil
}

// AcceptFriendRequest 接受好友请求
func (s *Service) AcceptFriendRequest(userID, requestID uuid.UUID) (*Friend, error) {
	request, err := s.repo.GetFriendRequest(requestID)
	if err != nil {
		return nil, errors.New("friend request not found")
	}

	if request.FriendID != userID {
		return nil, errors.New("unauthorized")
	}

	if request.Status != FriendStatusPending {
		return nil, errors.New("request is not pending")
	}

	request.Status = FriendStatusAccepted
	if err := s.repo.UpdateFriend(request); err != nil {
		return nil, err
	}

	return request, nil
}

// RejectFriendRequest 拒绝好友请求
func (s *Service) RejectFriendRequest(userID, requestID uuid.UUID) error {
	request, err := s.repo.GetFriendRequest(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if request.FriendID != userID {
		return errors.New("unauthorized")
	}

	if request.Status != FriendStatusPending {
		return errors.New("request is not pending")
	}

	return s.repo.DeleteFriend(requestID)
}

// CancelFriendRequest 取消好友请求
func (s *Service) CancelFriendRequest(userID, requestID uuid.UUID) error {
	request, err := s.repo.GetFriendRequest(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if request.UserID != userID {
		return errors.New("unauthorized")
	}

	if request.Status != FriendStatusPending {
		return errors.New("request is not pending")
	}

	return s.repo.DeleteFriend(requestID)
}

// GetFriendRequests 获取好友请求列表
func (s *Service) GetFriendRequests(userID uuid.UUID) ([]*Friend, []*Friend, error) {
	pending, err := s.repo.GetPendingFriendRequests(userID)
	if err != nil {
		return nil, nil, err
	}

	sent, err := s.repo.GetSentFriendRequests(userID)
	if err != nil {
		return nil, nil, err
	}

	return pending, sent, nil
}

// GetFriends 获取好友列表
func (s *Service) GetFriends(userID uuid.UUID) ([]*User, error) {
	friends, err := s.repo.GetFriends(userID)
	if err != nil {
		return nil, err
	}

	// 提取好友用户信息
	var users []*User
	for _, f := range friends {
		if f.UserID == userID && f.Friend != nil {
			f.Friend.Password = ""
			users = append(users, f.Friend)
		} else if f.FriendID == userID && f.User != nil {
			f.User.Password = ""
			users = append(users, f.User)
		}
	}

	return users, nil
}

// DeleteFriend 删除好友
func (s *Service) DeleteFriend(userID, friendID uuid.UUID) error {
	friend, err := s.repo.GetFriendRequestByUsers(userID, friendID)
	if err != nil {
		return errors.New("friend not found")
	}

	if friend.Status != FriendStatusAccepted {
		return errors.New("not friends")
	}

	return s.repo.DeleteFriend(friend.ID)
}

// UpdateFriendAlias 更新好友备注
func (s *Service) UpdateFriendAlias(userID, friendID uuid.UUID, alias string) (*Friend, error) {
	friend, err := s.repo.GetFriendRequestByUsers(userID, friendID)
	if err != nil {
		return nil, errors.New("friend not found")
	}

	if friend.Status != FriendStatusAccepted {
		return nil, errors.New("not friends")
	}

	// 只有发起好友请求的一方可以设置备注（或者两方都可以？这里简化处理）
	friend.Alias = alias
	if err := s.repo.UpdateFriend(friend); err != nil {
		return nil, err
	}

	return friend, nil
}

// ==================== Blocklist Service Methods ====================

// BlockUser 拉黑用户
func (s *Service) BlockUser(userID, blockedID uuid.UUID, reason string) (*Blocklist, error) {
	if userID == blockedID {
		return nil, errors.New("cannot block yourself")
	}

	// 检查是否已经拉黑
	existing, _ := s.repo.GetBlockByUsers(userID, blockedID)
	if existing != nil {
		return nil, errors.New("user already blocked")
	}

	block := &Blocklist{
		ID:        uuid.New(),
		UserID:    userID,
		BlockedID: blockedID,
		Reason:    reason,
	}

	if err := s.repo.CreateBlock(block); err != nil {
		return nil, err
	}

	// 如果是好友，删除好友关系
	friend, _ := s.repo.GetFriendRequestByUsers(userID, blockedID)
	if friend != nil {
		_ = s.repo.DeleteFriend(friend.ID)
	}

	return block, nil
}

// UnblockUser 取消拉黑
func (s *Service) UnblockUser(userID, blockedID uuid.UUID) error {
	block, err := s.repo.GetBlockByUsers(userID, blockedID)
	if err != nil {
		return errors.New("block not found")
	}

	return s.repo.DeleteBlock(block.ID)
}

// GetBlocklist 获取拉黑列表
func (s *Service) GetBlocklist(userID uuid.UUID) ([]*Blocklist, error) {
	blocks, err := s.repo.GetBlocklist(userID)
	if err != nil {
		return nil, err
	}

	// 清除密码
	for _, b := range blocks {
		if b.Blocked != nil {
			b.Blocked.Password = ""
		}
	}

	return blocks, nil
}
