package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// ==================== 数据模型 ====================

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email,omitempty"`
	Nickname  string    `json:"nickname"`
	Avatar    string    `json:"avatar,omitempty"`
	Bio       string    `json:"bio,omitempty"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Friend struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	FriendID  string    `json:"friend_id"`
	Alias     string    `json:"alias,omitempty"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Friend    *User     `json:"friend,omitempty"`
}

type Conversation struct {
	ID           string               `json:"id"`
	Type         string               `json:"type"`
	Name         string               `json:"name,omitempty"`
	Avatar       string               `json:"avatar,omitempty"`
	Description  string               `json:"description,omitempty"`
	LastMessage  string               `json:"last_message,omitempty"`
	LastMsgAt    *time.Time           `json:"last_msg_at,omitempty"`
	CreatedBy    string               `json:"created_by"`
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	UnreadCount  int                  `json:"unread_count,omitempty"`
	Members      []ConversationMember `json:"members,omitempty"`
}

type ConversationMember struct {
	ID           string    `json:"id"`
	ConversationID string  `json:"conversation_id"`
	UserID       string    `json:"user_id"`
	Role         string    `json:"role"`
	Nickname     string    `json:"nickname,omitempty"`
	LastReadAt   *time.Time `json:"last_read_at,omitempty"`
	UnreadCount  int       `json:"unread_count"`
	Muted        bool      `json:"muted"`
	JoinedAt     time.Time `json:"joined_at"`
	User         *User     `json:"user,omitempty"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	SenderID       string    `json:"sender_id"`
	Type           string    `json:"type"`
	Content        string    `json:"content"`
	MediaURL       string    `json:"media_url,omitempty"`
	FileName       string    `json:"file_name,omitempty"`
	FileSize       int       `json:"file_size,omitempty"`
	ReplyToID      string    `json:"reply_to_id,omitempty"`
	IsEdited       bool      `json:"is_edited"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Sender         *User     `json:"sender,omitempty"`
	ReplyTo        *Message  `json:"reply_to,omitempty"`
	ReadCount      int       `json:"read_count,omitempty"`
	TotalCount     int       `json:"total_count,omitempty"`
}

type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Avatar      string    `json:"avatar,omitempty"`
	OwnerID     string    `json:"owner_id"`
	MaxMembers  int       `json:"max_members"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	MemberCount int       `json:"member_count,omitempty"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// ==================== 内存存储 ====================

var (
	users        = make(map[string]*User)
	friends      = make(map[string]*Friend)
	conversations = make(map[string]*Conversation)
	messages     = make(map[string][]*Message)
	groups       = make(map[string]*Group)
	mu           sync.RWMutex
	currentUser  *User
)

// ==================== 初始化模拟数据 ====================

