//go:build cgo

package database

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// openSQLite 使用 cgo 版驱动（mattn/go-sqlite3）打开 SQLite。
//
// 只有开启 cgo 时才参与编译，这样 `CGO_ENABLED=0` 的静态构建/交叉编译
// 不会被 cgo 依赖卡住；生产环境请使用 PostgreSQL。
func openSQLite(dsn string, gormConfig *gorm.Config) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(dsn), gormConfig)
}
