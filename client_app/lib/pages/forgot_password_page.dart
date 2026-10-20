import 'package:flutter/material.dart';

import '../state/session.dart';

/// 忘记密码：请求重置 → 输入令牌与新密码
///
/// 生产环境服务端只发邮件，不会回传令牌，此时页面提示「查看邮箱」；
/// 本地开发（未配置 SMTP）服务端会回传 token，页面直接把令牌填好，便于联调。
class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _email = TextEditingController();
  final _token = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();

  bool _sending = false;
  bool _resetting = false;
  bool _requested = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _token.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    final email = _email.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = '请输入有效邮箱');
      return;
    }

    setState(() {
      _sending = true;
      _error = null;
    });
    final token = await widget.session.requestPasswordReset(email);
    if (!mounted) return;
    setState(() {
      _sending = false;
      _requested = true;
    });

    if (token != null && token.isNotEmpty) {
      // 开发模式：服务端没有 SMTP，直接把令牌回传
      setState(() => _token.text = token);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('开发模式：已自动填入重置令牌')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('如果该邮箱已注册，重置邮件已发送')),
      );
    }
  }

  Future<void> _reset() async {
    if (_token.text.trim().isEmpty) {
      setState(() => _error = '请填写重置令牌（来自邮件）');
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
      _resetting = true;
      _error = null;
    });
    final ok = await widget.session.resetPassword(
      token: _token.text.trim(),
      newPassword: _newPassword.text,
    );
    if (!mounted) return;
    setState(() => _resetting = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('密码已重置，请用新密码登录')),
      );
      Navigator.of(context).pop();
    } else {
      setState(() => _error = widget.session.error ?? '重置失败');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('找回密码')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            '输入注册邮箱，我们会发送一封包含重置令牌的邮件。',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _email,
            enabled: !_requested,
            decoration: const InputDecoration(
              labelText: '邮箱',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _sending ? null : _request,
            child: Text(_sending ? '发送中…' : '发送重置邮件'),
          ),
          if (_requested) ...[
            const Divider(height: 40),
            Text('重置密码', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              '把邮件里的重置令牌填进来（本地开发会自动填入）。',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _token,
              decoration: const InputDecoration(
                labelText: '重置令牌',
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
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _resetting ? null : _reset,
              child: Text(_resetting ? '重置中…' : '重置密码'),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
        ],
      ),
    );
  }
}
