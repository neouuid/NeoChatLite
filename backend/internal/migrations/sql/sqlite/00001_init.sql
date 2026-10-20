-- +goose Up
-- 基线 schema：与 AutoMigrate 生成的结构一致（SQLite）
-- +goose StatementBegin
CREATE TABLE `users` (`id` uuid,`username` varchar(50) NOT NULL,`email` varchar(100),`phone` varchar(20),`password` varchar(255) NOT NULL,`nickname` varchar(50),`avatar` varchar(500),`bio` varchar(500),`status` varchar(20) DEFAULT "online",`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE UNIQUE INDEX `idx_user_phone` ON `users`(`phone`);
CREATE UNIQUE INDEX `idx_user_email` ON `users`(`email`);
CREATE UNIQUE INDEX `idx_user_username` ON `users`(`username`);
CREATE INDEX `idx_user_deleted_at` ON `users`(`deleted_at`);
CREATE INDEX `idx_user_created_at` ON `users`(`created_at`);
CREATE INDEX `idx_user_status` ON `users`(`status`);
CREATE INDEX `idx_user_nickname` ON `users`(`nickname`);
CREATE TABLE `friends` (`id` uuid,`user_id` uuid NOT NULL,`friend_id` uuid NOT NULL,`alias` varchar(50),`status` varchar(20) DEFAULT "pending",`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_friends_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_friends_friend` FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`));
CREATE INDEX `idx_friend_deleted_at` ON `friends`(`deleted_at`);
CREATE INDEX `idx_friend_created_at` ON `friends`(`created_at`);
CREATE INDEX `idx_friend_status` ON `friends`(`status`);
CREATE INDEX `idx_friend_friend_id` ON `friends`(`friend_id`);
CREATE INDEX `idx_friend_user_id` ON `friends`(`user_id`);
CREATE TABLE `blocklists` (`id` uuid,`user_id` uuid NOT NULL,`blocked_id` uuid NOT NULL,`reason` varchar(200),`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_blocklists_blocked` FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`));
CREATE INDEX `idx_blocklists_deleted_at` ON `blocklists`(`deleted_at`);
CREATE INDEX `idx_blocklists_blocked_id` ON `blocklists`(`blocked_id`);
CREATE INDEX `idx_blocklists_user_id` ON `blocklists`(`user_id`);
CREATE TABLE `verification_tokens` (`id` uuid,`user_id` uuid NOT NULL,`token` varchar(255) NOT NULL,`type` varchar(50) NOT NULL,`expires_at` datetime NOT NULL,`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_token_created_at` ON `verification_tokens`(`created_at`);
CREATE INDEX `idx_token_expires` ON `verification_tokens`(`expires_at`);
CREATE INDEX `idx_token_type` ON `verification_tokens`(`type`);
CREATE UNIQUE INDEX `idx_token_unique` ON `verification_tokens`(`token`);
CREATE INDEX `idx_token_user_id` ON `verification_tokens`(`user_id`);
CREATE INDEX `idx_token_deleted_at` ON `verification_tokens`(`deleted_at`);
CREATE TABLE `refresh_tokens` (`id` uuid,`user_id` uuid NOT NULL,`token_hash` varchar(64) NOT NULL,`expires_at` datetime,`revoked_at` datetime,`created_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_refresh_expires` ON `refresh_tokens`(`expires_at`);
CREATE UNIQUE INDEX `idx_refresh_hash` ON `refresh_tokens`(`token_hash`);
CREATE INDEX `idx_refresh_user` ON `refresh_tokens`(`user_id`);
CREATE TABLE `devices` (`id` uuid,`user_id` uuid NOT NULL,`name` varchar(100),`type` varchar(50),`ip_address` varchar(50),`user_agent` varchar(255),`last_active` datetime,`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_device_deleted_at` ON `devices`(`deleted_at`);
CREATE INDEX `idx_device_last_active` ON `devices`(`last_active`);
CREATE INDEX `idx_device_user_id` ON `devices`(`user_id`);
CREATE TABLE `login_histories` (`id` uuid,`user_id` uuid NOT NULL,`type` varchar(20),`ip_address` varchar(50),`user_agent` varchar(255),`location` varchar(100),`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_login_deleted_at` ON `login_histories`(`deleted_at`);
CREATE INDEX `idx_login_created_at` ON `login_histories`(`created_at`);
CREATE INDEX `idx_login_user_id` ON `login_histories`(`user_id`);
CREATE TABLE `conversations` (`id` uuid,`type` varchar(20) NOT NULL,`name` varchar(100),`avatar` varchar(500),`last_message` text,`last_msg_at` datetime,`created_by` uuid,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_conv_last_msg_at` ON `conversations`(`last_msg_at`);
CREATE INDEX `idx_conv_type` ON `conversations`(`type`);
CREATE INDEX `idx_conv_deleted_at` ON `conversations`(`deleted_at`);
CREATE INDEX `idx_conv_updated_at` ON `conversations`(`updated_at`);
CREATE INDEX `idx_conv_created_at` ON `conversations`(`created_at`);
CREATE INDEX `idx_conv_created_by` ON `conversations`(`created_by`);
CREATE TABLE `conversation_members` (`id` uuid,`conversation_id` uuid NOT NULL,`user_id` uuid NOT NULL,`role` varchar(20) DEFAULT "member",`nickname` varchar(50),`last_read_at` datetime,`unread_count` integer DEFAULT 0,`muted` numeric DEFAULT false,`pinned` numeric DEFAULT false,`pinned_at` datetime,`joined_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_conversation_members_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_conversations_members` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`));
CREATE INDEX `idx_member_user_id` ON `conversation_members`(`user_id`);
CREATE INDEX `idx_member_conv_id` ON `conversation_members`(`conversation_id`);
CREATE INDEX `idx_member_deleted_at` ON `conversation_members`(`deleted_at`);
CREATE INDEX `idx_member_joined_at` ON `conversation_members`(`joined_at`);
CREATE INDEX `idx_member_pinned` ON `conversation_members`(`pinned`);
CREATE INDEX `idx_member_unread` ON `conversation_members`(`unread_count`);
CREATE INDEX `idx_member_last_read` ON `conversation_members`(`last_read_at`);
CREATE INDEX `idx_member_role` ON `conversation_members`(`role`);
CREATE TABLE `messages` (`id` uuid,`conversation_id` uuid NOT NULL,`sender_id` uuid NOT NULL,`type` varchar(20) DEFAULT "text",`content` text,`media_url` varchar(500),`file_name` varchar(255),`file_size` integer,`reply_to_id` uuid,`is_edited` numeric DEFAULT false,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_messages_reply_to` FOREIGN KEY (`reply_to_id`) REFERENCES `messages`(`id`));
CREATE INDEX `idx_msg_created_at` ON `messages`(`created_at`);
CREATE INDEX `idx_msg_reply_to` ON `messages`(`reply_to_id`);
CREATE INDEX `idx_msg_type` ON `messages`(`type`);
CREATE INDEX `idx_msg_sender_id` ON `messages`(`sender_id`);
CREATE INDEX `idx_msg_conv_id` ON `messages`(`conversation_id`);
CREATE INDEX `idx_msg_deleted_at` ON `messages`(`deleted_at`);
CREATE TABLE `message_reads` (`id` uuid,`message_id` uuid NOT NULL,`user_id` uuid NOT NULL,`read_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_read_at` ON `message_reads`(`read_at`);
CREATE INDEX `idx_read_user_id` ON `message_reads`(`user_id`);
CREATE INDEX `idx_read_msg_id` ON `message_reads`(`message_id`);
CREATE TABLE `groups` (`id` uuid,`name` varchar(100) NOT NULL,`description` varchar(500),`avatar` varchar(500),`owner_id` uuid NOT NULL,`max_members` integer DEFAULT 500,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE INDEX `idx_group_owner` ON `groups`(`owner_id`);
CREATE INDEX `idx_group_name` ON `groups`(`name`);
CREATE INDEX `idx_group_deleted_at` ON `groups`(`deleted_at`);
CREATE INDEX `idx_group_created_at` ON `groups`(`created_at`);
CREATE TABLE `favorites` (`id` uuid,`user_id` uuid NOT NULL,`message_id` uuid NOT NULL,`note` varchar(500),`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_favorites_message` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`));
CREATE INDEX `idx_fav_deleted_at` ON `favorites`(`deleted_at`);
CREATE INDEX `idx_fav_created_at` ON `favorites`(`created_at`);
CREATE INDEX `idx_fav_msg_id` ON `favorites`(`message_id`);
CREATE INDEX `idx_fav_user_id` ON `favorites`(`user_id`);
CREATE TABLE `call_records` (`id` uuid,`caller_id` uuid NOT NULL,`callee_id` uuid NOT NULL,`conversation_id` uuid,`type` varchar(20) NOT NULL,`status` varchar(20) NOT NULL,`started_at` datetime,`answered_at` datetime,`ended_at` datetime,`duration` integer,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_call_records_caller` FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_call_records_callee` FOREIGN KEY (`callee_id`) REFERENCES `users`(`id`));
CREATE INDEX `idx_call_created_at` ON `call_records`(`created_at`);
CREATE INDEX `idx_call_status` ON `call_records`(`status`);
CREATE INDEX `idx_call_type` ON `call_records`(`type`);
CREATE INDEX `idx_call_conv_id` ON `call_records`(`conversation_id`);
CREATE INDEX `idx_call_callee_id` ON `call_records`(`callee_id`);
CREATE INDEX `idx_call_caller_id` ON `call_records`(`caller_id`);
CREATE INDEX `idx_call_deleted_at` ON `call_records`(`deleted_at`);
CREATE TABLE `mentions` (`id` uuid,`message_id` uuid NOT NULL,`user_id` uuid NOT NULL,`has_read` numeric DEFAULT false,`read_at` datetime,`created_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_messages_mentions` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`),CONSTRAINT `fk_mentions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`));
CREATE INDEX `idx_mention_created_at` ON `mentions`(`created_at`);
CREATE INDEX `idx_mention_read_at` ON `mentions`(`read_at`);
CREATE INDEX `idx_mention_unread` ON `mentions`(`has_read`);
CREATE INDEX `idx_mention_user_id` ON `mentions`(`user_id`);
CREATE INDEX `idx_mention_msg_id` ON `mentions`(`message_id`);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- 基线不做回滚（重建即可）
SELECT 1;
-- +goose StatementEnd
