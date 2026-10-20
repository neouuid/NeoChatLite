package chat

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/internal/user"
	"github.com/neochat/backend/pkg/test"
)

// TestGroupMemberLimitEnforced 群成员上限之前只存在字段里、从未校验
func TestGroupMemberLimitEnforced(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{}, &Conversation{}, &ConversationMember{}, &Group{},
		&Message{}, &MessageRead{}, &Favorite{}, &Mention{}, &CallRecord{},
	)
	defer test.CleanupTestDatabase(t)

	repo := NewRepository(db)
	svc := NewService(repo)

	ownerName := "owner_" + uuid.NewString()[:8]
	otherName := "other_" + uuid.NewString()[:8]
	owner := &user.User{ID: uuid.New(), Username: ownerName, Email: ownerName + "@t.local", Phone: "131" + uuid.NewString()[:8]}
	other := &user.User{ID: uuid.New(), Username: otherName, Email: otherName + "@t.local", Phone: "132" + uuid.NewString()[:8]}
	require.NoError(t, db.Create(owner).Error)
	require.NoError(t, db.Create(other).Error)

	conv, group, err := svc.CreateGroup(owner.ID, "limit-group", "", "", []uuid.UUID{other.ID})
	require.NoError(t, err)

	// 把上限改成 2（owner + other 已占满）
	require.NoError(t, db.Model(&Group{}).Where("id = ?", group.ID).Update("max_members", 2).Error)

	thirdName := "third_" + uuid.NewString()[:8]
	third := &user.User{ID: uuid.New(), Username: thirdName, Email: thirdName + "@t.local", Phone: "133" + uuid.NewString()[:8]}
	require.NoError(t, db.Create(third).Error)

	err = svc.AddGroupMember(conv.ID, owner.ID, third.ID)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "group is full")
}

// TestSendMessageIsIdempotent 同一个 client_msg_id 重复提交只落一条
func TestSendMessageIsIdempotent(t *testing.T) {
	test.SkipIntegrationTests(t)

	cfg := test.SetupTestConfig(t)
	db := test.SetupTestDatabase(t, cfg,
		&user.User{}, &Conversation{}, &ConversationMember{}, &Message{},
		&MessageRead{}, &Group{}, &Favorite{}, &Mention{}, &CallRecord{},
	)
	defer test.CleanupTestDatabase(t)

	repo := NewRepository(db)
	svc := NewService(repo)

	idemName := "idem_" + uuid.NewString()[:8]
	u := &user.User{ID: uuid.New(), Username: idemName, Email: idemName + "@t.local", Phone: "134" + uuid.NewString()[:8]}
	require.NoError(t, db.Create(u).Error)

	conv, _, err := svc.CreateGroup(u.ID, "idem-group", "", "", nil)
	require.NoError(t, err)

	key := "idem-" + uuid.NewString()

	first, err := svc.SendMessage(conv.ID, u.ID, MessageTypeText, "hello", "", "", 0, nil, key)
	require.NoError(t, err)

	second, err := svc.SendMessage(conv.ID, u.ID, MessageTypeText, "hello", "", "", 0, nil, key)
	require.NoError(t, err)

	assert.Equal(t, first.ID, second.ID, "重复提交应返回同一条消息")

	var count int64
	require.NoError(t, db.Model(&Message{}).Where("conversation_id = ?", conv.ID).Count(&count).Error)
	assert.Equal(t, int64(1), count, "不应重复落库")
}
