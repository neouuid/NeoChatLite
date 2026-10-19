import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../state/session.dart';

/// 我的资料：昵称 / 签名 / 头像
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.session});

  final NeoChatSession session;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final TextEditingController _nickname;
  late final TextEditingController _bio;
  String? _avatarUrl;
  bool _saving = false;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _nickname = TextEditingController(text: widget.session.nickname ?? '');
    _bio = TextEditingController(text: widget.session.bio ?? '');
    _avatarUrl = widget.session.avatar;
  }

  @override
  void dispose() {
    _nickname.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) return;

    setState(() => _uploading = true);
    final uploaded = await widget.session.uploadAttachment(
      bytes: bytes,
      filename: file.name,
      type: 'image',
    );
    if (!mounted) return;
    setState(() => _uploading = false);
    if (uploaded == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '头像上传失败')),
      );
      return;
    }
    setState(() => _avatarUrl = uploaded['url'] as String?);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.session.updateProfile(
      nickname: _nickname.text.trim(),
      bio: _bio.text.trim(),
      avatar: _avatarUrl,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '资料已保存' : (widget.session.error ?? '保存失败'))),
    );
    if (ok) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final avatar = _avatarUrl;
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的资料'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? '保存中…' : '保存'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: GestureDetector(
              onTap: _uploading ? null : _pickAvatar,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundImage: (avatar != null && avatar.isNotEmpty)
                        ? NetworkImage('${widget.session.baseUrl}$avatar')
                        : null,
                    child: (avatar == null || avatar.isEmpty)
                        ? Text(
                            (_nickname.text.isNotEmpty
                                    ? _nickname.text.characters.first
                                    : '?')
                                .toUpperCase(),
                            style: const TextStyle(fontSize: 28),
                          )
                        : null,
                  ),
                  if (_uploading)
                    const CircularProgressIndicator(strokeWidth: 2)
                  else
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: Icon(
                          Icons.camera_alt,
                          size: 14,
                          color: Theme.of(context).colorScheme.onPrimary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nickname,
            decoration: const InputDecoration(
              labelText: '昵称',
              border: OutlineInputBorder(),
            ),
            maxLength: 50,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _bio,
            decoration: const InputDecoration(
              labelText: '个性签名',
              border: OutlineInputBorder(),
            ),
            maxLength: 200,
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('用户名'),
            subtitle: Text(widget.session.username ?? ''),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('用户 ID'),
            subtitle: Text(widget.session.userId ?? ''),
          ),
        ],
      ),
    );
  }
}
