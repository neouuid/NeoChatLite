package chat

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/logger"
)

// WebSocket message types
const (
	WSMessageTypeNewMessage      = "new_message"
	WSMessageTypeMessageRead     = "message_read"
	WSMessageTypeMessageEdited   = "message_edited"
	WSMessageTypeMessageDeleted  = "message_deleted"
	WSMessageTypeTyping          = "typing"
	WSMessageTypeStopTyping      = "stop_typing"
	WSMessageTypeOnlineStatus    = "online_status"
	WSMessageTypeError           = "error"
	WSMessageTypePing            = "ping"
	WSMessageTypePong            = "pong"
	// WebRTC 信令消息类型
	WSMessageTypeSignalOffer     = "signal_offer"
	WSMessageTypeSignalAnswer    = "signal_answer"
	WSMessageTypeSignalIce       = "signal_ice"
	WSMessageTypeCallInvite      = "call_invite"
	WSMessageTypeCallAccept      = "call_accept"
	WSMessageTypeCallReject      = "call_reject"
	WSMessageTypeCallHangup      = "call_hangup"
	WSMessageTypeCallEnded       = "call_ended"
	// 好友请求消息类型
	WSMessageTypeFriendRequest   = "friend_request"
	WSMessageTypeFriendAccepted  = "friend_accepted"
	// 提及消息类型
	WSMessageTypeMention         = "mention"
)

// WSMessage WebSocket消息结构
type WSMessage struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data"`
	FromID  uuid.UUID   `json:"from_id"`
	ConvID  uuid.UUID   `json:"conv_id,omitempty"`
}

// Client WebSocket客户端
type Client struct {
	ID     uuid.UUID
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan WSMessage
	Hub    *WebSocketHub
}

// WebSocketHub WebSocket集线器
type WebSocketHub struct {
	clients    map[uuid.UUID]*Client
	userConns  map[uuid.UUID]map[uuid.UUID]bool // userID -> clientID -> bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan WSMessage
	mu         sync.RWMutex
	service    *Service
	upgrader   websocket.Upgrader
	cfg        *config.Config
}

func NewWebSocketHub(service *Service, cfg *config.Config) *WebSocketHub {
	hub := &WebSocketHub{
		clients:    make(map[uuid.UUID]*Client),
		userConns:  make(map[uuid.UUID]map[uuid.UUID]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan WSMessage, 256),
		service:    service,
		cfg:        cfg,
	}

	hub.upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     hub.checkOrigin,
	}

	return hub
}

// checkOrigin 检查 WebSocket Origin
func (h *WebSocketHub) checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")

	// 如果没有 Origin 头，允许（可能是非浏览器客户端）
	if origin == "" {
		return true
	}

	// 如果允许所有来源
	allowOrigins := h.cfg.Server.CORS.AllowOrigins
	for _, o := range allowOrigins {
		if o == "*" {
			return true
		}
		if o == origin {
			return true
		}
	}

	// 开发环境：允许 localhost 相关的 Origin
	if isLocalhostOrigin(origin) {
		return true
	}

	logger.Warnf("WebSocket Origin check failed: %s", origin)
	return false
}

// isLocalhostOrigin 检查是否是 localhost Origin
func isLocalhostOrigin(origin string) bool {
	if len(origin) >= 16 && origin[:16] == "http://localhost:" {
		return true
	}
	if len(origin) >= 17 && origin[:17] == "https://localhost:" {
		return true
	}
	if len(origin) >= 14 && origin[:14] == "http://127.0.0.1" {
		return true
	}
	if len(origin) >= 15 && origin[:15] == "https://127.0.0.1" {
		return true
	}
	return false
}

func (h *WebSocketHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			if _, ok := h.userConns[client.UserID]; !ok {
				h.userConns[client.UserID] = make(map[uuid.UUID]bool)
			}
			h.userConns[client.UserID][client.ID] = true
			h.mu.Unlock()
			logger.Infof("Client connected: user=%s, client=%s", client.UserID, client.ID)

			// 广播在线状态
			h.BroadcastOnlineStatus(client.UserID, true)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				if userClients, ok := h.userConns[client.UserID]; ok {
					delete(userClients, client.ID)
					if len(userClients) == 0 {
						delete(h.userConns, client.UserID)
						// 用户完全离线，广播离线状态
						h.BroadcastOnlineStatus(client.UserID, false)
					}
				}
				close(client.Send)
			}
			h.mu.Unlock()
			logger.Infof("Client disconnected: user=%s, client=%s", client.UserID, client.ID)

		case message := <-h.broadcast:
			h.handleBroadcast(message)
		}
	}
}