func initMockData() {
	now := time.Now()

	// 创建用户
	currentUser = &User{
		ID:        "user-1",
		Username:  "demo",
		Nickname:  "演示用户",
		Avatar:    "",
		Bio:       "这是一个演示账号",
		Status:    "online",
		CreatedAt: now.AddDate(0, -1, 0),
		UpdatedAt: now,
	}
	users[currentUser.ID] = currentUser

	// 创建好友
	friendUsers := []*User{
		{
			ID:        "user-2",
			Username:  "alice",
			Nickname:  "艾丽斯",
			Avatar:    "",
			Bio:       "喜欢聊天",
			Status:    "online",
			CreatedAt: now.AddDate(0, -2, 0),
			UpdatedAt: now,
		},
		{
			ID:        "user-3",
			Username:  "bob",
			Nickname:  "鲍勃",
			Avatar:    "",
			Bio:       "技术爱好者",
			Status:    "offline",
			CreatedAt: now.AddDate(0, -3, 0),
			UpdatedAt: now,
		},
		{
			ID:        "user-4",
			Username:  "charlie",
			Nickname:  "查理",
			Avatar:    "",
			Bio:       "喜欢旅行",
			Status:    "away",
			CreatedAt: now.AddDate(0, -4, 0),
			UpdatedAt: now,
		},
	}

	for _, u := range friendUsers {
		users[u.ID] = u

		// 创建好友关系
		friends["friend-"+u.ID] = &Friend{
			ID:        "friend-"+u.ID,
			UserID:    currentUser.ID,
			FriendID:  u.ID,
			Status:    "accepted",
			CreatedAt: now.AddDate(0, 0, -15),
			UpdatedAt: now,
			Friend:    u,
		}
	}

	// 创建单聊会话
	for i, u := range friendUsers {
		convID := "conv-single-" + u.ID
		lastMsgTime := now.AddDate(0, 0, -i)

		conv := &Conversation{
			ID:           convID,
			Type:         "single",
			Name:         u.Nickname,
			LastMessage:  "你好！",
			LastMsgAt:    &lastMsgTime,
			CreatedBy:    currentUser.ID,
			CreatedAt:    now.AddDate(0, 0, -30),
			UpdatedAt:    now,
			UnreadCount:  i,
		}
		conversations[convID] = conv

		// 创建消息
		msgList := []*Message{
			{
				ID:             "msg-1-" + u.ID,
				ConversationID: convID,
				SenderID:       u.ID,
				Type:           "text",
				Content:        "你好！",
				CreatedAt:      lastMsgTime,
				UpdatedAt:      lastMsgTime,
				Sender:         u,
			},
			{
				ID:             "msg-2-" + u.ID,
				ConversationID: convID,
				SenderID:       currentUser.ID,
				Type:           "text",
				Content:        "你好，很高兴认识你！",
				CreatedAt:      lastMsgTime.Add(1 * time.Minute),
				UpdatedAt:      lastMsgTime.Add(1 * time.Minute),
				Sender:         currentUser,
			},
		}
		messages[convID] = msgList
	}

	// 创建群聊
	groupID := "group-1"
	group := &Group{
		ID:          groupID,
		Name:        "开发讨论组",
		Description: "这是一个用于讨论开发的群聊",
		Avatar:      "",
		OwnerID:     currentUser.ID,
		MaxMembers:  100,
		CreatedAt:   now.AddDate(0, 0, -20),
		UpdatedAt:   now,
		MemberCount: 4,
	}
	groups[groupID] = group

	// 群聊会话
	convGroupID := "conv-group-" + groupID
	groupLastMsg := now.AddDate(0, 0, -1)
	groupConv := &Conversation{
		ID:           convGroupID,
		Type:         "group",
		Name:         group.Name,
		Description:  group.Description,
		LastMessage:  "大家好！",
		LastMsgAt:    &groupLastMsg,
		CreatedBy:    currentUser.ID,
		CreatedAt:    group.CreatedAt,
		UpdatedAt:    now,
		UnreadCount:  3,
	}
	conversations[convGroupID] = groupConv

	// 群消息
	groupMsgs := []*Message{
		{
			ID:             "gmsg-1",
			ConversationID: convGroupID,
			SenderID:       friendUsers[0].ID,
			Type:           "text",
			Content:        "大家好！",
			CreatedAt:      groupLastMsg,
			UpdatedAt:      groupLastMsg,
			Sender:         friendUsers[0],
		},
		{
			ID:             "gmsg-2",
			ConversationID: convGroupID,
			SenderID:       friendUsers[1].ID,
			Type:           "text",
			Content:        "你好！",
			CreatedAt:      groupLastMsg.Add(5 * time.Minute),
			UpdatedAt:      groupLastMsg.Add(5 * time.Minute),
			Sender:         friendUsers[1],
		},
	}
	messages[convGroupID] = groupMsgs
}

// ==================== 辅助函数 ====================

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// ==================== 处理函数 ====================

// 登录
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, ApiResponse{
			Success: false,
			Message: "方法不允许",
		})
		return
	}

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"access_token":  "demo-token-12345",
			"refresh_token": "demo-refresh-12345",
			"user":          currentUser,
		},
	})
}

// 获取用户信息
func getProfileHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    currentUser,
	})
}

// 获取会话列表
func getConversationsHandler(w http.ResponseWriter, r *http.Request) {
	mu.RLock()
	defer mu.RUnlock()

	convList := make([]*Conversation, 0, len(conversations))
	for _, conv := range conversations {
		convList = append(convList, conv)
	}

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    convList,
	})
}

// 获取会话消息
func getMessagesHandler(w http.ResponseWriter, r *http.Request) {
	convID := r.PathValue("id")
	if convID == "" {
		writeJSON(w, http.StatusBadRequest, ApiResponse{
			Success: false,
			Message: "会话ID不能为空",
		})
		return
	}

	mu.RLock()
	msgs, ok := messages[convID]
	mu.RUnlock()

	if !ok {
		msgs = []*Message{}
	}

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    msgs,
	})
}

// 获取好友列表
func getFriendsHandler(w http.ResponseWriter, r *http.Request) {
	mu.RLock()
	defer mu.RUnlock()

	friendList := make([]*Friend, 0, len(friends))
	for _, f := range friends {
		friendList = append(friendList, f)
	}

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    friendList,
	})
}

