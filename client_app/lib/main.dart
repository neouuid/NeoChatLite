import 'package:flutter/material.dart';

import 'pages/conversations_page.dart';
import 'pages/login_page.dart';
import 'state/session.dart';

/// 应用入口：持有全局的会话状态（登录态 + API 客户端）。
void main() {
  runApp(const NeoChatApp());
}

class NeoChatApp extends StatefulWidget {
  const NeoChatApp({super.key, this.session});

  /// 可注入的会话状态，便于测试；默认创建真实实例。
  final NeoChatSession? session;

  @override
  State<NeoChatApp> createState() => _NeoChatAppState();
}

class _NeoChatAppState extends State<NeoChatApp> {
  late final NeoChatSession _session = widget.session ?? NeoChatSession();
  late final Future<bool> _restored = _session.restore();

  @override
  void dispose() {
    if (widget.session == null) {
      _session.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NeoChat',
      theme: ThemeData(colorSchemeSeed: const Color(0xFF4C6FFF)),
      darkTheme: ThemeData(
        colorSchemeSeed: const Color(0xFF4C6FFF),
        brightness: Brightness.dark,
      ),
      home: FutureBuilder<bool>(
        future: _restored,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          return ListenableBuilder(
            listenable: _session,
            builder: (context, _) {
              if (_session.isLoggedIn) {
                return ConversationsPage(session: _session);
              }
              return LoginPage(session: _session);
            },
          );
        },
      ),
    );
  }
}
