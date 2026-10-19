import 'package:flutter/material.dart';

import '../state/session.dart';

/// 注册页：用户名 + 密码 + 可选邮箱/手机号/昵称
/// 服务端注册接口直接返回 token，注册成功即登录。
class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _nickname = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    _confirm.dispose();
    _nickname.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  String? _validate() {
    if (_username.text.trim().length < 3) return '用户名至少 3 个字符';
    if (_password.text.length < 8) return '密码至少 8 位';
    if (_password.text != _confirm.text) return '两次输入的密码不一致';
    final email = _email.text.trim();
    if (email.isNotEmpty && !email.contains('@')) return '邮箱格式不正确';
    final phone = _phone.text.trim();
    if (phone.isNotEmpty && phone.length < 6) return '手机号格式不正确';
    return null;
  }

  Future<void> _submit() async {
    final invalid = _validate();
    if (invalid != null) {
      setState(() => _error = invalid);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    final ok = await widget.session.register(
      username: _username.text.trim(),
      password: _password.text,
      email: _email.text.trim(),
      phone: _phone.text.trim(),
      nickname: _nickname.text.trim(),
    );

    if (!mounted) return;
    setState(() => _submitting = false);

    if (ok) {
      // 注册即登录，根组件会根据 isLoggedIn 自动切到会话列表
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      setState(() => _error = widget.session.error ?? '注册失败');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('注册账号')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(
            controller: _username,
            decoration: const InputDecoration(
              labelText: '用户名',
              helperText: '登录用，至少 3 个字符',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nickname,
            decoration: const InputDecoration(
              labelText: '昵称（可选）',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '密码',
              helperText: '至少 8 位',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _confirm,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: '确认密码',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _email,
            decoration: const InputDecoration(
              labelText: '邮箱（可选）',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _phone,
            decoration: const InputDecoration(
              labelText: '手机号（可选）',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: Text(_submitting ? '注册中…' : '注册并登录'),
          ),
        ],
      ),
    );
  }
}
