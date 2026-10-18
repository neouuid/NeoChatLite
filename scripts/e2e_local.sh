#!/usr/bin/env bash
# 本地端到端验证：用 SQLite 起后端，再用生成的 Dart SDK 跑完整链路。
#
#   bash scripts/e2e_local.sh
#
# 前置：Go、Dart/Flutter 已安装。脚本不会污染现有配置：
# 运行目录默认是 ./.e2e-run（已在 .gitignore 中忽略）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="${E2E_DIR:-$ROOT/.e2e-run}"
PORT="${E2E_PORT:-18080}"
BASE_URL="http://127.0.0.1:$PORT"

echo "==> 准备运行目录: $RUN_DIR"
mkdir -p "$RUN_DIR/uploads"
rm -f "$RUN_DIR/neochat-e2e.db"

cat > "$RUN_DIR/config.yaml" <<YAML
server:
  port: $PORT
  read_timeout: 30
  write_timeout: 30
  log_level: warn
  cors:
    allow_origins:
      - "*"
    allow_methods:
      - "GET"
      - "POST"
      - "PUT"
      - "DELETE"
      - "OPTIONS"
    allow_headers:
      - "*"

database:
  driver: sqlite
  dbname: ./neochat-e2e.db
  max_idle_conns: 2
  max_open_conns: 5
  conn_max_lifetime: 300
  conn_max_idle_time: 60

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: e2e-secret-key
  expiry_hour: 24

storage:
  upload_dir: ./uploads
  max_file_size: 104857600
  max_image_size: 10485760
  allowed_image_types:
    - image/jpeg
    - image/png
  allowed_file_types:
    - image/jpeg
    - image/png
    - text/plain
YAML

echo "==> 构建后端（需要 cgo，SQLite 依赖它）"
( cd "$ROOT/backend" && CGO_ENABLED=1 go build -o "$RUN_DIR/neochat-server" ./cmd/api-gateway )

echo "==> 启动后端（端口 $PORT，SQLite 模式，无 Redis）"
# 用 exec 让 $! 就是服务进程本身，否则 kill 只能杀掉外层子 shell
( cd "$RUN_DIR" && exec ./neochat-server >server.log 2>&1 ) &
SERVER_PID=$!
cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -sf -m 2 "$BASE_URL/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
if ! curl -sf -m 2 "$BASE_URL/health" >/dev/null 2>&1; then
  echo "!! 后端启动失败，日志：" >&2
  tail -30 "$RUN_DIR/server.log" >&2 || true
  exit 1
fi
echo "    健康检查通过: $(curl -s "$BASE_URL/health")"

echo "==> 运行 Dart 端到端脚本"
( cd "$ROOT/client_sdk/dart" && dart run tool/e2e.dart "$BASE_URL" )
( cd "$ROOT/client_sdk/dart" && dart run tool/e2e_realtime.dart "$BASE_URL" )

echo "==> 完成（后端已停止）"
