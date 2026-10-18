import 'package:flutter/material.dart';

import '../state/session.dart';
import 'chat_page.dart';

/// 我的收藏：GET /api/v1/chat/favorites
class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.loadFavorites();
  }

  Future<void> _reload() async {
    setState(() {
      _future = widget.session.loadFavorites();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('收藏')),
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
            final favorites = snapshot.data ?? const [];
            if (favorites.isEmpty) {
              return ListView(
                children: const [ListTile(title: Text('还没有收藏'), subtitle: Text('长按聊天消息即可收藏'))],
              );
            }
            return ListView.separated(
              itemCount: favorites.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final favorite = favorites[index];
                final message = favorite['message'] is Map
                    ? Map<String, dynamic>.from(favorite['message'] as Map)
                    : <String, dynamic>{};
                final convId = (message['conversation_id'] ?? '') as String;
                final content = (message['content'] ?? '') as String;
                final note = (favorite['note'] ?? '') as String;

                return Dismissible(
                  key: ValueKey(favorite['id'] as String? ?? '$index'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: const Icon(Icons.delete_outline),
                  ),
                  onDismissed: (_) async {
                    await widget.session.removeFavorite(favorite['id'] as String);
                    // ignore: use_build_context_synchronously
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('已取消收藏')),
                    );
                    await _reload();
                  },
                  child: ListTile(
                    leading: const Icon(Icons.star),
                    title: Text(content, maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: Text(
                      note.isNotEmpty ? note : '会话 ${convId.split('-').first}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: convId.isEmpty
                        ? null
                        : () {
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
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
