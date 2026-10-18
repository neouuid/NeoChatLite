import 'dart:async';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:neochat_api/neochat_api.dart';

import '../state/session.dart';
import 'group_info_page.dart';

/// 聊天页：GET /api/v1/chat/conversations/:id/messages + POST /api/v1/chat/messages
class ChatPage extends StatefulWidget {
  const ChatPage({
    super.key,
    required this.session,
    required this.conversationId,
    required this.title,
    this.isGroup = false,
  });

  final NeoChatSession session;
  final String conversationId;
  final String title;
  final bool isGroup;

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  String? _error;
  bool _peerTyping = false;
  DateTime? _peerReadAt;
  Timer? _typingResetTimer;
  Timer? _typingSendTimer;
  bool _typingSent = false;
  StreamSubscription<RealtimeEvent>? _realtimeSub;

  @override
  void initState() {
    super.initState();
    _load();
    // 实时事件：新消息 / 对方正在输入 / 对方已读
    _realtimeSub = widget.session.realtimeEvents?.listen((event) {
      if (event.convId != widget.conversationId) return;
      final fromMe = event.fromId != null && event.fromId == widget.session.userId;

      switch (event.type) {
        case 'new_message':
          _load();
        case 'typing':
          if (fromMe) return;
          _typingResetTimer?.cancel();
          setState(() => _peerTyping = true);
          _typingResetTimer = Timer(const Duration(seconds: 3), () {
            if (mounted) setState(() => _peerTyping = false);
          });
        case 'stop_typing':
          if (fromMe) return;
          _typingResetTimer?.cancel();
          setState(() => _peerTyping = false);
        case 'message_read':
          if (fromMe) return;
          setState(() => _peerReadAt = DateTime.now());
      }
    });

    // 输入变化时发送「正在输入」（800ms 防抖，停止输入后发 stop_typing）
    _input.addListener(_onInputChanged);
  }

  void _onInputChanged() {
    final hasText = _input.text.trim().isNotEmpty;

    _typingSendTimer?.cancel();
    if (!hasText) {
      if (_typingSent) {
        widget.session.sendTyping(widget.conversationId, typing: false);
        _typingSent = false;
      }
      return;
    }

    _typingSendTimer = Timer(const Duration(milliseconds: 800), () {
      widget.session.sendTyping(widget.conversationId);
      _typingSent = true;
      // 停顿后自动收起输入状态
      _typingSendTimer = Timer(const Duration(seconds: 3), () {
        if (!mounted) return;
        widget.session.sendTyping(widget.conversationId, typing: false);
        _typingSent = false;
      });
    });
  }

