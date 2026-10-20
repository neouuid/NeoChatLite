# 认证与安全说明

本文记录当前实现的认证安全机制、已知边界，以及上线前必须确认的配置。

## 令牌模型

| 令牌 | 用途 | 有效期 | 服务端状态 |
|---|---|---|---|
| access token | 调用 API / WS | `jwt.expiry_hour`（默认 1 小时） | 无状态 |
| refresh token | 仅用于换发新令牌 | 7 天 | **落库**（存 SHA-256 哈希） |

关键约束：

- 令牌带 `typ` 声明（`access` / `refresh`）。**access token 不能用于刷新**，
  refresh token 也不能当访问令牌使用（`ParseAccessToken` / `ParseRefreshToken` 分别校验）。
- refresh token **一次性使用**（轮换）：每次刷新都会吊销旧记录并签发新令牌。
  重放已用过的令牌会被判定为泄露，**吊销该用户全部刷新令牌**。
- 登出、修改密码、重置密码都会吊销该用户全部刷新令牌。
- 签发与校验强制 `HS256`（`jwt.WithValidMethods`），拒绝其它签名算法。

## 登录防护

| 机制 | 取值 | 位置 |
|---|---|---|
| 账号锁定 | 同一标识连续失败 5 次 → 锁 15 分钟 | `internal/auth/guard.go` |
| 认证接口限流 | 每 IP 每分钟 `server.auth_rate_limit_per_minute`（默认 20） | `pkg/middleware/ratelimit.go` |
| 密码策略 | 8 ~ 72 字节（bcrypt 上限） | `internal/auth/guard.go` |
| 密码哈希 | bcrypt（默认 cost） | `pkg/utils/password.go` |
| 错误文案 | 统一 `invalid credentials`，不区分账号是否存在 | `internal/auth/service.go` |

## 启动期校验

`config.ValidateJWTSecret` 会在启动时检查 `jwt.secret`：

- 为空、等于模板默认值、或短于 32 字符 → 视为不安全配置；
- **生产环境（`APP_ENV=production` 或 `GIN_MODE=release`）直接拒绝启动**；
- 开发环境仅打印告警。

## 文件访问控制

上传文件**不再通过静态目录暴露**（旧的 `r.Static("/uploads", ...)` 已移除）。

- 访问入口：`GET /api/v1/files/*path`，必须带 `Authorization: Bearer` 或 `?token=`
- 文件若被某条消息引用，还要求调用者是该会话成员；否则 403
- 路径做穿越防护（拒绝 `..`、绝对路径、盘符），拼接后二次确认仍在 uploadDir 内
- 响应带 `X-Content-Type-Options: nosniff`、`Cache-Control: private`
- `?token=` 是为了 `<img>/<video>/<audio>` 无法自定义请求头的取舍，
  代价是 token 可能出现在 URL / 日志里；如需更强隔离应改为短期签名 URL

## 其它

- 全局安全响应头：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、
  `Permissions-Policy`；仅在 TLS 终结于本服务时下发 HSTS（`pkg/middleware/security.go`）。
- 上传按类型（image / file / audio / video）分别校验大小与 MIME 白名单。

## 上线前检查清单

- [ ] 设置唯一的 `jwt.secret`（≥32 字符，随机生成，不要进仓库）
- [ ] 确认 `APP_ENV=production`，让弱密钥配置启动失败
- [ ] 在反向代理处启用 HTTPS（否则 HSTS 不会下发，令牌明文传输）
- [ ] 多实例部署时把两处内存态换成 Redis：
      - 登录失败计数（`attemptGuard`）
      - 认证接口限流（`RateLimiter`）
      否则每个实例独立计数，实际阈值 = 实例数 × 配置值
- [ ] 客户端令牌存储从 `shared_preferences` 换成 `flutter_secure_storage`

## 已知边界

- access token 无状态：登出后其在有效期内仍可用（默认 1 小时），只能靠短有效期收敛。
- 账号锁定按标识而非 IP：攻击者可用大量不同账号绕过（此时依赖 IP 限流兜底）。
- 未实现 refresh token 的设备/会话管理（无法在界面上踢掉某台设备）。
