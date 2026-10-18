package chat

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/neochat/backend/pkg/broadcast"
	"github.com/neochat/backend/pkg/config"
)

// newTestHubWithLocalBroadcast 构造一个只挂了本地广播器的 Hub（不需要数据库）。
func newTestHubWithLocalBroadcast(t *testing.T) (*WebSocketHub, <-chan broadcast.Envelope) {
	t.Helper()

	local := broadcast.New(nil, "instance-test")
	received := make(chan broadcast.Envelope, 8)
	if err := local.Subscribe(context.Background(), func(env broadcast.Envelope) {
		received <- env
	}); err != nil {
		t.Fatalf("订阅本地广播失败: %v", err)
	}

	hub := &WebSocketHub{
		clients:   make(map[uuid.UUID]*Client),
		userConns: make(map[uuid.UUID]map[uuid.UUID]bool),
		cfg:       &config.Config{},
	}
	hub.SetBroadcaster(local)
	return hub, received
}

// TestPublishMessageEncodesEnvelope 定向广播应带上 UserIDs 并保留原始消息。
func TestPublishMessageEncodesEnvelope(t *testing.T) {
	hub, received := newTestHubWithLocalBroadcast(t)

	userID := uuid.New()
	convID := uuid.New()
	hub.publishMessage(WSMessage{
		Type:   WSMessageTypeNewMessage,
		ConvID: convID,
		Data:   map[string]interface{}{"content": "hello"},
	}, userID.String())

	select {
	case env := <-received:
		if len(env.UserIDs) != 1 || env.UserIDs[0] != userID.String() {
			t.Fatalf("UserIDs 不符合预期: %v", env.UserIDs)
		}
		var msg WSMessage
		if err := json.Unmarshal(env.Payload, &msg); err != nil {
			t.Fatalf("payload 解析失败: %v", err)
		}
		if msg.Type != WSMessageTypeNewMessage || msg.ConvID != convID {
			t.Fatalf("消息内容不符合预期: %+v", msg)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("未发布广播")
	}
}

// TestPublishMessageSkipsTransient ping/pong/error 属于连接层消息，不跨实例同步。
func TestPublishMessageSkipsTransient(t *testing.T) {
	hub, received := newTestHubWithLocalBroadcast(t)

	hub.publishMessage(WSMessage{Type: WSMessageTypePing})
	hub.publishMessage(WSMessage{Type: WSMessageTypePong})

	select {
	case env := <-received:
		t.Fatalf("瞬时消息不应被广播: %s", env.Payload)
	case <-time.After(200 * time.Millisecond):
	}
}

// TestDeliverRemoteIgnoresInvalidPayload 坏数据只记录日志，不应 panic。
func TestDeliverRemoteIgnoresInvalidPayload(t *testing.T) {
	hub := &WebSocketHub{
		clients:   make(map[uuid.UUID]*Client),
		userConns: make(map[uuid.UUID]map[uuid.UUID]bool),
		remote:    make(chan WSMessage, 1),
		cfg:       &config.Config{},
	}

	hub.DeliverRemote(broadcast.Envelope{Payload: json.RawMessage(`not-json`)})

	select {
	case msg := <-hub.remote:
		t.Fatalf("非法 payload 不应被投递: %+v", msg)
	default:
	}
}
