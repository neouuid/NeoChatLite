//go:build !cgo

package database

import (
	"fmt"

	"gorm.io/gorm"
)

// openSQLite 在未开启 cgo 时不可用：SQLite 驱动依赖 cgo。
//
// 这里保留同名函数，让 `CGO_ENABLED=0` 的构建可以正常完成，
// 只在真正选择 sqlite 时才报错，并给出可操作的提示。
func openSQLite(_ string, _ *gorm.Config) (*gorm.DB, error) {
	return nil, fmt.Errorf(
		"sqlite driver requires cgo: rebuild with CGO_ENABLED=1, or set database.driver=postgres",
	)
}
