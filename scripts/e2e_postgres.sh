#!/usr/bin/env bash
# 用 Docker 起一个 PostgreSQL，把完整 E2E 跑在 Postgres 上（此前只有 SQLite）。
#
#   bash scripts/e2e_postgres.sh              # 起容器 → 跑 E2E → 停容器
#   bash scripts/e2e_postgres.sh --keep       # 跑完保留容器
#   bash scripts/e2e_postgres.sh --external   # 用外部已有的 Postgres（CI 服务容器）
#
# 依赖：Docker（daemon 必须可用）、Go、dart
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.pg-run"
CONTAINER=neochat-pg
APP_PORT="${APP_PORT:-18085}"
KEEP=0
EXTERNAL=0
for arg in "$@"; do
  [ "$arg" = "--keep" ] && KEEP=1
  [ "$arg" = "--external" ] && EXTERNAL=1
done

# 连接信息全部可被环境变量覆盖：
#   - Docker 模式默认 127.0.0.1:15432（容器映射端口）
#   - --external 模式默认 127.0.0.1:5432（CI 的 service container 直接映射）
if [ "$EXTERNAL" = "1" ]; then
  PG_HOST="${PG_HOST:-127.0.0.1}"
  PG_PORT="${PG_PORT:-5432}"
  PG_USER="${PG_USER:-postgres}"
  PG_PASSWORD="${PG_PASSWORD:-postgres}"
else
  PG_HOST="${PG_HOST:-127.0.0.1}"
  PG_PORT="${PG_PORT:-15432}"
  PG_USER="${PG_USER:-postgres}"
  PG_PASSWORD="${PG_PASSWORD:-neochat_dev_pw}"
fi
PG_DB="${PG_DB:-neochat}"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  sleep 1
  if [ "$EXTERNAL" = "1" ]; then
    return 0
  fi
  if [ "$KEEP" = "0" ]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1
  else
    echo "（容器 $CONTAINER 保留，端口 $PG_PORT）"
  fi
}
trap cleanup EXIT

if [ "$EXTERNAL" = "0" ]; then
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker daemon 不可用。请先启动 Docker Desktop 并完成管理员授权。"
  exit 1
fi

echo "▶ 准备 PostgreSQL 16 镜像"
if ! docker image inspect postgres:16-alpine >/dev/null 2>&1; then
  echo "  本地无镜像，尝试 Docker Hub…"
  if ! docker pull postgres:16-alpine >/dev/null 2>&1; then
    echo "  Docker Hub 不可达，改用国内镜像源（daocloud）"
    MIRROR=docker.m.daocloud.io/library/postgres:16-alpine
    docker pull "$MIRROR" >/dev/null 2>&1 || { echo "❌ 镜像拉取失败（Hub 与镜像源都不通）"; exit 1; }
    docker tag "$MIRROR" postgres:16-alpine
  fi
fi
echo "  镜像就绪"

echo "▶ 启动 PostgreSQL 16 容器（端口 $PG_PORT）"
docker rm -f "$CONTAINER" >/dev/null 2>&1
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD="$PG_PASSWORD" \
  -e POSTGRES_DB="$PG_DB" \
  -p "$PG_PORT:5432" \
  postgres:16-alpine >/dev/null || { echo "❌ 容器启动失败"; exit 1; }

echo "  等待数据库就绪…"
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -U postgres -d "$PG_DB" >/dev/null 2>&1; then
    echo "  数据库已就绪"
    break
  fi
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U postgres -d "$PG_DB" >/dev/null 2>&1 || {
  echo "❌ PostgreSQL 未能在 60 秒内就绪"; docker logs "$CONTAINER" | tail -20; exit 1; }
else
  echo "▶ 使用外部 PostgreSQL（$PG_HOST:$PG_PORT/$PG_DB）"
fi

echo "▶ 构建并启动后端（连接 Postgres）"
rm -rf "$RUN_DIR"; mkdir -p "$RUN_DIR/uploads"
( cd "$ROOT/backend" && CGO_ENABLED=1 go build -o "$RUN_DIR/neochat-server" ./cmd/api-gateway ) || exit 1

cat > "$RUN_DIR/config.yaml" <<YAML
server:
  port: $APP_PORT
  read_timeout: 30
  write_timeout: 30
  log_level: warn
  auth_rate_limit_per_minute: 1000
  message_rate_limit_per_10s: 20
  upload_rate_limit_per_minute: 10
  cors:
    allow_origins:
      - "*"
    allow_methods: [GET, POST, PUT, DELETE, OPTIONS]
    allow_headers: ["*"]
database:
  driver: postgres
  host: $PG_HOST
  port: $PG_PORT
  user: $PG_USER
  password: $PG_PASSWORD
  dbname: $PG_DB
  sslmode: disable
  max_idle_conns: 2
  max_open_conns: 5
jwt:
  secret: "postgres-e2e-secret-key-0123456789abcd"
  expiry_hour: 24
storage:
  upload_dir: ./uploads
  max_file_size: 104857600
  max_image_size: 10485760
  allowed_image_types: [image/jpeg, image/png]
  allowed_file_types: [text/plain, application/pdf]
redis:
  host: 127.0.0.1
  port: 6379
YAML

( cd "$RUN_DIR" && exec ./neochat-server >server.log 2>&1 ) &
SERVER_PID=$!

for _ in $(seq 1 30); do
  if curl -sf -m 2 "http://127.0.0.1:$APP_PORT/health/db" >/dev/null 2>&1; then
    echo "  后端已连接 Postgres"
    break
  fi
  sleep 1
done
curl -sf -m 3 "http://127.0.0.1:$APP_PORT/health" >/dev/null || {
  echo "❌ 后端未就绪"; tail -25 "$RUN_DIR/server.log"; exit 1; }

echo
echo "▶ 在 Postgres 上执行完整 E2E（27 步 HTTP + 7 步实时）"
( cd "$ROOT/client_sdk/dart" && dart run tool/e2e.dart "http://127.0.0.1:$APP_PORT" )
HTTP_RESULT=$?
( cd "$ROOT/client_sdk/dart" && dart run tool/e2e_realtime.dart "http://127.0.0.1:$APP_PORT" )
RT_RESULT=$?

echo
if [ $HTTP_RESULT -eq 0 ] && [ $RT_RESULT -eq 0 ]; then
  echo "✅ Postgres 上的 E2E 全部通过"
  exit 0
fi
echo "❌ Postgres E2E 失败（HTTP=$HTTP_RESULT 实时=$RT_RESULT）"
echo "--- 后端日志尾部 ---"; tail -30 "$RUN_DIR/server.log"
exit 1
