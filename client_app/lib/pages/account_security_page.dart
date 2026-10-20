import 'package:flutter/material.dart';

import '../state/session.dart';

/// 账号安全：修改密码 / 注销账号
class AccountSecurityPage extends StatefulWidget {
  const AccountSecurityPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<AccountSecurityPage> createState() => _AccountSecurityPageState();
}

class _AccountSecurityPageState extends State<AccountSecurityPage> {
  final _oldPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _deletePassword = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _oldPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    _deletePassword.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (_oldPassword.text.isEmpty || _newPassword.text.isEmpty) {
      setState(() => _error = '请填写当前密码与新密码');
      return;
    }
    if (_newPassword.text.length < 8) {
      setState(() => _error = '新密码至少 8 位');
      return;
    }
    if (_newPassword.text != _confirmPassword.text) {
      setState(() => _error = '两次输入的新密码不一致');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    final ok = await widget.session.changePassword(
      oldPassword: _oldPassword.text,
      newPassword: _newPassword.text,
    );
    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('密码已修改，请用新密码重新登录')),
      );
      // 修改密码会吊销全部刷新令牌，客户端已清空登录态，回到登录页
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      setState(() => _error = widget.session.error ?? '修改失败');
    }
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('注销账号'),
        content: const Text(
          '注销后账号会被删除且无法恢复，所有登录设备将退出。\n\n'
          '确认请输入当前密码。',
        ),
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
            child: const Text('确认注销'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() {
      _saving = true;
      _error = null;
    });
    final ok = await widget.session.deleteAccount(_deletePassword.text);
    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('账号已注销')),
      );
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      setState(() => _error = widget.session.error ?? '注销失败');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('账号安全')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('修改密码', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _oldPassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '当前密码',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _newPassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '新密码（至少 8 位）',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirmPassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '确认新密码',
              border: OutlineInputBorder(),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _changePassword,
            child: Text(_saving ? '处理中…' : '修改密码'),
          ),
          const Divider(height: 48),
          Text('注销账号', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            '注销后账号会被删除且无法恢复。',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _deletePassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '输入当前密码以确认',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: _saving ? null : _deleteAccount,
            child: const Text('注销账号'),
          ),
        ],
      ),
    );
  }
}
