import 'package:flutter/material.dart';

import '../state/session.dart';

/// 通讯录：好友 / 待处理请求 / 黑名单
class ContactsPage extends StatefulWidget {
  const ContactsPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<ContactsPage> createState() => _ContactsPageState();
}

class _ContactsPageState extends State<ContactsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  late Future<List<Map<String, dynamic>>> _friends;
  late Future<List<Map<String, dynamic>>> _requests;
  late Future<List<Map<String, dynamic>>> _blocklist;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() {
      _friends = widget.session.loadFriends();
      _requests = widget.session.loadFriendRequests();
      _blocklist = widget.session.loadBlocklist();
    });
  }

  Future<void> _addFriend() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddFriendPage(session: widget.session),
      ),
    );
    _reload();
  }

  Future<void> _handleRequest(Map<String, dynamic> request, bool accept) async {
    final id = (request['id'] ?? '') as String;
    if (id.isEmpty) return;
    final ok = accept
        ? await widget.session.acceptFriendRequest(id)
        : await widget.session.rejectFriendRequest(id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '已处理' : (widget.session.error ?? '操作失败'))),
    );
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('通讯录'),
        actions: [
          IconButton(
            tooltip: '添加好友',
            icon: const Icon(Icons.person_add_alt_1),
            onPressed: _addFriend,
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: '好友'),
            Tab(text: '请求'),
            Tab(text: '黑名单'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _friendsTab(),
          _requestsTab(),
          _blocklistTab(),
        ],
      ),
    );
  }

  Widget _friendsTab() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _friends,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('加载失败：${snapshot.error}'));
        }
        final friends = snapshot.data ?? const [];
        if (friends.isEmpty) {
          return const Center(child: Text('还没有好友，点右上角添加'));
        }
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.separated(
            itemCount: friends.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final friend = friends[index];
              final info = friend['friend'] is Map
                  ? Map<String, dynamic>.from(friend['friend'] as Map)
                  : friend;
              final userId = (info['id'] ?? friend['friend_id'] ?? '') as String;
              final name = (info['nickname'] ?? info['username'] ?? '好友') as String;
              final alias = friend['alias'] as String?;

              return ListTile(
                leading: CircleAvatar(
                  child: Text(name.characters.first.toUpperCase()),
                ),
                title: Text(alias?.isNotEmpty == true ? alias! : name),
                subtitle: Text(userId),
                trailing: PopupMenuButton<String>(
                  onSelected: (value) async {
                    if (value == 'delete') {
                      final ok = await widget.session.deleteFriend(userId);
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(ok ? '已删除好友' : '删除失败')),
                      );
                      if (ok) _reload();
                    } else if (value == 'block') {
                      final ok = await widget.session.blockUser(userId);
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(ok ? '已拉黑' : '拉黑失败')),
                      );
                      if (ok) _reload();
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'block', child: Text('拉黑')),
                    PopupMenuItem(value: 'delete', child: Text('删除好友')),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _requestsTab() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _requests,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('加载失败：${snapshot.error}'));
        }
        final requests = snapshot.data ?? const [];
        if (requests.isEmpty) {
          return const Center(child: Text('没有待处理的好友请求'));
        }
        return ListView.separated(
          itemCount: requests.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final request = requests[index];
            // 请求项是 Friend 记录，请求者信息在 user 字段
            final user = request['user'] is Map
                ? Map<String, dynamic>.from(request['user'] as Map)
                : <String, dynamic>{};
            final name = (user['nickname'] ?? user['username'] ?? '有人') as String;
            return ListTile(
              leading: CircleAvatar(
                child: Text(name.characters.first.toUpperCase()),
              ),
              title: Text('$name 请求添加你为好友'),
              subtitle: Text((request['message'] ?? '') as String),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    tooltip: '拒绝',
                    icon: const Icon(Icons.close),
                    onPressed: () => _handleRequest(request, false),
                  ),
                  IconButton(
                    tooltip: '接受',
                    icon: const Icon(Icons.check),
                    onPressed: () => _handleRequest(request, true),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _blocklistTab() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _blocklist,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('加载失败：${snapshot.error}'));
        }
        final blocked = snapshot.data ?? const [];
        if (blocked.isEmpty) {
          return const Center(child: Text('黑名单是空的'));
        }
        return ListView.separated(
          itemCount: blocked.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final item = blocked[index];
            final user = item['user'] is Map
                ? Map<String, dynamic>.from(item['user'] as Map)
                : <String, dynamic>{};
            final userId = (item['user_id'] ?? user['id'] ?? '') as String;
            final name = (user['nickname'] ?? user['username'] ?? userId) as String;
            return ListTile(
              leading: const Icon(Icons.block),
              title: Text(name),
              trailing: TextButton(
                onPressed: () async {
                  final ok = await widget.session.unblockUser(userId);
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(ok ? '已解除' : '操作失败')),
                  );
                  if (ok) _reload();
                },
                child: const Text('解除'),
              ),
            );
          },
        );
      },
    );
  }
}

/// 添加好友：按关键词搜索用户 → 发送好友请求
class AddFriendPage extends StatefulWidget {
  const AddFriendPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<AddFriendPage> createState() => _AddFriendPageState();
}

class _AddFriendPageState extends State<AddFriendPage> {
  final _keyword = TextEditingController();
  List<Map<String, dynamic>> _results = const [];
  bool _searching = false;
  String? _error;
  final Set<String> _requested = {};

  @override
  void dispose() {
    _keyword.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final keyword = _keyword.text.trim();
    if (keyword.isEmpty) return;
    setState(() {
      _searching = true;
      _error = null;
    });
    try {
      final users = await widget.session.searchUsers(keyword);
      if (!mounted) return;
      setState(() => _results = users);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _sendRequest(String userId) async {
    final ok = await widget.session.sendFriendRequest(userId);
    if (!mounted) return;
    if (ok) setState(() => _requested.add(userId));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '好友请求已发送' : (widget.session.error ?? '发送失败'))),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _keyword,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: '搜索用户名 / 邮箱 / 手机号',
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
      body: _searching
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('搜索失败：$_error'))
              : _results.isEmpty
                  ? const Center(child: Text('输入关键词搜索用户'))
                  : ListView.separated(
                      itemCount: _results.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final user = _results[index];
                        final id = (user['id'] ?? '') as String;
                        final name =
                            (user['nickname'] ?? user['username'] ?? '用户') as String;
                        final requested = _requested.contains(id);
                        return ListTile(
                          leading: CircleAvatar(
                            child: Text(name.characters.first.toUpperCase()),
                          ),
                          title: Text(name),
                          subtitle: Text(id),
                          trailing: FilledButton(
                            onPressed:
                                id.isEmpty || requested ? null : () => _sendRequest(id),
                            child: Text(requested ? '已发送' : '加好友'),
                          ),
                        );
                      },
                    ),
    );
  }
}
