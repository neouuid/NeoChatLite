#!/usr/bin/env bash
# 用 Docker 管理本项目的 Redis（替代 brew 安装的 redis）
#
#   bash scripts/redis_docker.sh start    # 启动容器（幂等）
#   bash scripts/redis_docker.sh stop     # 停止容器
#   bash scripts/redis_docker.sh status   # 查看状态与 PING
#   bash scripts/redis_docker.sh logs     # 跟踪日志
#
# 端口固定 6379（项目默认配置就是 127.0.0.1:6379），开启 AOF 持久化，
# 数据放在命名卷 neochat-redis-data 里，容器重启不丢。
set -uo pipefail

CONTAINER=neochat-redis
IMAGE=redis:7-alpine
VOLUME=neochat-redis-data
PORT=6379
MIRROR=docker.m.daocloud.io/library/$IMAGE

ensure_image() {
  docker image inspect "$IMAGE" >/dev/null 2>&1 && return 0
  echo "本地无 $IMAGE，尝试 Docker Hub…"
  if docker pull "$IMAGE" >/dev/null 2>&1; then return 0; fi
  echo "Docker Hub 不可达，改用镜像源 $MIRROR"
  docker pull "$MIRROR" >/dev/null 2>&1 || { echo "❌ 镜像拉取失败"; return 1; }
  docker tag "$MIRROR" "$IMAGE"
}

case "${1:-start}" in
  start)
    if ! docker info >/dev/null 2>&1; then
      echo "❌ Docker daemon 不可用，请先启动 Docker Desktop"; exit 1
    fi
    if docker ps --filter "name=^${CONTAINER}$" --format '{{.Names}}' | grep -q .; then
      echo "容器已在运行"; exit 0
    fi
    ensure_image || exit 1
    docker rm -f "$CONTAINER" >/dev/null 2>&1
    docker run -d --name "$CONTAINER" \
      -p "${PORT}:6379" \
      --restart unless-stopped \
      -v "${VOLUME}:/data" \
      "$IMAGE" redis-server --appendonly yes >/dev/null || exit 1
    for _ in $(seq 1 20); do
      docker exec "$CONTAINER" redis-cli ping >/dev/null 2>&1 && break
      sleep 1
    done
    echo "✅ Redis 已启动: $(docker exec "$CONTAINER" redis-cli ping 2>/dev/null)"
    ;;
  stop)
    docker stop "$CONTAINER" >/dev/null 2>&1 && echo "已停止" || echo "容器未运行"
    ;;
  status)
    docker ps -a --filter "name=^${CONTAINER}$" \
      --format '{{.Names}}  {{.Status}}  {{.Ports}}' || true
    docker exec "$CONTAINER" redis-cli ping 2>/dev/null || echo "（PING 失败）"
    ;;
  logs)
    docker logs -f "$CONTAINER"
    ;;
  *)
    echo "用法: $0 {start|stop|status|logs}"; exit 2
    ;;
esac
