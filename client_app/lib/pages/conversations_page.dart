import 'dart:async';

import 'package:flutter/material.dart';
import 'package:neochat_api/neochat_api.dart';

import '../state/session.dart';
import 'chat_page.dart';
import 'contacts_page.dart';
import 'profile_page.dart';
import 'create_group_page.dart';
import 'favorites_page.dart';
import 'mentions_page.dart';
import 'search_page.dart';

/// 会话列表：GET /api/v1/chat/conversations
class ConversationsPage extends StatefulWidget {
  const ConversationsPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<ConversationsPage> createState() => _ConversationsPageState();
}

class _ConversationsPageState extends State<ConversationsPage> {
  late Future<List<Map<String, dynamic>>> _future;
  StreamSubscription<RealtimeEvent>? _realtimeSub;
  final Map<String, bool> _online = {};
  int _unreadMentions = 0;

  @override
  void initState() {
    super.initState();
    _future = widget.session.loadConversations();
    _loadUnreadMentions();
    // 实时事件：新消息刷新列表；在线状态更新头像上的小圆点
    _realtimeSub = widget.session.realtimeEvents?.listen((event) {
      if (event.type == 'new_message') {
        _reload();
        return;
      }
      if (event.type == 'online_status') {
        final data = event.data;
        if (data is Map && data['user_id'] is String) {
          setState(() {
            _online[data['user_id'] as String] = data['online'] == true;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _future = widget.session.loadConversations();
    });
    await _future;
  }

  /// 当前用户在该会话的未读数（服务端把 unread_count 挂在 members 上）
  int _myUnread(Map<String, dynamic> conv) {
    final me = widget.session.userId;
    final members = (conv['members'] as List?) ?? const [];
    for (final member in members.whereType<Map>()) {
      if (member['user_id'] == me) {
        final count = member['unread_count'];
        return count is int ? count : 0;
      }
    }
    return 0;
  }

  Future<void> _loadUnreadMentions() async {
    try {
      final count = await widget.session.unreadMentionCount();
      if (!mounted) return;
      setState(() => _unreadMentions = count);
    } catch (_) {
      // 忽略：未读数不影响主流程
    }
  }

  /// 单聊会话里对方的 user_id（群聊返回 null）
  String? _peerUserId(Map<String, dynamic> conv) {
    final me = widget.session.userId;
    final members = (conv['members'] as List?) ?? const [];
    for (final member in members.whereType<Map>()) {
      final userId = member['user_id'];
      if (userId is String && userId != me) return userId;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('会话'),
        actions: [
          IconButton(
            tooltip: '搜索聊天记录',
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => SearchPage(session: widget.session),
                ),
              );
            },
          ),
          IconButton(
            tooltip: '同步离线消息',
            icon: const Icon(Icons.cloud_sync_outlined),
            onPressed: () async {
              final count = await widget.session.syncOfflineMessages();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('补到 $count 条离线消息')),
              );
            },
          ),
          PopupMenuButton<String>(
            tooltip: '更多',
            onSelected: (value) async {
              switch (value) {
                case 'mentions':
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => MentionsPage(session: widget.session),
                    ),
                  );
                  _loadUnreadMentions();
                case 'profile':
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ProfilePage(session: widget.session),
                    ),
                  );
                case 'contacts':
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ContactsPage(session: widget.session),
                    ),
                  );
                  await _reload();
                case 'createGroup':
                  final convId = await Navigator.of(context).push<String>(
                    MaterialPageRoute(
                      builder: (_) => CreateGroupPage(session: widget.session),
                    ),
                  );
                  if (convId != null) {
                    await _reload();
                  }
                case 'favorites':
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => FavoritesPage(session: widget.session),
                    ),
                  );
                case 'logout':
                  widget.session.logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'mentions',
                child: Row(
                  children: [
                    const Icon(Icons.alternate_email),
                    const SizedBox(width: 12),
                    const Text('@我的'),
                    if (_unreadMentions > 0) ...[
                      const SizedBox(width: 8),
                      Badge(label: Text('$_unreadMentions')),
                    ],
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person_outline),
                    SizedBox(width: 12),
                    Text('我的资料'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'contacts',
                child: Row(
                  children: [
                    Icon(Icons.people_outline),
                    SizedBox(width: 12),
                    Text('通讯录'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'createGroup',
                child: Row(
                  children: [
                    Icon(Icons.group_add_outlined),
                    SizedBox(width: 12),
                    Text('发起群聊'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'favorites',
                child: Row(
                  children: [
                    Icon(Icons.star_outline),
                    SizedBox(width: 12),
                    Text('收藏'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 12),
                    Text('退出登录'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  ListTile(
                    title: const Text('加载失败'),
                    subtitle: Text('${snapshot.error}'),
                  ),
                ],
              );
            }
            final conversations = snapshot.data ?? const [];
            if (conversations.isEmpty) {
              return ListView(
                children: const [
                  ListTile(title: Text('还没有会话'), subtitle: Text('下拉刷新试试')),
                ],
              );
            }
            return ListView.separated(
              itemCount: conversations.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final conv = conversations[index];
                final id = '${conv['id'] ?? ''}';
                final title = (conv['name'] as String?)?.isNotEmpty == true
                    ? conv['name'] as String
                    : '会话 ${id.split('-').first}';
                final subtitle = conv['last_message'] as String? ?? '';
                final peerId = _peerUserId(conv);
                final peerOnline = peerId != null && (_online[peerId] ?? false);
                final unread = _myUnread(conv);
                return ListTile(
                  leading: Badge(
                    isLabelVisible: peerOnline,
                    smallSize: 10,
                    backgroundColor: Colors.green,
                    child: CircleAvatar(
                      child: Text(title.characters.first.toUpperCase()),
                    ),
                  ),
                  title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: unread > 0
                      ? Badge(label: Text('$unread'))
                      : null,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatPage(
                          session: widget.session,
                          conversationId: id,
                          title: title,
                          isGroup: conv['type'] == 'group',
                        ),
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