func (h *WebSocketHub) handleBroadcast(message WSMessage) {
	switch message.Type {
	case WSMessageTypeNewMessage:
		// 发送给会话中的所有成员
		h.broadcastToConversation(message)
	case WSMessageTypeOnlineStatus:
		// 发送给所有在线用户（或者只发送给好友）
		h.broadcastToAll(message)
	default:
		h.broadcastToAll(message)
	}
}

func (h *WebSocketHub) broadcastToConversation(message WSMessage) {
	if message.ConvID == uuid.Nil {
		h.broadcastToAll(message)
		return
	}

	// 获取会话成员
	members, err := h.service.repo.GetConversationMembers(message.ConvID)
	if err != nil {
		logger.Errorf("Failed to get conversation members: %v", err)
		h.broadcastToAll(message)
		return
	}

	// 只发送给会话成员
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, member := range members {
		if clientIDs, ok := h.userConns[member.UserID]; ok {
			for clientID := range clientIDs {
				if client, ok := h.clients[clientID]; ok {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients, client.ID)
					}
				}
			}
		}
	}
}

func (h *WebSocketHub) broadcastToAll(message WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.clients, client.ID)
		}
	}
}

// SendToUser 发送消息给指定用户的所有连接
func (h *WebSocketHub) SendToUser(userID uuid.UUID, message WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clientIDs, ok := h.userConns[userID]; ok {
		for clientID := range clientIDs {
			if client, ok := h.clients[clientID]; ok {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client.ID)
				}
			}
		}
	}
}

// BroadcastOnlineStatus 广播用户在线状态
func (h *WebSocketHub) BroadcastOnlineStatus(userID uuid.UUID, online bool) {
	h.broadcast <- WSMessage{
		Type:   WSMessageTypeOnlineStatus,
		FromID: userID,
		Data: map[string]interface{}{
			"user_id": userID,
			"online":  online,
		},
	}
}

// IsUserOnline 检查用户是否在线
func (h *WebSocketHub) IsUserOnline(userID uuid.UUID) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.userConns[userID]
	return ok
}

// SendFriendRequest 发送好友请求通知
func (h *WebSocketHub) SendFriendRequest(toUserID uuid.UUID, fromUserID uuid.UUID, fromUserName string, fromUserAvatar string) {
	h.SendToUser(toUserID, WSMessage{
		Type:   WSMessageTypeFriendRequest,
		FromID: fromUserID,
		Data: map[string]interface{}{
			"user_id":   fromUserID,
			"username":  fromUserName,
			"avatar":    fromUserAvatar,
		},
	})
}

// SendFriendAccepted 发送好友已接受通知
func (h *WebSocketHub) SendFriendAccepted(toUserID uuid.UUID, fromUserID uuid.UUID, fromUserName string, fromUserAvatar string) {
	h.SendToUser(toUserID, WSMessage{
		Type:   WSMessageTypeFriendAccepted,
		FromID: fromUserID,
		Data: map[string]interface{}{
			"user_id":   fromUserID,
			"username":  fromUserName,
			"avatar":    fromUserAvatar,
		},
	})
}

// SendMention 发送提及通知
func (h *WebSocketHub) SendMention(toUserID uuid.UUID, messageID uuid.UUID, conversationID uuid.UUID, fromUserID uuid.UUID, fromUserName string, fromUserAvatar string, messageContent string) {
	h.SendToUser(toUserID, WSMessage{
		Type:   WSMessageTypeMention,
		FromID: fromUserID,
		ConvID: conversationID,
		Data: map[string]interface{}{
			"message_id":   messageID,
			"user_id":      fromUserID,
			"username":     fromUserName,
			"avatar":       fromUserAvatar,
			"content":      messageContent,
		},
	})
}

