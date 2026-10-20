# NeoChat

跨平台即时通讯应用：Go 后端 + Flutter 客户端，支持 Android / iOS / Web / macOS / Windows / Linux 六端。

## 当前状态

| 层 | 状态 |
|---|---|
| 后端 API | 65 个接口，OpenAPI 文档 + 契约测试 |
| 客户端 | 11 个页面：登录/注册、会话、聊天、搜索、@我的、收藏、通讯录、群信息、建群、我的资料、他人资料 |
| 实时 | WebSocket：新消息、正在输入、已读回执、在线状态、跨实例广播 |
| 消息 | 文本 / 图片 / 文件 / 语音 / 视频，引用回复、编辑、转发、撤回、收藏、历史分页 |
| 群聊 | 建群、拉人、设管理员、踢人、退群、解散、改群资料 |
| 关系 | 好友请求、好友列表、黑名单、免打扰、会话置顶 |
| 验证 | 端到端 26 步（SQLite + Postgres 双跑）、实时 7 步、跨实例双向广播、真实 Chrome 运行时、离线缓存 |

## 技术栈

**后端**：Go 1.24、Gin、GORM、PostgreSQL（生产）/ SQLite（测试）、Redis（缓存 + 跨实例广播）、JWT、gorilla/websocket、swaggo

**客户端**：Flutter 3.44、Dart 3.12；状态用 `ChangeNotifier`（`NeoChatSession`），HTTP/WS 走自研 SDK，媒体播放用 `just_audio` / `video_player`，本地缓存用 `shared_preferences`

**代码生成**：`swag init` → `backend/docs/swagger.json` → `scripts/gen_dart_client.py` → `client_sdk/dart` → `client_app`

## 目录结构

```
backend/           Go 后端（cmd/api-gateway、internal/{auth,user,chat}、pkg/*）
backend/Dockerfile 多阶段构建，运行镜像非 root
client_sdk/dart/   由 OpenAPI 生成的 Dart SDK（含 realtime 与测试工具）
client_app/        当前使用的 Flutter 客户端
client_flutter/    历史客户端（不再维护，可忽略）
demo_server/       早期演示服务（可忽略）
docs/              架构、安全、验证、API 说明
scripts/           E2E 与验证脚本
docker-compose.yml Postgres + Redis + 后端 一键起
```

## 快速开始（Docker）

```bash
cp .env.example .env
# 编辑 .env，至少把 NEOCHAT_JWT_SECRET 换成 32 位以上随机串

docker compose up -d --build
curl http://127.0.0.1:8080/health
```

起三个服务：`neochat-postgres`（15432）、`neochat-redis`（6379）、`neochat-app`（8080）。
上传文件持久化在命名卷 `neochat_uploads`，数据库在 `neochat_pgdata`。

> 国内网络：在 `.env` 里放开 `GO_IMAGE` / `RUNTIME_IMAGE` / `PG_IMAGE` / `REDIS_IMAGE`
> 的镜像源注释，并把 `GO_PROXY` 设为 `https://goproxy.cn,direct`。

停止并清理：

```bash
docker compose down          # 保留数据卷
docker compose down -v       # 连数据一起删
```

## 本地开发（SQLite，不需要任何中间件）

```bash
cd backend
go build -o /tmp/neochat ./cmd/api-gateway
cd /tmp && ./neochat          # 默认 8080，自动 SQLite 建库
```

客户端：

```bash
cd client_app
flutter pub get
flutter run -d macos          # 或 chrome / ios / android
# 指向其它后端：--dart-define=NEOCHAT_BASE_URL=http://127.0.0.1:8080
```

## 验证

```bash
# 后端（单元 + 集成）
cd backend && RUN_INTEGRATION_TESTS=true go test ./...

# 客户端
cd client_app && flutter analyze && flutter test

# 端到端（SQLite）
bash scripts/e2e_local.sh

# 端到端（Postgres，需 Docker）
bash scripts/e2e_postgres.sh

# 跨实例广播（需 Redis）
bash scripts/verify_multi_instance.sh

# Web 运行时（需 Chrome）
bash scripts/verify_web.sh start && bash scripts/verify_web.sh check
```

详细说明见 [docs/VERIFICATION.md](docs/VERIFICATION.md)。

## 安全相关

- 访问令牌与刷新令牌类型隔离（`typ` 声明），刷新令牌一次性轮换、可吊销
- 登录失败 5 次锁定 15 分钟；认证接口按 IP 限流；生产环境弱 JWT 密钥拒绝启动
- 上传文件不再公开暴露：`GET /api/v1/files/*path` 需鉴权，被消息引用的文件还要求是会话成员
- 细节与上线检查清单见 [docs/SECURITY.md](docs/SECURITY.md)

## 文档

| 文档 | 内容 |
|---|---|
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | 五层验证体系与实测结果 |
| [docs/SECURITY.md](docs/SECURITY.md) | 令牌模型、防护机制、上线检查清单 |
| [docs/CLIENT-FEATURES.md](docs/CLIENT-FEATURES.md) | 客户端能力与交互速查 |
| `backend/docs/swagger.json` | OpenAPI 契约（启动后 `/swagger/index.html`） |
| [client_sdk/dart/README.md](client_sdk/dart/README.md) | SDK 用法、协议细节、响应结构约定 |

## 已知限制

- 无系统级推送通知（仅应用内提醒），需要 APNs/FCM 或平台通知插件
- 真机录音/播放未做自动化验证
- 数据库迁移仍用 AutoMigrate，尚未版本化
- 无压力测试结论

## License

见 [LICENSE](LICENSE)。
