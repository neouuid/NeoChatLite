import 'dart:async';

import 'package:flutter/material.dart';
import 'package:neochat_api/neochat_api.dart';

import '../state/session.dart';
import 'chat_page.dart';
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

  @override
  void initState() {
    super.initState();
    _future = widget.session.loadConversations();
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
          IconButton(
            tooltip: '退出登录',
            icon: const Icon(Icons.logout),
            onPressed: widget.session.logout,
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
