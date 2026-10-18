package broadcast

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// TestRedisBroadcastAcrossInstances 模拟两个实例：A 发布，B 必须收到，A 自己不重复收到。
func TestRedisBroadcastAcrossInstances(t *testing.T) {
	mr := miniredis.RunT(t)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	defer func() { _ = client.Close() }()

	instanceA := New(client, "instance-a")
	instanceB := New(client, "instance-b")
	defer func() { _ = instanceA.Close() }()
	defer func() { _ = instanceB.Close() }()

	receivedByB := make(chan Envelope, 4)
	receivedByA := make(chan Envelope, 4)

	ctx := context.Background()
	if err := instanceA.Subscribe(ctx, func(e Envelope) { receivedByA <- e }); err != nil {
		t.Fatalf("A 订阅失败: %v", err)
	}
	if err := instanceB.Subscribe(ctx, func(e Envelope) { receivedByB <- e }); err != nil {
		t.Fatalf("B 订阅失败: %v", err)
	}

	payload := json.RawMessage(`{"type":"new_message","conv_id":"c1"}`)
	if err := instanceA.Publish(ctx, Envelope{UserIDs: []string{"u1", "u2"}, Payload: payload}); err != nil {
		t.Fatalf("发布失败: %v", err)
	}

	select {
	case env := <-receivedByB:
		if env.Origin != "instance-a" {
			t.Errorf("Origin 期望 instance-a，得到 %q", env.Origin)
		}
		if len(env.UserIDs) != 2 {
			t.Errorf("UserIDs 期望 2 个，得到 %v", env.UserIDs)
		}
		if string(env.Payload) != string(payload) {
			t.Errorf("Payload 不一致: %s", env.Payload)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("B 实例没有收到跨实例广播")
	}

	// A 不应收到自己发出的广播（避免重复投递）
	select {
	case env := <-receivedByA:
		t.Fatalf("发布者收到了自己的广播，会重复投递: %+v", env)
	case <-time.After(300 * time.Millisecond):
	}
}

// TestLocalBroadcasterDeliversSynchronously 未配置 Redis 时应降级为进程内广播。
func TestLocalBroadcasterDeliversSynchronously(t *testing.T) {
	b := New(nil, "local-1")

	var received []Envelope
	if err := b.Subscribe(context.Background(), func(e Envelope) { received = append(received, e) }); err != nil {
		t.Fatalf("订阅失败: %v", err)
	}
	if err := b.Publish(context.Background(), Envelope{Payload: json.RawMessage(`{"type":"ping"}`)}); err != nil {
		t.Fatalf("发布失败: %v", err)
	}

	if len(received) != 1 {
		t.Fatalf("期望收到 1 条本地广播，实际 %d", len(received))
	}
	if received[0].Origin != "local-1" {
		t.Errorf("Origin 期望 local-1，得到 %q", received[0].Origin)
	}
}

// TestRedisBroadcasterSkipsMalformedPayload 非法 JSON 不应让订阅循环退出。
func TestRedisBroadcasterSkipsMalformedPayload(t *testing.T) {
	mr := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	defer func() { _ = client.Close() }()

	b := New(client, "instance-b")
	defer func() { _ = b.Close() }()

	received := make(chan Envelope, 4)
	if err := b.Subscribe(context.Background(), func(e Envelope) { received <- e }); err != nil {
		t.Fatalf("订阅失败: %v", err)
	}

	// 直接往频道里塞一条坏数据，再塞一条好数据
	client.Publish(context.Background(), Channel, "not-json")
	client.Publish(context.Background(), Channel, `{"origin":"other","payload":{"type":"ok"}}`)

	select {
	case env := <-received:
		if env.Origin != "other" {
			t.Errorf("Origin 期望 other，得到 %q", env.Origin)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("坏数据之后的好数据没有被投递，订阅循环可能已退出")
	}
}
