-- NeoChat 数据库回滚脚本
-- Version: 000001

-- 删除触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_friends_updated_at ON friends;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 删除表（按依赖关系倒序）
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS message_reads;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS blocklists;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS users;

-- 删除扩展
DROP EXTENSION IF EXISTS "uuid-ossp";
