import 'package:flutter/material.dart';

import '../state/session.dart';

/// 他人资料页（只读）：头像、昵称、用户名、签名，可发消息 / 加好友
class UserProfilePage extends StatefulWidget {
  const UserProfilePage({
    super.key,
    required this.session,
    required this.userId,
    this.fallbackName,
  });

  final NeoChatSession session;
  final String userId;
  final String? fallbackName;

  @override
  State<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends State<UserProfilePage> {
  late Future<Map<String, dynamic>?> _profile;
  bool _requested = false;

  @override
  void initState() {
    super.initState();
    _profile = widget.session.loadUserProfile(widget.userId);
  }

  Future<void> _sendRequest() async {
    final ok = await widget.session.sendFriendRequest(widget.userId);
    if (!mounted) return;
    if (ok) setState(() => _requested = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '好友请求已发送' : (widget.session.error ?? '发送失败'))),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('用户资料')),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _profile,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final user = snapshot.data;
          if (user == null) {
            return Center(child: Text(widget.session.error ?? '加载失败'));
          }

          final nickname =
              (user['nickname'] ?? user['username'] ?? widget.fallbackName ?? '用户')
                  as String;
          final bio = (user['bio'] ?? '') as String;
          final avatar = (user['avatar'] ?? '') as String;
          final username = (user['username'] ?? '') as String;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 48,
                  backgroundImage:
                      avatar.isNotEmpty ? NetworkImage('${widget.session.baseUrl}$avatar') : null,
                  child: avatar.isEmpty
                      ? Text(
                          nickname.characters.first.toUpperCase(),
                          style: const TextStyle(fontSize: 32),
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(nickname, style: Theme.of(context).textTheme.titleLarge),
              ),
              if (username.isNotEmpty) ...[
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    '@$username',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
              if (bio.isNotEmpty) ...[
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(bio),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              if (widget.userId != widget.session.userId)
                FilledButton.icon(
                  onPressed: _requested ? null : _sendRequest,
                  icon: const Icon(Icons.person_add_alt_1),
                  label: Text(_requested ? '已发送好友请求' : '加为好友'),
                ),
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('用户 ID'),
                subtitle: Text(widget.userId),
              ),
            ],
          );
        },
      ),
    );
  }
}
