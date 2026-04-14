package e2e

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/test"
	"github.com/neochat/backend/pkg/utils"
)

// TestUser 测试用户
type TestUser struct {
	ID       uuid.UUID
	Username string
	Email    string
	Password string
	Token    string
}

func createTestUser(t *testing.T, username, email, password string) *TestUser {
	t.Helper()

	// 通过 API 注册用户
	reqBody := test.RegisterRequest{
		Username: username,
		Email:    email,
		Password: password,
	}

	w := test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/auth/register", reqBody)
	test.AssertStatus(t, w, 200)

	var response map[string]interface{}
	test.ParseResponse(t, w, &response)
	assert.True(t, response["success"].(bool))

	// 登录获取 token
	loginReq := map[string]interface{}{
		"identifier": email,
		"password":   password,
	}

	w = test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/auth/login", loginReq)
	test.AssertStatus(t, w, 200)

	test.ParseResponse(t, w, &response)
	data := response["data"].(map[string]interface{})
	token := data["access_token"].(string)
	userData := data["user"].(map[string]interface{})
	userID, _ := uuid.Parse(userData["id"].(string))

	return &TestUser{
		ID:       userID,
		Username: username,
		Email:    email,
		Password: password,
		Token:    token,
	}
}

func TestCompleteUserFlowE2E(t *testing.T) {
	SkipE2ETests(t)

	t.Run("完整用户流程: 注册->登录->搜索用户->发送好友请求->接受好友请求", func(t *testing.T) {
		// 1. 用户 A 注册和登录
		userA := createTestUser(t, "usera", "usera@example.com", "Password123!")

		// 2. 用户 B 注册和登录
		userB := createTestUser(t, "userb", "userb@example.com", "Password123!")

		// 3. 用户 A 搜索用户 B
		w := test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/user/search?query=userb", nil, userA.Token)
		test.AssertStatus(t, w, 200)

		var searchResponse map[string]interface{}
		test.ParseResponse(t, w, &searchResponse)
		assert.True(t, searchResponse["success"].(bool))

		// 4. 用户 A 发送好友请求给用户 B
		friendReq := map[string]interface{}{
			"user_id": userB.ID.String(),
		}
		w = test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/user/friend/request", friendReq, userA.Token)
		test.AssertStatus(t, w, 200)

		// 5. 用户 B 查看好友请求
		w = test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/user/friend-requests", nil, userB.Token)
		test.AssertStatus(t, w, 200)

		var requestsResponse map[string]interface{}
		test.ParseResponse(t, w, &requestsResponse)
		assert.True(t, requestsResponse["success"].(bool))

		requestsData := requestsResponse["data"].([]interface{})
		assert.Len(t, requestsData, 1)

		request := requestsData[0].(map[string]interface{})
		requestID := request["id"].(string)

		// 6. 用户 B 接受好友请求
		w = test.MakeRequest(t, globalTestContext.Router, "PUT", "/api/v1/user/friend-request/"+requestID+"/accept", nil, userB.Token)
		test.AssertStatus(t, w, 200)

		// 7. 验证双方都在好友列表中
		w = test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/user/friends", nil, userA.Token)
		test.AssertStatus(t, w, 200)

		var friendsResponse map[string]interface{}
		test.ParseResponse(t, w, &friendsResponse)
		assert.True(t, friendsResponse["success"].(bool))

		friendsData := friendsResponse["data"].([]interface{})
		assert.Len(t, friendsData, 1)
	})
}

