-- +goose Up
-- 消息幂等键：客户端重试时携带同一个 client_msg_id，服务端据此去重
-- +goose StatementBegin
ALTER TABLE messages ADD COLUMN client_msg_id varchar(64);
CREATE UNIQUE INDEX idx_msg_client_id_unique ON messages (conversation_id, client_msg_id)
    WHERE client_msg_id IS NOT NULL AND client_msg_id <> '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_msg_client_id_unique;
-- 旧版 SQLite 不支持 DROP COLUMN，回滚留空（重建即可）
SELECT 1;
-- +goose StatementEnd