  @override
  void dispose() {
    _typingResetTimer?.cancel();
    _typingSendTimer?.cancel();
    _input.removeListener(_onInputChanged);
    _realtimeSub?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final messages = await widget.session.loadMessages(widget.conversationId);
      setState(() {
        _messages
          ..clear()
          ..addAll(messages);
      });
      _scrollToBottom();
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    _input.clear();
    final ok = await widget.session.sendMessage(widget.conversationId, text);
    if (!ok) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '发送失败')),
      );
      return;
    }
    await _load();
  }

  Widget _buildBubbleContent(Map<String, dynamic> msg, String content) {
    final type = msg['type'] as String? ?? 'text';
    final mediaUrl = msg['media_url'] as String? ?? '';

    if (type == 'image' && mediaUrl.isNotEmpty) {
      return GestureDetector(
        onTap: () => _previewImage(mediaUrl),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            '${widget.session.baseUrl}$mediaUrl',
            width: 180,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => const Text('[图片加载失败]'),
          ),
        ),
      );
    }

    if (type == 'file') {
      final fileName = msg['file_name'] as String? ?? '文件';
      final size = msg['file_size'];
      final sizeLabel = size is int ? _formatSize(size) : '';
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.insert_drive_file, size: 20),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(fileName, maxLines: 1, overflow: TextOverflow.ellipsis),
                if (sizeLabel.isNotEmpty)
                  Text(sizeLabel, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      );
    }

    return Text(content);
  }

  static String _formatSize(int bytes) {
    if (bytes >= 1024 * 1024) {
      return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
    }
    if (bytes >= 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    return '$bytes B';
  }

  void _previewImage(String mediaUrl) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(8),
        child: InteractiveViewer(
          child: Image.network('${widget.session.baseUrl}$mediaUrl'),
        ),
      ),
    );
  }

  Future<void> _showAttachmentSheet() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('发送图片'),
              onTap: () => Navigator.pop(sheetContext, 'image'),
            ),
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text('发送文件'),
              onTap: () => Navigator.pop(sheetContext, 'file'),
            ),
          ],
        ),
      ),
    );
    if (!mounted || choice == null) return;
    await _pickAndSend(isImage: choice == 'image');
  }

  Future<void> _pickAndSend({required bool isImage}) async {
    final result = await FilePicker.platform.pickFiles(
      type: isImage ? FileType.image : FileType.any,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法读取文件内容')),
      );
      return;
    }

    // 上传期间用一个简单的加载提示
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('正在上传 ${file.name}…'),
          duration: const Duration(seconds: 2),
        ),
      );
    }

    final ok = await widget.session.sendAttachment(
      conversationId: widget.conversationId,
      bytes: bytes,
      filename: file.name,
      isImage: isImage,
    );
    if (!mounted) return;
    if (ok) {
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '发送失败')),
      );
    }
  }

  Future<void> _showMessageActions(Map<String, dynamic> msg) async {
    final messageId = msg['id'] as String? ?? '';
    final isMine = widget.session.userId != null &&
        msg['sender_id'] == widget.session.userId;
    final content = msg['content'] as String? ?? '';

    await showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('复制'),
              onTap: () async {
                Navigator.pop(sheetContext);
                await Clipboard.setData(ClipboardData(text: content));
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('已复制')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.star_outline),
              title: const Text('收藏'),
              onTap: () async {
                Navigator.pop(sheetContext);
                final ok = await widget.session.favoriteMessage(messageId);
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ok ? '已收藏' : (widget.session.error ?? '收藏失败'))),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.forward),
              title: const Text('转发'),
              onTap: () async {
                Navigator.pop(sheetContext);
                await _forwardTo(messageId);
              },
            ),
            if (isMine)
              ListTile(
                leading: const Icon(Icons.undo),
                title: const Text('撤回'),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  final ok = await widget.session.deleteMessage(messageId);
                  if (!mounted) return;
                  if (ok) {
                    _load();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(widget.session.error ?? '撤回失败')),
                    );
                  }
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _forwardTo(String messageId) async {
    final conversations = await widget.session.loadConversations();
    if (!mounted) return;
    final target = await showDialog<String>(
      context: context,
      builder: (dialogContext) => SimpleDialog(
        title: const Text('转发到'),
        children: [
          for (final conv in conversations)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(dialogContext, conv['id'] as String?),
              child: Text(
                (conv['name'] as String?)?.isNotEmpty == true
                    ? conv['name'] as String
                    : '会话 ${(conv['id'] as String? ?? '').split('-').first}',
              ),
            ),
        ],
      ),
    );
    if (target == null || target.isEmpty) return;
    final ok = await widget.session.forwardMessage(messageId, [target]);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '已转发' : (widget.session.error ?? '转发失败'))),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  @override
  Widget build(BuildContext context) {
    final me = widget.session.userId;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          if (widget.isGroup)
            IconButton(
              tooltip: '群信息',
              icon: const Icon(Icons.groups),
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => GroupInfoPage(
                      session: widget.session,
                      groupId: widget.conversationId,
                      title: widget.title,
                    ),
                  ),
                );
              },
            ),
          IconButton(
            tooltip: '刷新',
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: ListTile(
                          title: const Text('加载失败'),
                          subtitle: Text(_error!),
                          trailing: TextButton(onPressed: _load, child: const Text('重试')),
                        ),
                      )
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMine = me != null && msg['sender_id'] == me;
                          final content = msg['content'] as String? ?? '';
                          return Align(
                            alignment:
                                isMine ? Alignment.centerRight : Alignment.centerLeft,
                            child: GestureDetector(
                              onLongPress: () => _showMessageActions(msg),
                              child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.72,
                              ),
                              decoration: BoxDecoration(
                                color: isMine
                                    ? Theme.of(context).colorScheme.primaryContainer
                                    : Theme.of(context).colorScheme.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(12),
                              ),
                                child: _buildBubbleContent(msg, content),
                              ),
                            ),
                          );
                        },
                      ),
          ),
          if (_peerTyping || _peerReadAt != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  if (_peerTyping)
                    Text(
                      '对方正在输入…',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  const Spacer(),
                  if (_peerReadAt != null)
                    Text(
                      '对方已读',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  IconButton(
                    tooltip: '发送图片或文件',
                    icon: const Icon(Icons.attach_file),
                    onPressed: _showAttachmentSheet,
                  ),
                  Expanded(
                    child: TextField(
                      controller: _input,
                      decoration: const InputDecoration(
                        hintText: '说点什么…',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
