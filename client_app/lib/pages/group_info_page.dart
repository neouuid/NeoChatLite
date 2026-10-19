import 'package:flutter/material.dart';

import '../state/session.dart';

/// 群信息与成员管理：GET /api/v1/groups/:id/members 等
class GroupInfoPage extends StatefulWidget {
  const GroupInfoPage({
    super.key,
    required this.session,
    required this.groupId,
    required this.title,
  });

  final NeoChatSession session;
  final String groupId;
  final String title;

  @override
  State<GroupInfoPage> createState() => _GroupInfoPageState();
}

class _GroupInfoPageState extends State<GroupInfoPage> {
  late Future<List<Map<String, dynamic>>> _membersFuture;
  String? _myRole;

  @override
  void initState() {
    super.initState();
    _membersFuture = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final members = await widget.session.loadGroupMembers(widget.groupId);
    final me = widget.session.userId;
    for (final member in members) {
      if (member['user_id'] == me) {
        _myRole = member['role'] as String?;
        break;
      }
    }
    return members;
  }

  void _reload() {
    setState(() {
      _membersFuture = _load();
    });
  }

  bool get _canManage => _myRole == 'owner' || _myRole == 'admin';
  bool get _isOwner => _myRole == 'owner';

  Future<void> _editGroup() async {
    final nameCtrl = TextEditingController(text: widget.title);
    final descCtrl = TextEditingController();

    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('修改群资料'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: '群名称'),
              maxLength: 50,
            ),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(labelText: '群描述'),
              maxLength: 200,
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('保存'),
          ),
        ],
      ),
    );

    if (saved != true) {
      nameCtrl.dispose();
      descCtrl.dispose();
      return;
    }

    final name = nameCtrl.text.trim();
    final desc = descCtrl.text.trim();
    nameCtrl.dispose();
    descCtrl.dispose();

    final ok = await widget.session.updateGroup(
      widget.groupId,
      name: name.isEmpty ? null : name,
      description: desc.isEmpty ? null : desc,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '群资料已更新' : (widget.session.error ?? '更新失败'))),
    );
    if (ok) _reload();
  }

  Future<void> _invite() async {
    final friends = await widget.session.loadFriends();
    if (!mounted) return;

    final members = await _membersFuture;
    final existing = members.map((m) => m['user_id']).toSet();

    final candidates = friends.where((friend) {
      final info = friend['friend'] is Map
          ? Map<String, dynamic>.from(friend['friend'] as Map)
          : friend;
      final id = (info['id'] ?? friend['friend_id'] ?? '') as String;
      return id.isNotEmpty && !existing.contains(id);
    }).toList();

    if (!mounted) return;
    if (candidates.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('没有可邀请的好友')),
      );
      return;
    }

    final target = await showDialog<String>(
      context: context,
      builder: (dialogContext) => SimpleDialog(
        title: const Text('邀请好友入群'),
        children: [
          for (final friend in candidates)
            Builder(builder: (context) {
              final info = friend['friend'] is Map
                  ? Map<String, dynamic>.from(friend['friend'] as Map)
                  : friend;
              final id = (info['id'] ?? friend['friend_id'] ?? '') as String;
              final name = (info['nickname'] ?? info['username'] ?? '用户') as String;
              return SimpleDialogOption(
                onPressed: () => Navigator.pop(dialogContext, id),
                child: Text(name),
              );
            }),
        ],
      ),
    );

    if (target == null || target.isEmpty) return;
    final ok = await widget.session.addGroupMember(widget.groupId, target);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '已邀请' : (widget.session.error ?? '邀请失败'))),
    );
    if (ok) _reload();
  }

  Future<void> _memberActions(Map<String, dynamic> member) async {
    final userId = member['user_id'] as String? ?? '';
    final role = member['role'] as String? ?? 'member';
    final isMe = userId == widget.session.userId;
    if (userId.isEmpty || isMe) return;

    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isOwner && role != 'admin')
              ListTile(
                leading: const Icon(Icons.shield_outlined),
                title: const Text('设为管理员'),
                onTap: () => Navigator.pop(sheetContext, 'promote'),
              ),
            if (_isOwner && role == 'admin')
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('取消管理员'),
                onTap: () => Navigator.pop(sheetContext, 'demote'),
              ),
            if (_canManage && role != 'owner')
              ListTile(
                leading: const Icon(Icons.person_remove_outlined),
                title: const Text('移出群聊'),
                onTap: () => Navigator.pop(sheetContext, 'remove'),
              ),
          ],
        ),
      ),
    );

    if (!mounted || action == null) return;

    bool ok = false;
    switch (action) {
      case 'promote':
        ok = await widget.session.updateMemberRole(widget.groupId, userId, 'admin');
      case 'demote':
        ok = await widget.session.updateMemberRole(widget.groupId, userId, 'member');
      case 'remove':
        ok = await widget.session.removeGroupMember(widget.groupId, userId);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '操作成功' : (widget.session.error ?? '操作失败'))),
    );
    if (ok) _reload();
  }

  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('退出群聊'),
        content: const Text('确定要退出这个群吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('退出'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final ok = await widget.session.leaveGroup(widget.groupId);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '退群失败')),
      );
    }
  }

  Future<void> _disband() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('解散群聊'),
        content: const Text('解散后所有成员都会离开，且无法恢复。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('取消'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('解散'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final ok = await widget.session.disbandGroup(widget.groupId);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '解散失败')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          if (_canManage)
            IconButton(
              tooltip: '修改群资料',
              icon: const Icon(Icons.edit_outlined),
              onPressed: _editGroup,
            ),
          if (_canManage)
            IconButton(
              tooltip: '邀请好友',
              icon: const Icon(Icons.person_add_alt),
              onPressed: _invite,
            ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _membersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('加载成员失败：${snapshot.error}'));
          }
          final members = snapshot.data ?? const [];
          return ListView(
            children: [
              ListTile(
                title: Text('群成员（${members.length}）'),
                subtitle: _myRole == null ? null : Text('我的角色：${_roleLabel(_myRole)}'),
              ),
              const Divider(height: 1),
              for (final member in members)
                Builder(builder: (context) {
                  final user = member['user'] is Map
                      ? Map<String, dynamic>.from(member['user'] as Map)
                      : <String, dynamic>{};
                  final name = (user['nickname'] ??
                          user['username'] ??
                          member['nickname'] ??
                          '成员') as String;
                  final role = member['role'] as String? ?? 'member';
                  final isMe = member['user_id'] == widget.session.userId;
                  return ListTile(
                    leading: CircleAvatar(
                      child: Text(name.characters.first.toUpperCase()),
                    ),
                    title: Text(isMe ? '$name（我）' : name),
                    subtitle: Text(_roleLabel(role)),
                    trailing: (_canManage && !isMe && role != 'owner')
                        ? const Icon(Icons.more_horiz)
                        : null,
                    onTap: () => _memberActions(member),
                  );
                }),
              const Divider(height: 24),
              ListTile(
                leading: Icon(Icons.logout, color: Theme.of(context).colorScheme.error),
                title: Text(
                  '退出群聊',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                onTap: _leave,
              ),
              if (_isOwner)
                ListTile(
                  leading: Icon(Icons.delete_forever, color: Theme.of(context).colorScheme.error),
                  title: Text(
                    '解散群聊',
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                  onTap: _disband,
                ),
            ],
          );
        },
      ),
    );
  }

  static String _roleLabel(String? role) {
    switch (role) {
      case 'owner':
        return '群主';
      case 'admin':
        return '管理员';
      default:
        return '成员';
    }
  }
}
