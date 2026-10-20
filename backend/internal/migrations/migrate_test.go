package migrations

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestUpCreatesSchemaOnFreshSQLite 全新库应能建出全部表并记录版本
func TestUpCreatesSchemaOnFreshSQLite(t *testing.T) {
	dir := t.TempDir()
	db, err := gorm.Open(sqlite.Open(dir+"/fresh.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	require.NoError(t, Up(context.Background(), sqlDB, "sqlite"))

	version, err := Version(sqlDB, "sqlite")
	require.NoError(t, err)
	assert.Equal(t, int64(1), version)

	for _, table := range []string{"users", "messages", "conversation_members", "refresh_tokens"} {
		var n int
		require.NoError(t, sqlDB.QueryRow(
			`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`, table).Scan(&n))
		assert.Equal(t, 1, n, "缺少表 %s", table)
	}
}

// TestUpIsIdempotent 重复执行不应报错
func TestUpIsIdempotent(t *testing.T) {
	dir := t.TempDir()
	db, err := gorm.Open(sqlite.Open(dir+"/idem.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	require.NoError(t, Up(context.Background(), sqlDB, "sqlite"))
	require.NoError(t, Up(context.Background(), sqlDB, "sqlite"))
}

// TestUpAdoptsLegacySchema 旧库（AutoMigrate 建的、没有版本表）应被认领为基线
func TestUpAdoptsLegacySchema(t *testing.T) {
	dir := t.TempDir()
	db, err := gorm.Open(sqlite.Open(dir+"/legacy.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	defer sqlDB.Close()

	// 模拟旧版启动流程：只有业务表，没有 goose 表
	require.NoError(t, sqlDB.Ping())
	_, err = sqlDB.Exec(`CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT)`)
	require.NoError(t, err)

	require.NoError(t, Up(context.Background(), sqlDB, "sqlite"))

	version, err := Version(sqlDB, "sqlite")
	require.NoError(t, err)
	assert.Equal(t, int64(1), version, "旧库应被认领为基线版本")
}

// TestUnsupportedDriver 不支持的驱动应报错而不是静默跳过
func TestUnsupportedDriver(t *testing.T) {
	dir := t.TempDir()
	db, err := gorm.Open(sqlite.Open(dir+"/x.db"), &gorm.Config{})
	require.NoError(t, err)
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	assert.Error(t, Up(context.Background(), sqlDB, "mysql"))
}
