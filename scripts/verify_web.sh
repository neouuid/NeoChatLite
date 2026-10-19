#!/usr/bin/env bash
# Web 端真实验证（分三步，符合「服务先起、检查另起进程」的可用顺序）
#
#   bash scripts/verify_web.sh start   # 构建 + 起后端 + 托管产物 + 起 headless Chrome
#   bash scripts/verify_web.sh check   # 用 CDP 驱动 Chrome：验证启动 + 浏览器侧 API 全链路
#   bash scripts/verify_web.sh stop    # 清理
#
# 为什么要分步：headless Chrome 的 CDP 连接在「与启动它的同一 shell 进程内立刻使用」
# 时偶发无响应；分两个进程调用则稳定复现通过。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.web-verify"
PID_FILE="$RUN_DIR/pids"
APP_PORT=18091
API_PORT=18090
CDP_PORT=9222
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

stop_all() {
  if [ -f "$PID_FILE" ]; then
    while read -r pid; do
      [ -n "$pid" ] && kill "$pid" 2>/dev/null
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  pkill -f "remote-debugging-port=$CDP_PORT" 2>/dev/null
  pkill -f "http.server $APP_PORT" 2>/dev/null
  sleep 1
}

start() {
  stop_all
  rm -rf "$RUN_DIR"; mkdir -p "$RUN_DIR/uploads" "$RUN_DIR/chrome-profile"; : > "$PID_FILE"

  echo "▶ 构建 Web 产物"
  ( cd "$ROOT/client_app" && flutter build web --release ) >/dev/null 2>&1 || {
    echo "❌ Web 构建失败"; exit 1; }

  echo "▶ 构建并启动后端（端口 $API_PORT）"
  ( cd "$ROOT/backend" && CGO_ENABLED=1 go build -o "$RUN_DIR/neochat-server" ./cmd/api-gateway ) || exit 1
  cat > "$RUN_DIR/config.yaml" <<YAML
server:
  port: $API_PORT
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
  dbname: ./web-verify.db
jwt:
  secret: "web-verify-secret-key-0123456789abcdef"
  expiry_hour: 24
storage:
  upload_dir: ./uploads
  max_file_size: 104857600
  max_image_size: 10485760
  allowed_image_types: [image/jpeg, image/png]
  allowed_file_types: [text/plain, application/pdf]
YAML
  ( cd "$RUN_DIR" && exec ./neochat-server >server.log 2>&1 ) &
  echo $! >> "$PID_FILE"

  echo "▶ 托管 Web 产物（端口 $APP_PORT）"
  ( cd "$ROOT/client_app/build/web" && exec python3 -m http.server $APP_PORT >/dev/null 2>&1 ) &
  echo $! >> "$PID_FILE"

  echo "▶ 启动 headless Chrome（调试端口 $CDP_PORT）"
  # 注意：不要用 nohup/disown 或 --remote-allow-origins。
  # 实测这两种改动会让本机 headless Chrome 的 CDP 握手后无响应；
  # 普通后台启动 + 另一个进程执行 check 才稳定。
  "$CHROME" --headless=new --disable-gpu --no-first-run \
    --remote-debugging-port=$CDP_PORT \
    --user-data-dir="$RUN_DIR/chrome-profile" about:blank >/dev/null 2>&1 &
  echo $! >> "$PID_FILE"

  for _ in $(seq 1 20); do
    if curl -sf -m 2 "http://127.0.0.1:$API_PORT/health" >/dev/null \
      && curl -sf -m 2 "http://127.0.0.1:$APP_PORT/main.dart.js" >/dev/null \
      && curl -sf -m 2 "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null; then
      echo "  服务已就绪：后端 $API_PORT / 静态 $APP_PORT / CDP $CDP_PORT"
      echo
      echo "下一步：bash scripts/verify_web.sh check"
      return 0
    fi
    sleep 1
  done
  echo "❌ 服务未能在 20 秒内就绪"
  exit 1
}

check() {
  curl -sf -m 3 "http://127.0.0.1:$API_PORT/health" >/dev/null || { echo "❌ 后端未运行，先执行 start"; exit 1; }
  WEB_APP_URL="http://127.0.0.1:$APP_PORT/" \
  WEB_API_URL="http://127.0.0.1:$API_PORT" \
  CHROME_DEVTOOLS="http://127.0.0.1:$CDP_PORT" \
    python3 "$ROOT/scripts/web_verify.py"
}

case "${1:-}" in
  start) start ;;
  check) check ;;
  stop) stop_all; echo "已清理" ;;
  *) echo "用法: $0 {start|check|stop}"; exit 2 ;;
esac
