# 文档索引

面向不同读者的入口。**代码与脚本是唯一事实来源**，文档与之冲突时以代码为准。

想先看全貌：仓库 [README](../README.md) 的「一张图看懂」与「验证矩阵」。

## 上手

| 文档 | 适合谁 |
|---|---|
| [开发环境搭建.md](开发环境搭建.md) | 第一次把项目跑起来（Docker / 本地 SQLite 两条路） |
| [开发者指南.md](开发者指南.md) | 日常开发：目录结构、加接口、加迁移、调试 |
| [测试指南.md](测试指南.md) | 写测试与跑验证脚本 |

## 设计与契约

| 文档 | 内容 |
|---|---|
| [架构设计.md](架构设计.md) | 技术选型、整体架构、安全架构（按当前实现描述） |
| [数据库设计.md](数据库设计.md) | 表结构与索引；迁移方式见 MIGRATIONS.md |
| [API设计.md](API设计.md) | 接口契约（也可直接看 `backend/docs/swagger.json`） |
| [API使用示例.md](API使用示例.md) | curl 示例 |
| [设计规范.md](设计规范.md) | UI/交互规范与设计稿说明 |

## 运维与质量

| 文档 | 内容 |
|---|---|
| [部署文档.md](部署文档.md) | 生产部署、反向代理、备份、监控 |
| [MIGRATIONS.md](MIGRATIONS.md) | 版本化迁移：新增一次迁移的完整步骤 |
| [SECURITY.md](SECURITY.md) | 令牌模型、防护机制、上线检查清单 |
| [VERIFICATION.md](VERIFICATION.md) | 五层验证体系与实测结果、已知限制 |
| [CLIENT-FEATURES.md](CLIENT-FEATURES.md) | 客户端能力、交互速查与限制 |
| [ROADMAP.md](ROADMAP.md) | 已完成 / 待验证 / 明确不做 / 技术债与触发条件 |

## 快速命令

```bash
# 全部依赖 + 后端（Docker）
cp .env.example .env && docker compose up -d --build

# 本地开发（SQLite，无需中间件）
cd backend && go build -o /tmp/neochat ./cmd/api-gateway && cd /tmp && ./neochat

# 客户端
cd client_app && flutter run -d macos

# 验证
cd backend && RUN_INTEGRATION_TESTS=true go test ./...
cd client_app && flutter test
bash scripts/e2e_local.sh
```