func TestCompleteChatFlowE2E(t *testing.T) {
	SkipE2ETests(t)

	t.Run("完整聊天流程: 创建会话->发送消息->获取消息->收藏消息", func(t *testing.T) {
		// 1. 创建两个用户并成为好友
		user1 := createTestUser(t, "chatuser1", "chatuser1@example.com", "Password123!")
		user2 := createTestUser(t, "chatuser2", "chatuser2@example.com", "Password123!")

		// 发送并接受好友请求
		friendReq := map[string]interface{}{
			"user_id": user2.ID.String(),
		}
		test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/user/friend/request", friendReq, user1.Token)

		// 用户2 查看并接受请求
		w := test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/user/friend-requests", nil, user2.Token)
		var requestsResponse map[string]interface{}
		test.ParseResponse(t, w, &requestsResponse)
		requestsData := requestsResponse["data"].([]interface{})
		requestID := requestsData[0].(map[string]interface{})["id"].(string)
		test.MakeRequest(t, globalTestContext.Router, "PUT", "/api/v1/user/friend-request/"+requestID+"/accept", nil, user2.Token)

		// 2. 用户1 创建单聊会话
		convReq := map[string]interface{}{
			"user_id": user2.ID.String(),
		}
		w = test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/chat/conversation/single", convReq, user1.Token)
		test.AssertStatus(t, w, 200)

		var convResponse map[string]interface{}
		test.ParseResponse(t, w, &convResponse)
		assert.True(t, convResponse["success"].(bool))

		convData := convResponse["data"].(map[string]interface{})
		conversationID := convData["id"].(string)

		// 3. 用户1 发送消息
		msgReq := map[string]interface{}{
			"conversation_id": conversationID,
			"content":         "Hello, this is a test message!",
			"message_type":    "text",
		}
		w = test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/chat/message", msgReq, user1.Token)
		test.AssertStatus(t, w, 200)

		var msgResponse map[string]interface{}
		test.ParseResponse(t, w, &msgResponse)
		assert.True(t, msgResponse["success"].(bool))

		msgData := msgResponse["data"].(map[string]interface{})
		messageID := msgData["id"].(string)

		// 4. 用户2 获取消息列表
		w = test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/chat/conversation/"+conversationID+"/messages", nil, user2.Token)
		test.AssertStatus(t, w, 200)

		var messagesResponse map[string]interface{}
		test.ParseResponse(t, w, &messagesResponse)
		assert.True(t, messagesResponse["success"].(bool))

		messagesData := messagesResponse["data"].([]interface{})
		assert.Len(t, messagesData, 1)

		// 5. 用户2 收藏消息
		favReq := map[string]interface{}{
			"message_id": messageID,
		}
		w = test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/chat/favorite", favReq, user2.Token)
		test.AssertStatus(t, w, 200)

		// 6. 用户2 查看收藏列表
		w = test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/chat/favorites", nil, user2.Token)
		test.AssertStatus(t, w, 200)

		var favsResponse map[string]interface{}
		test.ParseResponse(t, w, &favsResponse)
		assert.True(t, favsResponse["success"].(bool))

		favsData := favsResponse["data"].([]interface{})
		assert.Len(t, favsData, 1)
	})
}

func TestGroupChatE2E(t *testing.T) {
	SkipE2ETests(t)

	t.Run("群聊流程: 创建群聊->多个用户发送消息", func(t *testing.T) {
		// 创建三个用户
		admin := createTestUser(t, "groupadmin", "groupadmin@example.com", "Password123!")
		member1 := createTestUser(t, "groupmember1", "groupmember1@example.com", "Password123!")
		member2 := createTestUser(t, "groupmember2", "groupmember2@example.com", "Password123!")

		// 先互相加好友
		addFriend := func(from, to *TestUser) {
			friendReq := map[string]interface{}{"user_id": to.ID.String()}
			test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/user/friend/request", friendReq, from.Token)

			w := test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/user/friend-requests", nil, to.Token)
			var resp map[string]interface{}
			test.ParseResponse(t, w, &resp)
			data := resp["data"].([]interface{})
			if len(data) > 0 {
				reqID := data[0].(map[string]interface{})["id"].(string)
				test.MakeRequest(t, globalTestContext.Router, "PUT", "/api/v1/user/friend-request/"+reqID+"/accept", nil, to.Token)
			}
		}

		addFriend(admin, member1)
		addFriend(admin, member2)

		// 管理员创建群聊
		groupReq := map[string]interface{}{
			"name":     "Test Group",
			"member_ids": []string{member1.ID.String(), member2.ID.String()},
		}
		w := test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/chat/conversation/group", groupReq, admin.Token)
		test.AssertStatus(t, w, 200)

		var convResponse map[string]interface{}
		test.ParseResponse(t, w, &convResponse)
		convData := convResponse["data"].(map[string]interface{})
		conversationID := convData["id"].(string)

		// 三个用户各自发送消息
		sendMessage := func(user *TestUser, content string) {
			msgReq := map[string]interface{}{
				"conversation_id": conversationID,
				"content":         content,
				"message_type":    "text",
			}
			w := test.MakeRequest(t, globalTestContext.Router, "POST", "/api/v1/chat/message", msgReq, user.Token)
			test.AssertStatus(t, w, 200)
		}

		sendMessage(admin, "Hello everyone!")
		sendMessage(member1, "Hi admin!")
		sendMessage(member2, "Nice to meet you all!")

		// 验证消息列表
		w = test.MakeRequest(t, globalTestContext.Router, "GET", "/api/v1/chat/conversation/"+conversationID+"/messages", nil, member1.Token)
		test.AssertStatus(t, w, 200)

		var messagesResponse map[string]interface{}
		test.ParseResponse(t, w, &messagesResponse)
		messagesData := messagesResponse["data"].([]interface{})
		assert.Len(t, messagesData, 3)
	})
}