// 搜索用户
func searchUsersHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("keyword")
	if query == "" {
		query = r.URL.Query().Get("q")
	}

	mu.RLock()
	defer mu.RUnlock()

	results := make([]*User, 0)
	for _, u := range users {
		if query == "" ||
			contains(u.Username, query) ||
			contains(u.Nickname, query) {
			results = append(results, u)
		}
	}

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"items":    results,
			"total":    len(results),
			"has_more": false,
		},
	})
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(len(substr) == 0 || indexOf(s, substr) >= 0)
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if s[i+j] != substr[j] {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}
	return -1
}

// 创建群组
func createGroupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, ApiResponse{
			Success: false,
			Message: "方法不允许",
		})
		return
	}

	var req struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		MemberIDs   []string `json:"member_ids"`
		Avatar      string   `json:"avatar"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ApiResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	now := time.Now()
	groupID := "group-" + strconv.FormatInt(now.Unix(), 10)
	group := &Group{
		ID:          groupID,
		Name:        req.Name,
		Description: req.Description,
		Avatar:      req.Avatar,
		OwnerID:     currentUser.ID,
		MaxMembers:  100,
		CreatedAt:   now,
		UpdatedAt:   now,
		MemberCount: 1 + len(req.MemberIDs),
	}

	mu.Lock()
	groups[groupID] = group
	mu.Unlock()

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    group,
	})
}

// 发送消息
func sendMessageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, ApiResponse{
			Success: false,
			Message: "方法不允许",
		})
		return
	}

	var req struct {
		ConversationID string `json:"conversation_id"`
		Type           string `json:"type"`
		Content        string `json:"content"`
		MediaURL       string `json:"media_url,omitempty"`
		FileName       string `json:"file_name,omitempty"`
		FileSize       int    `json:"file_size,omitempty"`
		ReplyToID      string `json:"reply_to_id,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ApiResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	now := time.Now()
	msgID := "msg-" + strconv.FormatInt(now.UnixNano(), 10)
	msg := &Message{
		ID:             msgID,
		ConversationID: req.ConversationID,
		SenderID:       currentUser.ID,
		Type:           req.Type,
		Content:        req.Content,
		MediaURL:       req.MediaURL,
		FileName:       req.FileName,
		FileSize:       req.FileSize,
		ReplyToID:      req.ReplyToID,
		IsEdited:       false,
		CreatedAt:      now,
		UpdatedAt:      now,
		Sender:         currentUser,
	}

	mu.Lock()
	messages[req.ConversationID] = append(messages[req.ConversationID], msg)
	if conv, ok := conversations[req.ConversationID]; ok {
		conv.LastMessage = req.Content
		conv.LastMsgAt = &now
		conv.UpdatedAt = now
	}
	mu.Unlock()

	writeJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    msg,
	})
}

func main() {
	initMockData()

	mux := http.NewServeMux()

	// 注册路由函数（支持带前缀和不带前缀）
	registerRoutes := func(prefix string) {
		// Auth
		mux.HandleFunc(prefix+"/auth/login", loginHandler)

		// User
		mux.HandleFunc(prefix+"/user/profile", getProfileHandler)
		mux.HandleFunc(prefix+"/user/search", searchUsersHandler)

		// Chat
		mux.HandleFunc(prefix+"/chat/conversations", getConversationsHandler)
		mux.HandleFunc(prefix+"/chat/conversation/{id}/messages", getMessagesHandler)
		mux.HandleFunc(prefix+"/chat/message", sendMessageHandler)

		// Friend
		mux.HandleFunc(prefix+"/friend/list", getFriendsHandler)

		// Group
		mux.HandleFunc(prefix+"/group/", createGroupHandler)
	}

	// 注册不带前缀和带 /api/v1 前缀的路由
	registerRoutes("")
	registerRoutes("/api/v1")

	// Health
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status": "ok",
		})
	})

	// Default handler - catch all
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Request: %s %s\n", r.Method, r.URL.Path)
		writeJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Data:    map[string]interface{}{},
		})
	})

	fmt.Println("演示服务器启动在 http://localhost:8080")
	fmt.Println("使用任意账号密码即可登录")
	fmt.Println("\n可用的 API:")
	fmt.Println("  POST /auth/login - 登录")
	fmt.Println("  GET /user/profile - 获取当前用户信息")
	fmt.Println("  GET /chat/conversations - 获取会话列表")
	fmt.Println("  GET /chat/conversation/{id}/messages - 获取会话消息")
	fmt.Println("  POST /chat/message - 发送消息")
	fmt.Println("  GET /friend/list - 获取好友列表")
	fmt.Println("  POST /group/ - 创建群组")
	fmt.Println("  GET /user/search - 搜索用户")

	if err := http.ListenAndServe(":8080", mux); err != nil {
		fmt.Printf("服务器启动失败: %v\n", err)
	}
}
