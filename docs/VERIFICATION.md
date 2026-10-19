# 验证体系

本项目有五个层次的验证，从快到慢：

| 层次 | 命令 | 覆盖 | 耗时 |
|---|---|---|---|
| 1. 后端单元/集成 | `cd backend && RUN_INTEGRATION_TESTS=true go test ./...` | handler、service、缓存失效、安全 | ~5s |
| 2. 客户端单元 | `cd client_app && flutter test` | 会话状态、缓存、刷新、群/好友/置顶 | ~2s |
| 3. 接口契约 | `go test ./cmd/api-gateway/` | 路由是否注册、swagger 是否覆盖 | ~1s |
| 4. 端到端（单实例） | `bash scripts/e2e_local.sh` | 26 步 HTTP + 7 步实时 WS | ~2min |
| 5. 部署形态 | `bash scripts/verify_multi_instance.sh`、Web 验证 | 跨实例广播、浏览器运行时 | 各 ~1min |

## 跨实例广播（自动化，已验证通过）

```bash
bash scripts/verify_multi_instance.sh
```

脚本会构建后端、用**同一个 SQLite 文件 + 同一个 Redis** 起两个实例（端口 18181 / 18182），
A 连实例 1、B 连实例 2，然后：

1. 在实例 2 发消息 → A 必须在实例 1 的 WebSocket 上收到（证明 Redis Pub/Sub 生效）
2. 反向再验证一次
3. 断开连接并清理进程

实测结果（`✅ 跨实例广播验证全部通过`）：

```
▶ 2. A 连实例 1，B 连实例 2          ✅ 两侧 WebSocket 均已连接
▶ 3. 在实例 B 上发消息，实例 A 上的 A 应收到
                                     ✅ 实例 1 的 A 收到了实例 2 发出的消息（Redis 广播生效）
▶ 4. 反向：在实例 A 上发消息，B 应收到 ✅ 实例 2 的 B 收到了实例 1 发出的消息
```

## Web 运行时（已验证通过，自动化有已知限制）

目标是验证两件事：
1. 构建产物能在**真实 Chrome**里启动（Flutter 挂载成功、无 JS 异常）
2. 浏览器 origin 下能完成 注册 → 建群 → 发消息 → 读回（CORS + fetch 路径）

`scripts/verify_web.sh` 提供 `start` / `check` / `stop` 三步：

```bash
bash scripts/verify_web.sh start   # 构建 web、起后端(18090)、托管产物(18091)、起 headless Chrome(9222)
bash scripts/verify_web.sh check   # CDP 驱动：确认挂载 + 浏览器侧 API 全链路
bash scripts/verify_web.sh stop
```

实测通过的输出：

```
PAGE title='NeoChat' flutter_booted=True
API_RESULT={"step": "ok", "user": "webrun43330510", "convId": "99437d97-...", "found": true}
CONSOLE_LOGS=2 ERRORS=0
VERIFY_RESULT=PASS
```

**已知限制**：本机 headless Chrome 的 CDP WebSocket 在部分启动方式下会「握手成功但无响应」。
实测中以下方式稳定通过：**用独立的 shell 调用启动服务与 Chrome，再用另一个独立调用执行 `check`**。
如果 `check` 卡住（超过 60 秒无输出），执行 `bash scripts/verify_web.sh stop` 后重试一次即可；
这不是应用本身的问题（页面已成功加载、API 全链路已通过）。

## 依赖服务（Docker）

本机不再用 brew 安装中间件，统一用 Docker 管理，端口与项目默认配置一致：

| 服务 | 容器名 | 端口 | 管理命令 |
|---|---|---|---|
| Redis | `neochat-redis` | 6379 | `bash scripts/redis_docker.sh {start\|stop\|status\|logs}` |
| PostgreSQL | `neochat-pg` | 15432 | `bash scripts/e2e_postgres.sh [--keep]` |

Redis 容器使用命名卷 `neochat-redis-data` 与 AOF 持久化，重启策略 `unless-stopped`。
Docker Hub 直连不通时脚本会自动改用 `docker.m.daocloud.io` 镜像源。

跨实例广播验证（`scripts/verify_multi_instance.sh`）就是跑在这个 Docker Redis 上的，
双向广播均通过。

## Postgres（已验证通过）

```bash
bash scripts/e2e_postgres.sh          # 起容器 → 跑 E2E → 停容器
bash scripts/e2e_postgres.sh --keep   # 跑完保留容器（端口 15432）
```

脚本用 Docker 起 `postgres:16-alpine`（端口 15432，密码 `neochat_dev_pw`，库 `neochat`），
以 `driver: postgres` 启动后端，然后跑完整 E2E——与 SQLite 用的是同一套断言。

实测结果（`✅ Postgres 上的 E2E 全部通过`）：

```
▶ 启动 PostgreSQL 16 容器（端口 15432）      数据库已就绪
▶ 构建并启动后端（连接 Postgres）            后端已连接 Postgres
▶ 在 Postgres 上执行完整 E2E                 HTTP 26/26 + 实时 7/7
```

这验证了此前只有 SQLite 覆盖的几处方言风险：
`convs` 排序（`pinned DESC, updated_at DESC`）、大小写不敏感搜索（`LOWER(...) LIKE LOWER(...)`）、
UUID 主键与时间戳比较、pgx 驱动下的连接池与迁移。

**已知限制**：
- Docker Hub 直连不通时会自动改用 `docker.m.daocloud.io` 镜像源并本地打 tag；
  两者都不通时脚本会明确报错退出。
- Go 单元测试仍跑在 SQLite 上（`TestConfig` 固定 sqlite）；
  Postgres 只覆盖了端到端链路，未覆盖每个 handler 的单测。

## 尚未覆盖

| 项 | 原因 |
|---|---|
| 真机录音/播放 | 需要麦克风与音频设备的人工确认 |
| 系统级推送通知 | 需要 APNs / FCM 证书或平台通知插件 |
| 压力/并发 | 未做压测，结论不覆盖性能与连接风暴 |
| 高并发/长连接压测 | 未做，当前结论不覆盖性能 |