// Client Read Pump
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Errorf("WebSocket read error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			c.SendError("invalid message format")
			continue
		}

		wsMsg.FromID = c.UserID
		c.handleMessage(wsMsg)
	}
}

// Client Write Pump
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			if err := json.NewEncoder(w).Encode(message); err != nil {
				return
			}

			if err := w.Close(); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg WSMessage) {
	switch msg.Type {
	case WSMessageTypePing:
		c.Send <- WSMessage{
			Type:   WSMessageTypePong,
			FromID: c.UserID,
		}
	case WSMessageTypeTyping, WSMessageTypeStopTyping:
		// 转发给会话中的其他用户
		c.Hub.broadcast <- msg
	// WebRTC 信令消息处理
	case WSMessageTypeSignalOffer, WSMessageTypeSignalAnswer, WSMessageTypeSignalIce:
		c.handleSignalMessage(msg)
	case WSMessageTypeCallInvite:
		c.handleCallInvite(msg)
	case WSMessageTypeCallAccept:
		c.handleCallAccept(msg)
	case WSMessageTypeCallReject:
		c.handleCallReject(msg)
	case WSMessageTypeCallHangup:
		c.handleCallHangup(msg)
	default:
		c.SendError("unknown message type")
	}
}

// handleSignalMessage 处理 WebRTC 信令消息（转发）
func (c *Client) handleSignalMessage(msg WSMessage) {
	// 从 Data 中获取目标用户 ID
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if toUserIDStr, ok := data["to_user_id"].(string); ok {
			toUserID, err := uuid.Parse(toUserIDStr)
			if err == nil {
				// 转发信令消息给目标用户
				c.Hub.SendToUser(toUserID, msg)
				return
			}
		}
	}
	c.SendError("invalid signal message format")
}

// handleCallInvite 处理通话邀请
func (c *Client) handleCallInvite(msg WSMessage) {
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if calleeIDStr, ok := data["callee_id"].(string); ok {
			calleeID, err := uuid.Parse(calleeIDStr)
			if err == nil {
				// 检查被呼叫用户是否在线
				if !c.Hub.IsUserOnline(calleeID) {
					c.SendError("user is offline")
					return
				}
				// 转发邀请给被呼叫用户
				c.Hub.SendToUser(calleeID, msg)
				return
			}
		}
	}
	c.SendError("invalid call invite format")
}

// handleCallAccept 处理通话接受
func (c *Client) handleCallAccept(msg WSMessage) {
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if callerIDStr, ok := data["caller_id"].(string); ok {
			callerID, err := uuid.Parse(callerIDStr)
			if err == nil {
				// 转发接受消息给呼叫者
				c.Hub.SendToUser(callerID, msg)
				return
			}
		}
	}
	c.SendError("invalid call accept format")
}

// handleCallReject 处理通话拒绝
func (c *Client) handleCallReject(msg WSMessage) {
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if callerIDStr, ok := data["caller_id"].(string); ok {
			callerID, err := uuid.Parse(callerIDStr)
			if err == nil {
				// 转发拒绝消息给呼叫者
				c.Hub.SendToUser(callerID, msg)
				return
			}
		}
	}
	c.SendError("invalid call reject format")
}

// handleCallHangup 处理通话挂断
func (c *Client) handleCallHangup(msg WSMessage) {
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if peerIDStr, ok := data["peer_id"].(string); ok {
			peerID, err := uuid.Parse(peerIDStr)
			if err == nil {
				// 转发挂断消息给对方
				c.Hub.SendToUser(peerID, msg)
				return
			}
		}
	}
	c.SendError("invalid call hangup format")
}

func (c *Client) SendError(errMsg string) {
	c.Send <- WSMessage{
		Type:   WSMessageTypeError,
		FromID: c.UserID,
		Data: map[string]string{
			"error": errMsg,
		},
	}
}

// WebSocketHandler WebSocket连接处理器
func (h *WebSocketHub) WebSocketHandler(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Errorf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:     uuid.New(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan WSMessage, 256),
		Hub:    h,
	}

	h.register <- client

	go client.WritePump()
	client.ReadPump()
}
