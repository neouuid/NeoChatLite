import 'package:flutter/material.dart';

import '../state/session.dart';
import 'chat_page.dart';

/// 会话列表：GET /api/v1/chat/conversations
class ConversationsPage extends StatefulWidget {
  const ConversationsPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<ConversationsPage> createState() => _ConversationsPageState();
}

class _ConversationsPageState extends State<ConversationsPage> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.loadConversations();
  }

  Future<void> _reload() async {
    setState(() {
      _future = widget.session.loadConversations();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('会话'),
        actions: [
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
                final unread = conv['unread_count'];
                return ListTile(
                  leading: CircleAvatar(
                    child: Text(title.characters.first.toUpperCase()),
                  ),
                  title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: (unread is int && unread > 0)
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
