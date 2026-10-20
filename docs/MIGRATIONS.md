# 数据库迁移

## 为什么不用 AutoMigrate

早期实现是启动时 `db.AutoMigrate(models...)`，问题：

- **不会删列、不会重命名**：模型改了、库不会改，代码与结构静默漂移
- **无法回滚**，也查不到某个环境跑到了哪一版
- 大表加索引/改类型可能**锁表**，且没有事务边界

现在生产路径改为 goose 管理的版本化迁移；`AutoMigrate` 只保留给测试
（测试只建它关心的那几张表，快且隔离）。

## 目录结构

```
backend/internal/migrations/
├── migrate.go                      # Up / Version，启动时调用
└── sql/
    ├── postgres/00001_init.sql     # 基线（与 AutoMigrate 生成的结构一致）
    └── sqlite/00001_init.sql
```

每个方言一份 SQL，通过 `embed` 打进二进制，容器里不需要额外文件。

## 启动行为

`main.go` 启动时调用 `migrations.Up()`：

1. 若库里已有业务表但**没有** `goose_db_version`（旧版 AutoMigrate 建的库），
   自动把基线标记为已应用（认领），并打日志
2. 否则按版本执行未应用的迁移
3. 打印当前 schema 版本，便于排查

启动日志示例：

```
[INFO] Database schema version: 1
```

## 新增一次迁移

1. 在 `sql/postgres/` 与 `sql/sqlite/` 各加一个文件，编号递增：

```
sql/postgres/00002_add_group_notice.sql
sql/sqlite/00002_add_group_notice.sql
```

2. 文件格式（goose）：

```sql
-- +goose Up
-- +goose StatementBegin
ALTER TABLE groups ADD COLUMN notice TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE groups DROP COLUMN notice;
-- +goose StatementEnd
```

3. 两个方言的**语义必须一致**；SQLite 不支持 `DROP COLUMN` 的老版本需要用
   “建新表 → 拷数据 → 换名”的写法。
4. 重新编译即可，无需在部署时额外执行命令。

## 验证方式

```bash
# 迁移单元测试（新建库 / 幂等 / 认领旧库 / 非法驱动）
cd backend && go test ./internal/migrations/ -v

# 端到端：全新库由迁移建表后跑完整 E2E
bash scripts/e2e_postgres.sh
bash scripts/e2e_local.sh
```

## 已知限制

- 基线是把 AutoMigrate 生成的 DDL 固化下来的，**没有逐步演进历史**；
  真正的业务变更从 `00002` 开始记录
- 回滚（Down）写了但未在 CI 中演练；生产回滚需先备份
- 迁移在应用启动时执行，多实例同时启动会并发抢锁；
  goose 用数据库锁保证只有一个实例真正执行，其余等待
