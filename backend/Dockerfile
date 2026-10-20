# NeoChat 后端镜像：多阶段构建，运行镜像非 root。
#
# 基础镜像可用构建参数替换（国内可指向镜像源），见 docker-compose.yml。
ARG GO_IMAGE=golang:1.24-bookworm
ARG RUNTIME_IMAGE=debian:bookworm-slim
# 国内构建可传 GOPROXY=https://goproxy.cn,direct
ARG GOPROXY=https://proxy.golang.org,direct

FROM ${GO_IMAGE} AS builder
ARG GOPROXY
ENV GOPROXY=${GOPROXY}
WORKDIR /src

# 先只拷依赖清单，利用层缓存
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# CGO 打开以保留 SQLite 支持；纯 Postgres 部署可改为 0 以进一步瘦身
ENV CGO_ENABLED=1 GOOS=linux
RUN go build -trimpath -ldflags "-s -w" -o /out/neochat-server ./cmd/api-gateway

FROM ${RUNTIME_IMAGE}
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates tzdata curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 10001 --create-home neochat

WORKDIR /app
COPY --from=builder /out/neochat-server /app/neochat-server
RUN mkdir -p /app/uploads && chown -R neochat:neochat /app

USER neochat
ENV NEOCHAT_STORAGE_UPLOAD_DIR=/app/uploads \
    GIN_MODE=release \
    APP_ENV=production

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=25s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/app/neochat-server"]
