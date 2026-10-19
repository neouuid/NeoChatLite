#!/usr/bin/env bash
# 跨实例广播验证：两个后端实例共享同一数据库与同一 Redis。
# A 连实例 1、B 连实例 2，在实例 2 发消息，A 必须在实例 1 的 WebSocket 上收到。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.multi-run"
DB_FILE="$RUN_DIR/neochat-multi.db"
PORT_A=18181
PORT_B=18182
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null
  done
  sleep 1
  for pid in "${PIDS[@]:-}"; do
    [ -n "${pid:-}" ] && kill -9 "$pid" 2>/dev/null
  done
}
trap cleanup EXIT

rm -rf "$RUN_DIR"
mkdir -p "$RUN_DIR/uploads"

echo "▶ 构建后端（CGO 以启用 SQLite）"
( cd "$ROOT/backend" && CGO_ENABLED=1 go build -o "$RUN_DIR/neochat-server" ./cmd/api-gateway ) || exit 1

write_config() {
  local port="$1" file="$2"
  cat > "$file" <<YAML
server:
  port: $port
  read_timeout: 30
  write_timeout: 30
  log_level: warn
  auth_rate_limit_per_minute: 1000
  cors:
    allow_origins:
      - "*"
    allow_methods: [GET, POST, PUT, DELETE, OPTIONS]
    allow_headers: ["*"]
database:
  driver: sqlite
  dbname: $DB_FILE
jwt:
  secret: "multi-instance-secret-key-0123456789abcd"
  expiry_hour: 24
storage:
  upload_dir: $RUN_DIR/uploads
  max_file_size: 104857600
  max_image_size: 10485760
  allowed_image_types: [image/jpeg, image/png]
  allowed_file_types: [text/plain, application/pdf]
redis:
  host: 127.0.0.1
  port: 6379
YAML
}

echo "▶ 启动实例 1（端口 $PORT_A）"
mkdir -p "$RUN_DIR/a" && write_config $PORT_A "$RUN_DIR/a/config.yaml"
( cd "$RUN_DIR/a" && exec "$RUN_DIR/neochat-server" >server.log 2>&1 ) &
PIDS+=($!)
sleep 4

echo "▶ 启动实例 2（端口 $PORT_B）"
mkdir -p "$RUN_DIR/b" && write_config $PORT_B "$RUN_DIR/b/config.yaml"
( cd "$RUN_DIR/b" && exec "$RUN_DIR/neochat-server" >server.log 2>&1 ) &
PIDS+=($!)
sleep 4

for port in $PORT_A $PORT_B; do
  if ! curl -sf -m 3 "http://127.0.0.1:$port/health" >/dev/null; then
    echo "❌ 实例 $port 启动失败"; tail -20 "$RUN_DIR/a/server.log" 2>/dev/null; exit 1
  fi
done
echo "  两个实例均已就绪"

redis_ok=$(curl -sf -m 3 "http://127.0.0.1:$PORT_A/health/redis" | grep -c PONG || true)
if [ "$redis_ok" = "0" ]; then
  echo "❌ Redis 不可用，跨实例广播无法验证"
  exit 1
fi
echo "  Redis 已连接（跨实例广播依赖它）"

echo
( cd "$ROOT/client_sdk/dart" && dart run tool/e2e_multi_instance.dart \
    "http://127.0.0.1:$PORT_A" "http://127.0.0.1:$PORT_B" )
RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo "--- 实例 A 日志尾部 ---"; tail -20 "$RUN_DIR/a/server.log"
  echo "--- 实例 B 日志尾部 ---"; tail -20 "$RUN_DIR/b/server.log"
fi
exit $RESULT
