// Package migrations 负责数据库结构的版本化演进。
//
// 历史做法是启动时直接 AutoMigrate，问题在于：
//   - 不会删除/重命名列，模型与库容易静默漂移
//   - 大表加索引会锁表
//   - 无法回滚，也无法知道某个环境到底跑到了哪一版
//
// 现在改为 goose 管理的版本化迁移：每个方言一份 SQL，启动时按版本推进。
package migrations

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"log"
	"strings"

	"github.com/pressly/goose/v3"
)

//go:embed sql/*/*.sql
var files embed.FS

// dialectDir 把配置里的驱动名映射到迁移目录
func dialectDir(driver string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(driver)) {
	case "postgres", "postgresql":
		return "postgres", nil
	case "sqlite", "sqlite3":
		return "sqlite", nil
	default:
		return "", fmt.Errorf("unsupported database driver for migrations: %s", driver)
	}
}

// gooseDialect goose 与驱动名不完全一致（sqlite 在 goose 里叫 sqlite3）
func gooseDialect(dir string) string {
	if dir == "sqlite" {
		return "sqlite3"
	}
	return dir
}

// Up 把数据库推进到最新版本（幂等）。
func Up(ctx context.Context, db *sql.DB, driver string) error {
	dir, err := dialectDir(driver)
	if err != nil {
		return err
	}

	goose.SetBaseFS(files)
	if err := goose.SetDialect(gooseDialect(dir)); err != nil {
		return fmt.Errorf("set goose dialect: %w", err)
	}

	// 旧库（AutoMigrate 建的）自动认领为基线版本
	if adopted, err := adoptExistingSchema(ctx, db, dir); err != nil {
		return fmt.Errorf("adopt existing schema: %w", err)
	} else if adopted {
		log.Printf("[migrations] 检测到已有表结构（AutoMigrate 创建），已将基线标记为已应用")
	}

	if err := goose.UpContext(ctx, db, "sql/"+dir); err != nil {
		return fmt.Errorf("apply migrations (%s): %w", dir, err)
	}
	return nil
}

// Version 返回当前版本（便于启动日志与排查）
func Version(db *sql.DB, driver string) (int64, error) {
	dir, err := dialectDir(driver)
	if err != nil {
		return 0, err
	}
	goose.SetBaseFS(files)
	if err := goose.SetDialect(gooseDialect(dir)); err != nil {
		return 0, err
	}
	return goose.GetDBVersion(db)
}

// tableExists 判断某张表是否存在（Postgres / SQLite 通用写法）
func tableExists(ctx context.Context, db *sql.DB, table string) (bool, error) {
	var n int
	err := db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`, table,
	).Scan(&n)
	if err == nil {
		return n > 0, nil
	}
	// SQLite 没有 information_schema
	err = db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?`, table,
	).Scan(&n)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// adoptExistingSchema 处理「库是旧版 AutoMigrate 建的」这种情况：
// 表已经存在但没有 goose 版本表。此时把基线标记为已应用，
// 避免启动时报 "table already exists"。
func adoptExistingSchema(ctx context.Context, db *sql.DB, dir string) (bool, error) {
	hasGoose, err := tableExists(ctx, db, "goose_db_version")
	if err != nil || hasGoose {
		return false, err
	}
	hasUsers, err := tableExists(ctx, db, "users")
	if err != nil || !hasUsers {
		return false, err
	}

	var create string
	if dir == "postgres" {
		create = `CREATE TABLE goose_db_version (
			id serial NOT NULL,
			version_id bigint NOT NULL,
			is_applied boolean NOT NULL,
			tstamp timestamp DEFAULT now(),
			PRIMARY KEY (id)
		)`
	} else {
		create = `CREATE TABLE goose_db_version (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			version_id INTEGER NOT NULL,
			is_applied INTEGER NOT NULL,
			tstamp TIMESTAMP DEFAULT (datetime('now'))
		)`
	}
	if _, err := db.ExecContext(ctx, create); err != nil {
		return false, err
	}
	// 0 是 goose 的初始行，1 表示基线已应用
	if _, err := db.ExecContext(ctx,
		`INSERT INTO goose_db_version (version_id, is_applied) VALUES (0, true), (1, true)`,
	); err != nil {
		return false, err
	}
	return true, nil
}
