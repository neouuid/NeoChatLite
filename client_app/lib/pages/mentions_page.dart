import 'package:flutter/material.dart';

import '../state/session.dart';
import 'chat_page.dart';

/// @提及列表：GET /api/v1/chat/mentions
class MentionsPage extends StatefulWidget {
  const MentionsPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<MentionsPage> createState() => _MentionsPageState();
}

class _MentionsPageState extends State<MentionsPage> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.loadMentions(limit: 100);
  }

  Future<void> _reload() async {
    setState(() {
      _future = widget.session.loadMentions(limit: 100);
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('@我的'),
        actions: [
          IconButton(
            tooltip: '全部标记已读',
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              final ok = await widget.session.markAllMentionsRead();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(ok ? '已全部标记已读' : '操作失败')),
              );
              if (ok) await _reload();
            },
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
                children: [ListTile(title: const Text('加载失败'), subtitle: Text('${snapshot.error}'))],
              );
            }
            final mentions = snapshot.data ?? const [];
            if (mentions.isEmpty) {
              return ListView(
                children: const [ListTile(title: Text('还没有人 @ 你'))],
              );
            }
            return ListView.separated(
              itemCount: mentions.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final mention = mentions[index];
                final message = mention['message'] is Map
                    ? Map<String, dynamic>.from(mention['message'] as Map)
                    : <String, dynamic>{};
                final convId = (message['conversation_id'] ?? '') as String;
                final content = (message['content'] ?? '') as String;
                final sender = message['sender'] is Map
                    ? Map<String, dynamic>.from(message['sender'] as Map)
                    : <String, dynamic>{};
                final senderName = (sender['nickname'] ?? sender['username'] ?? '有人') as String;
                final unread = mention['has_read'] != true;
                final createdAt = (mention['created_at'] ?? '') as String;

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: unread
                        ? Theme.of(context).colorScheme.primaryContainer
                        : null,
                    child: Text(senderName.characters.first.toUpperCase()),
                  ),
                  title: Text(content, maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    '$senderName · ${createdAt.replaceFirst('T', ' ')}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: unread ? const Badge(label: Text('未读')) : null,
                  onTap: () async {
                    if (unread) {
                      await widget.session.markMentionRead(mention['id'] as String);
                    }
                    if (!context.mounted || convId.isEmpty) return;
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatPage(
                          session: widget.session,
                          conversationId: convId,
                          title: '会话 ${convId.split('-').first}',
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
