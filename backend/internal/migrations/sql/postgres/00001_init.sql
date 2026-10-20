-- +goose Up
-- 基线 schema：与 AutoMigrate 生成的结构一致（PostgreSQL）
-- +goose StatementBegin
CREATE TABLE public.blocklists (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    blocked_id uuid NOT NULL,
    reason character varying(200),
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.call_records (
    id uuid NOT NULL,
    caller_id uuid NOT NULL,
    callee_id uuid NOT NULL,
    conversation_id uuid,
    type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    started_at timestamp with time zone,
    answered_at timestamp with time zone,
    ended_at timestamp with time zone,
    duration bigint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.conversation_members (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    nickname character varying(50),
    last_read_at timestamp with time zone,
    unread_count bigint DEFAULT 0,
    muted boolean DEFAULT false,
    pinned boolean DEFAULT false,
    pinned_at timestamp with time zone,
    joined_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.conversations (
    id uuid NOT NULL,
    type character varying(20) NOT NULL,
    name character varying(100),
    avatar character varying(500),
    last_message text,
    last_msg_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.devices (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    type character varying(50),
    ip_address character varying(50),
    user_agent character varying(255),
    last_active timestamp with time zone,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.favorites (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    message_id uuid NOT NULL,
    note character varying(500),
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.friends (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    alias character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.groups (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    avatar character varying(500),
    owner_id uuid NOT NULL,
    max_members bigint DEFAULT 500,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.login_histories (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(20),
    ip_address character varying(50),
    user_agent character varying(255),
    location character varying(100),
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.mentions (
    id uuid NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    has_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone
);
CREATE TABLE public.message_reads (
    id uuid NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp with time zone
);
CREATE TABLE public.messages (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    type character varying(20) DEFAULT 'text'::character varying,
    content text,
    media_url character varying(500),
    file_name character varying(255),
    file_size bigint,
    reply_to_id uuid,
    is_edited boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone
);
CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100),
    phone character varying(20),
    password character varying(255) NOT NULL,
    nickname character varying(50),
    avatar character varying(500),
    bio character varying(500),
    status character varying(20) DEFAULT 'online'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.verification_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);
ALTER TABLE ONLY public.blocklists
    ADD CONSTRAINT blocklists_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT call_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.login_histories
    ADD CONSTRAINT login_histories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT mentions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);
CREATE INDEX idx_blocklists_blocked_id ON public.blocklists USING btree (blocked_id);
CREATE INDEX idx_blocklists_deleted_at ON public.blocklists USING btree (deleted_at);
CREATE INDEX idx_blocklists_user_id ON public.blocklists USING btree (user_id);
CREATE INDEX idx_call_callee_id ON public.call_records USING btree (callee_id);
CREATE INDEX idx_call_caller_id ON public.call_records USING btree (caller_id);
CREATE INDEX idx_call_conv_id ON public.call_records USING btree (conversation_id);
CREATE INDEX idx_call_created_at ON public.call_records USING btree (created_at);
CREATE INDEX idx_call_deleted_at ON public.call_records USING btree (deleted_at);
CREATE INDEX idx_call_status ON public.call_records USING btree (status);
CREATE INDEX idx_call_type ON public.call_records USING btree (type);
CREATE INDEX idx_conv_created_at ON public.conversations USING btree (created_at);
CREATE INDEX idx_conv_created_by ON public.conversations USING btree (created_by);
CREATE INDEX idx_conv_deleted_at ON public.conversations USING btree (deleted_at);
CREATE INDEX idx_conv_last_msg_at ON public.conversations USING btree (last_msg_at);
CREATE INDEX idx_conv_type ON public.conversations USING btree (type);
CREATE INDEX idx_conv_updated_at ON public.conversations USING btree (updated_at);
CREATE INDEX idx_device_deleted_at ON public.devices USING btree (deleted_at);
CREATE INDEX idx_device_last_active ON public.devices USING btree (last_active);
CREATE INDEX idx_device_user_id ON public.devices USING btree (user_id);
CREATE INDEX idx_fav_created_at ON public.favorites USING btree (created_at);
CREATE INDEX idx_fav_deleted_at ON public.favorites USING btree (deleted_at);
CREATE INDEX idx_fav_msg_id ON public.favorites USING btree (message_id);
CREATE INDEX idx_fav_user_id ON public.favorites USING btree (user_id);
CREATE INDEX idx_friend_created_at ON public.friends USING btree (created_at);
CREATE INDEX idx_friend_deleted_at ON public.friends USING btree (deleted_at);
CREATE INDEX idx_friend_friend_id ON public.friends USING btree (friend_id);
CREATE INDEX idx_friend_status ON public.friends USING btree (status);
CREATE INDEX idx_friend_user_id ON public.friends USING btree (user_id);
CREATE INDEX idx_group_created_at ON public.groups USING btree (created_at);
CREATE INDEX idx_group_deleted_at ON public.groups USING btree (deleted_at);
CREATE INDEX idx_group_name ON public.groups USING btree (name);
CREATE INDEX idx_group_owner ON public.groups USING btree (owner_id);
CREATE INDEX idx_login_created_at ON public.login_histories USING btree (created_at);
CREATE INDEX idx_login_deleted_at ON public.login_histories USING btree (deleted_at);
CREATE INDEX idx_login_user_id ON public.login_histories USING btree (user_id);
CREATE INDEX idx_member_conv_id ON public.conversation_members USING btree (conversation_id);
CREATE INDEX idx_member_deleted_at ON public.conversation_members USING btree (deleted_at);
CREATE INDEX idx_member_joined_at ON public.conversation_members USING btree (joined_at);
CREATE INDEX idx_member_last_read ON public.conversation_members USING btree (last_read_at);
CREATE INDEX idx_member_pinned ON public.conversation_members USING btree (pinned);
CREATE INDEX idx_member_role ON public.conversation_members USING btree (role);
CREATE INDEX idx_member_unread ON public.conversation_members USING btree (unread_count);
CREATE INDEX idx_member_user_id ON public.conversation_members USING btree (user_id);
CREATE INDEX idx_mention_created_at ON public.mentions USING btree (created_at);
CREATE INDEX idx_mention_msg_id ON public.mentions USING btree (message_id);
CREATE INDEX idx_mention_read_at ON public.mentions USING btree (read_at);
CREATE INDEX idx_mention_unread ON public.mentions USING btree (has_read);
CREATE INDEX idx_mention_user_id ON public.mentions USING btree (user_id);
CREATE INDEX idx_msg_conv_id ON public.messages USING btree (conversation_id);
CREATE INDEX idx_msg_created_at ON public.messages USING btree (created_at);
CREATE INDEX idx_msg_deleted_at ON public.messages USING btree (deleted_at);
CREATE INDEX idx_msg_reply_to ON public.messages USING btree (reply_to_id);
CREATE INDEX idx_msg_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX idx_msg_type ON public.messages USING btree (type);
CREATE INDEX idx_read_at ON public.message_reads USING btree (read_at);
CREATE INDEX idx_read_msg_id ON public.message_reads USING btree (message_id);
CREATE INDEX idx_read_user_id ON public.message_reads USING btree (user_id);
CREATE INDEX idx_refresh_expires ON public.refresh_tokens USING btree (expires_at);
CREATE UNIQUE INDEX idx_refresh_hash ON public.refresh_tokens USING btree (token_hash);
CREATE INDEX idx_refresh_user ON public.refresh_tokens USING btree (user_id);
CREATE INDEX idx_token_created_at ON public.verification_tokens USING btree (created_at);
CREATE INDEX idx_token_deleted_at ON public.verification_tokens USING btree (deleted_at);
CREATE INDEX idx_token_expires ON public.verification_tokens USING btree (expires_at);
CREATE INDEX idx_token_type ON public.verification_tokens USING btree (type);
CREATE UNIQUE INDEX idx_token_unique ON public.verification_tokens USING btree (token);
CREATE INDEX idx_token_user_id ON public.verification_tokens USING btree (user_id);
CREATE INDEX idx_user_created_at ON public.users USING btree (created_at);
CREATE INDEX idx_user_deleted_at ON public.users USING btree (deleted_at);
CREATE UNIQUE INDEX idx_user_email ON public.users USING btree (email);
CREATE INDEX idx_user_nickname ON public.users USING btree (nickname);
CREATE UNIQUE INDEX idx_user_phone ON public.users USING btree (phone);
CREATE INDEX idx_user_status ON public.users USING btree (status);
CREATE UNIQUE INDEX idx_user_username ON public.users USING btree (username);
ALTER TABLE ONLY public.blocklists
    ADD CONSTRAINT fk_blocklists_blocked FOREIGN KEY (blocked_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT fk_call_records_callee FOREIGN KEY (callee_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT fk_call_records_caller FOREIGN KEY (caller_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT fk_conversation_members_user FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT fk_conversations_members FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);
ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_favorites_message FOREIGN KEY (message_id) REFERENCES public.messages(id);
ALTER TABLE ONLY public.friends
    ADD CONSTRAINT fk_friends_friend FOREIGN KEY (friend_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.friends
    ADD CONSTRAINT fk_friends_user FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT fk_mentions_user FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT fk_messages_mentions FOREIGN KEY (message_id) REFERENCES public.messages(id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_reply_to FOREIGN KEY (reply_to_id) REFERENCES public.messages(id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES public.users(id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 1;
-- +goose StatementEnd
