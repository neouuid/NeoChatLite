import 'package:flutter/material.dart';

import '../state/session.dart';

/// 发起群聊：填群名 + 勾选好友 → POST /api/v1/groups
class CreateGroupPage extends StatefulWidget {
  const CreateGroupPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<CreateGroupPage> createState() => _CreateGroupPageState();
}

class _CreateGroupPageState extends State<CreateGroupPage> {
  final _name = TextEditingController();
  final Set<String> _selected = {};
  late Future<List<Map<String, dynamic>>> _friendsFuture;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _friendsFuture = widget.session.loadFriends();
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请填写群名称')),
      );
      return;
    }

    setState(() => _submitting = true);
    final convId = await widget.session.createGroup(
      name: name,
      memberIds: _selected.toList(),
    );
    if (!mounted) return;
    setState(() => _submitting = false);

    if (convId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '建群失败')),
      );
      return;
    }
    Navigator.of(context).pop(convId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('发起群聊'),
        actions: [
          TextButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('创建'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _name,
              decoration: const InputDecoration(
                labelText: '群名称',
                border: OutlineInputBorder(),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text('选择成员', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(width: 8),
                Text(
                  '已选 ${_selected.length} 人',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const Divider(height: 12),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _friendsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('加载好友失败：${snapshot.error}'));
                }
                final friends = snapshot.data ?? const [];
                if (friends.isEmpty) {
                  return const Center(child: Text('还没有好友，先去加好友吧'));
                }
                return ListView.builder(
                  itemCount: friends.length,
                  itemBuilder: (context, index) {
                    final friend = friends[index];
                    // 好友信息可能在 friend.friend 里，也可能直接在顶层
                    final info = friend['friend'] is Map
                        ? Map<String, dynamic>.from(friend['friend'] as Map)
                        : friend;
                    final userId = (info['id'] ?? friend['friend_id'] ?? '') as String;
                    final name = (info['nickname'] ??
                            info['username'] ??
                            friend['alias'] ??
                            '用户') as String;
                    final selected = _selected.contains(userId);
                    return CheckboxListTile(
                      value: selected,
                      title: Text(name),
                      subtitle: userId.isEmpty ? null : Text(userId),
                      onChanged: userId.isEmpty
                          ? null
                          : (value) {
                              setState(() {
                                if (value == true) {
                                  _selected.add(userId);
                                } else {
                                  _selected.remove(userId);
                                }
                              });
                            },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
