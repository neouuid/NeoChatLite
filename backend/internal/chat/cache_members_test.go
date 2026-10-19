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

// TestGroupRenameInvalidatesAllMemberLists 回归测试：
// 群改名后，所有成员的 convs:{userID} 缓存都必须失效，
// 否则其他成员会一直看到旧群名（缓存过期前）。
func TestGroupRenameInvalidatesAllMemberLists(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{},
		&auth.VerificationToken{}, &auth.RefreshToken{}, &auth.Device{}, &auth.LoginHistory{},
		&Conversation{}, &ConversationMember{}, &Message{}, &MessageRead{},
		&Group{}, &Favorite{}, &CallRecord{}, &Mention{},
	)
	defer test.CleanupTestDatabase(t)

	mr := miniredis.RunT(t)
	client := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
	defer func() { _ = client.Close() }()
	previous := redis.Client
	redis.Client = client
	defer func() { redis.Client = previous }()

	owner := &user.User{ID: uuid.New(), Username: "grp_owner", Email: "go@example.com", Phone: "13000009301", Password: "x"}
	member := &user.User{ID: uuid.New(), Username: "grp_member", Email: "gm@example.com", Phone: "13000009302", Password: "x"}
	require.NoError(t, db.Create(owner).Error)
	require.NoError(t, db.Create(member).Error)

	repo := NewRepository(db)
	service := NewService(repo)

	conv, _, err := service.CreateGroup(owner.ID, "旧群名", "", "", []uuid.UUID{member.ID})
	require.NoError(t, err)

	// 预置两位成员的列表缓存
	for _, u := range []uuid.UUID{owner.ID, member.ID} {
		key := redis.KeyPrefixConversations + u.String()
		require.NoError(t, client.Set(context.Background(), key, "[]", time.Minute).Err())
		require.Equal(t, int64(1), client.Exists(context.Background(), key).Val())
	}

	// 改群名
	_, err = service.UpdateGroup(conv.ID, owner.ID, "新群名", "", "")
	require.NoError(t, err)

	for _, u := range []uuid.UUID{owner.ID, member.ID} {
		key := redis.KeyPrefixConversations + u.String()
		assert.Equal(t, int64(0), client.Exists(context.Background(), key).Val(),
			"改名后成员 %s 的会话列表缓存应被清除", u)
	}
}
