// Package broadcast 提供跨实例的 WebSocket 广播能力。
//
// 单实例部署时行为与本地广播完全一致；多实例部署时，通过 Redis Pub/Sub
// 把「要推给哪些用户 / 哪个会话」的指令广播给所有实例，各实例只推给
// 自己本地持有的连接，从而解决「消息推不到另一台机器上的用户」的问题。
package broadcast

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Channel 是广播使用的 Redis 频道名。
const Channel = "neochat:ws:broadcast"

// Envelope 是跨实例广播的信封。
type Envelope struct {
	// Origin 是发出该广播的实例 ID，用于避免实例重复投递自己的消息。
	Origin string `json:"origin"`
	// UserIDs 非空时表示定向投递；为空表示按 Payload 中的会话/全员语义投递。
	UserIDs []string `json:"user_ids,omitempty"`
	// Payload 是原始 WebSocket 消息（JSON），由各实例解析后本地投递。
	Payload json.RawMessage `json:"payload"`
}

// Handler 处理来自其他实例的广播。
type Handler func(Envelope)

// Broadcaster 抽象了「广播到所有实例」的能力。
type Broadcaster interface {
	// Publish 发布一条广播；实现方负责填充 Origin。
	Publish(ctx context.Context, env Envelope) error
	// Subscribe 注册接收回调。Local 实现会记住回调，Redis 实现会占用一个 goroutine。
	Subscribe(ctx context.Context, h Handler) error
	// Close 释放底层资源。
	Close() error
}

// New 根据是否提供 Redis 客户端返回对应实现。
// client 为 nil（未配置 Redis）时降级为进程内广播，行为与单实例一致。
func New(client redis.UniversalClient, instanceID string) Broadcaster {
	if client == nil {
		return &localBroadcaster{instanceID: instanceID}
	}
	return &redisBroadcaster{client: client, instanceID: instanceID}
}

// localBroadcaster 进程内广播：Publish 直接回调，不跨实例。
type localBroadcaster struct {
	mu         sync.RWMutex
	instanceID string
	handler    Handler
}

func (b *localBroadcaster) Publish(_ context.Context, env Envelope) error {
	env.Origin = b.instanceID
	b.mu.RLock()
	h := b.handler
	b.mu.RUnlock()
	if h != nil {
		h(env)
	}
	return nil
}

func (b *localBroadcaster) Subscribe(_ context.Context, h Handler) error {
	b.mu.Lock()
	b.handler = h
	b.mu.Unlock()
	return nil
}

func (b *localBroadcaster) Close() error { return nil }

// redisBroadcaster 通过 Redis Pub/Sub 跨实例广播。
type redisBroadcaster struct {
	client     redis.UniversalClient
	instanceID string
	sub        *redis.PubSub

	mu     sync.Mutex
	closed bool
}

func (b *redisBroadcaster) Publish(ctx context.Context, env Envelope) error {
	env.Origin = b.instanceID
	data, err := json.Marshal(env)
	if err != nil {
		return fmt.Errorf("broadcast: marshal envelope: %w", err)
	}

	pubCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	if err := b.client.Publish(pubCtx, Channel, data).Err(); err != nil {
		return fmt.Errorf("broadcast: publish: %w", err)
	}
	return nil
}

func (b *redisBroadcaster) Subscribe(ctx context.Context, h Handler) error {
	sub := b.client.Subscribe(ctx, Channel)

	// 等待订阅确认，避免启动瞬间的广播丢失。
	if _, err := sub.Receive(ctx); err != nil {
		_ = sub.Close()
		return fmt.Errorf("broadcast: subscribe: %w", err)
	}

	b.mu.Lock()
	if b.closed {
		b.mu.Unlock()
		_ = sub.Close()
		return fmt.Errorf("broadcast: closed")
	}
	b.sub = sub
	b.mu.Unlock()

	go func() {
		for msg := range sub.Channel() {
			var env Envelope
			if err := json.Unmarshal([]byte(msg.Payload), &env); err != nil {
				continue
			}
			// 跳过自己发出的广播：本实例在 Publish 前已做过本地投递。
			if env.Origin == b.instanceID {
				continue
			}
			h(env)
		}
	}()

	return nil
}

func (b *redisBroadcaster) Close() error {
	b.mu.Lock()
	b.closed = true
	sub := b.sub
	b.mu.Unlock()

	if sub != nil {
		return sub.Close()
	}
	return nil
}
