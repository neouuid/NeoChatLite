package chat

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/internal/auth"
	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/redis"
	"github.com/neochat/backend/pkg/test"
)

// TestMarkConversationAsReadInvalidatesCache 回归测试：
// 标记已读后必须清掉该用户的会话列表缓存。
//
// 之前漏了这一步，启用 Redis 时客户端会一直读到「已读前」的未读数——
// 未读数字永远不会归零。E2E 在有 Redis 的环境里复现过。
func TestMarkConversationAsReadInvalidatesCache(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	// 用 miniredis 顶替真实 Redis（进程内真实协议）
	mr := miniredis.RunT(t)
	client := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
	defer func() { _ = client.Close() }()

	previous := redis.Client
	redis.Client = client
	defer func() { redis.Client = previous }()

	alice := &user.User{ID: uuid.New(), Username: "cache_alice", Email: "ca@example.com", Phone: "13000009101", Password: "x"}
	bob := &user.User{ID: uuid.New(), Username: "cache_bob", Email: "cb@example.com", Phone: "13000009102", Password: "x"}
	require.NoError(t, db.Create(alice).Error)
	require.NoError(t, db.Create(bob).Error)

	repo := NewRepository(db)
	service := NewService(repo)

	conv := &Conversation{ID: uuid.New(), Type: ConversationTypeSingle, CreatedBy: alice.ID}
	require.NoError(t, repo.CreateConversation(conv))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{ID: uuid.New(), ConversationID: conv.ID, UserID: alice.ID}))
	require.NoError(t, repo.AddConversationMember(&ConversationMember{
		ID: uuid.New(), ConversationID: conv.ID, UserID: bob.ID, UnreadCount: 3,
	}))

	// 预置一份"已读前"的会话列表缓存
	cacheKey := redis.KeyPrefixConversations + bob.ID.String()
	require.NoError(t, client.Set(context.Background(), cacheKey, "[]", time.Minute).Err())
	require.Equal(t, int64(1), client.Exists(context.Background(), cacheKey).Val())

	require.NoError(t, service.MarkConversationAsRead(conv.ID, bob.ID))

	// 缓存应被清除
	assert.Equal(t, int64(0), client.Exists(context.Background(), cacheKey).Val(),
		"标记已读后必须让会话列表缓存失效")

	// 数据库里未读也应归零
	count, err := repo.GetUnreadCount(conv.ID, bob.ID)
	require.NoError(t, err)
	assert.Equal(t, int64(0), count)
}
