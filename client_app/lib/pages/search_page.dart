import 'package:flutter/material.dart';

import '../state/session.dart';
import 'chat_page.dart';

/// 消息搜索：GET /api/v1/chat/search/messages?q=
class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _query = TextEditingController();
  List<Map<String, dynamic>> _results = const [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _query.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await widget.session.searchMessages(q);
      if (!mounted) return;
      setState(() => _results = results);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _query,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: '搜索聊天记录…',
            border: InputBorder.none,
          ),
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _search(),
        ),
        actions: [
          IconButton(
            tooltip: '搜索',
            icon: const Icon(Icons.search),
            onPressed: _search,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('搜索失败：$_error'))
              : _results.isEmpty
                  ? const Center(child: Text('输入关键词搜索聊天记录'))
                  : ListView.separated(
                      itemCount: _results.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final msg = _results[index];
                        final convId = msg['conversation_id'] as String? ?? '';
                        final content = msg['content'] as String? ?? '';
                        final createdAt = msg['created_at'] as String? ?? '';
                        return ListTile(
                          leading: const Icon(Icons.chat_bubble_outline),
                          title: Text(content, maxLines: 2, overflow: TextOverflow.ellipsis),
                          subtitle: Text(
                            '会话 ${convId.split('-').first} · ${createdAt.replaceFirst('T', ' ')}',
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
                        );
                      },
                    ),
    );
  }
}
