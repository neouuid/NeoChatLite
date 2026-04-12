-- NeoChat 数据库回滚脚本 - 删除通话记录表
-- Version: 000002

-- 删除触发器
DROP TRIGGER IF EXISTS update_call_records_updated_at ON call_records;

-- 删除 call_records 表
DROP TABLE IF EXISTS call_records;
