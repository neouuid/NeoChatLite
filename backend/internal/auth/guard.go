package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

// hashToken 计算令牌的 SHA-256（十六进制）。
// 令牌本身是高熵随机串，不需要 bcrypt；用哈希是为了不落库明文。
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// validatePassword 统一密码策略：8~72 字节（bcrypt 上限 72 字节）
func validatePassword(password string) error {
	if utf8.RuneCountInString(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(password) > 72 {
		return errors.New("password must be at most 72 bytes")
	}
	return nil
}

type attemptRecord struct {
	failures  int
	firstFail time.Time
	lockedAt  time.Time
}

// attemptGuard 登录失败计数与锁定。
//
// 单实例内存实现：足以挡住针对某个账号的在线撞库；
// 多实例部署时应换成 Redis 计数（否则各实例独立计数）。
type attemptGuard struct {
	mu         sync.Mutex
	records    map[string]*attemptRecord
	maxFails   int
	failWindow time.Duration
	lockFor    time.Duration
}

func newAttemptGuard(maxFails int, failWindow, lockFor time.Duration) *attemptGuard {
	return &attemptGuard{
		records:    make(map[string]*attemptRecord),
		maxFails:   maxFails,
		failWindow: failWindow,
		lockFor:    lockFor,
	}
}

// normalizeKey 账号标识不区分大小写
func normalizeKey(identifier string) string {
	return strings.ToLower(strings.TrimSpace(identifier))
}

// Blocked 返回是否被锁定，以及剩余锁定时长
func (g *attemptGuard) Blocked(identifier string) (bool, time.Duration) {
	key := normalizeKey(identifier)
	now := time.Now()

	g.mu.Lock()
	defer g.mu.Unlock()

	rec, ok := g.records[key]
	if !ok {
		return false, 0
	}

	if !rec.lockedAt.IsZero() {
		if now.Sub(rec.lockedAt) < g.lockFor {
			return true, g.lockFor - now.Sub(rec.lockedAt)
		}
		// 锁定到期，清零重新计数
		delete(g.records, key)
		return false, 0
	}

	// 失败窗口过期，清零
	if now.Sub(rec.firstFail) > g.failWindow {
		delete(g.records, key)
	}
	return false, 0
}

// Fail 记录一次失败，达到阈值则锁定
func (g *attemptGuard) Fail(identifier string) {
	key := normalizeKey(identifier)
	now := time.Now()

	g.mu.Lock()
	defer g.mu.Unlock()

	rec, ok := g.records[key]
	if !ok || now.Sub(rec.firstFail) > g.failWindow {
		rec = &attemptRecord{firstFail: now}
		g.records[key] = rec
	}
	rec.failures++
	if rec.failures >= g.maxFails {
		rec.lockedAt = now
	}
}

// Reset 登录成功后清除计数
func (g *attemptGuard) Reset(identifier string) {
	key := normalizeKey(identifier)
	g.mu.Lock()
	defer g.mu.Unlock()
	delete(g.records, key)
}

// errLocked 统一的锁定错误文案（带剩余时间）
func errLocked(wait time.Duration) error {
	minutes := int(wait.Minutes())
	if minutes < 1 {
		minutes = 1
	}
	return fmt.Errorf("too many failed attempts, try again in %d minutes", minutes)
}
