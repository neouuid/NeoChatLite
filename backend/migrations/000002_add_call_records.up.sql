-- NeoChat 数据库迁移脚本 - 添加通话记录表
-- Version: 000002

-- ============================================
-- 10. call_records 表 - 通话记录表
-- ============================================
CREATE TABLE IF NOT EXISTS call_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'voice')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('calling', 'in_progress', 'completed', 'missed', 'rejected', 'cancelled')),
    started_at TIMESTAMPTZ,
    answered_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- call_records 表索引
CREATE INDEX IF NOT EXISTS idx_call_records_caller_id ON call_records(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_records_callee_id ON call_records(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_records_conversation_id ON call_records(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_records_status ON call_records(status);
CREATE INDEX IF NOT EXISTS idx_call_records_created_at ON call_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_records_deleted_at ON call_records(deleted_at);

-- ============================================
-- 为 call_records 表添加更新时间触发器
-- ============================================
CREATE TRIGGER update_call_records_updated_at
    BEFORE UPDATE ON call_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
