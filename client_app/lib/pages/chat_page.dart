import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cross_file/cross_file.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:neochat_api/neochat_api.dart';

import '../state/session.dart';
import '../widgets/audio_bubble.dart';
import '../widgets/video_bubble.dart';
import 'user_profile_page.dart';
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
  bool _loadingMore = false;
  Map<String, dynamic>? _replyTo;
  bool _hasMore = true;
  String? _error;
  bool _peerTyping = false;
  DateTime? _peerReadAt;
  Timer? _typingResetTimer;
  Timer? _typingSendTimer;
  bool _typingSent = false;
  StreamSubscription<RealtimeEvent>? _realtimeSub;

  static const int _pageSize = 50;

  @override
  void initState() {
    super.initState();
    _load();
    _scroll.addListener(_onScroll);
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
    _scroll.removeListener(_onScroll);
    _realtimeSub?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    // 接近顶部时加载更早的消息
    if (_scroll.position.pixels <= 80 && _hasMore && !_loadingMore) {
      _loadMore();
    }
  }

  /// 向上翻：用最早一条消息的 created_at 作为 before 游标
  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _messages.isEmpty) return;
    final oldestAt = _messages.first['created_at'] as String?;
    if (oldestAt == null || oldestAt.isEmpty) {
      setState(() => _hasMore = false);
      return;
    }

    setState(() => _loadingMore = true);
    final oldMaxExtent = _scroll.hasClients ? _scroll.position.maxScrollExtent : 0.0;
    try {
      final older = await widget.session.loadMessages(
        widget.conversationId,
        before: oldestAt,
        limit: _pageSize,
      );
      if (!mounted) return;

      // 去重后插到头部
      final known = _messages.map((m) => m['id']).toSet();
      final fresh = older.where((m) => !known.contains(m['id'])).toList();
      setState(() {
        _messages.insertAll(0, fresh);
        _hasMore = older.length >= _pageSize;
      });

      // 保持当前阅读位置，避免跳动
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scroll.hasClients) return;
        final newMaxExtent = _scroll.position.maxScrollExtent;
        _scroll.jumpTo(_scroll.position.pixels + (newMaxExtent - oldMaxExtent));
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final messages = await widget.session.loadMessages(
        widget.conversationId,
        limit: _pageSize,
      );
      setState(() {
        _messages
          ..clear()
          ..addAll(messages);
        _hasMore = messages.length >= _pageSize;
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
    final ok = await widget.session.sendMessage(
      widget.conversationId,
      text,
      replyToId: _replyTo?['id'] as String?,
    );
    if (!ok) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '发送失败')),
      );
      return;
    }
    await _load();
  }

  static String _quotePreview(Map<String, dynamic> msg) {
    final sender = msg['sender'] is Map
        ? (msg['sender'] as Map)['nickname'] ??
            (msg['sender'] as Map)['username'] ??
            '对方'
        : '对方';
    final text = (msg['content'] as String?) ?? '';
    return '$sender：${text.isEmpty ? '[媒体消息]' : text}';
  }

  Widget? _buildQuoteBlock(Map<String, dynamic> msg) {
    final replyTo = msg['reply_to'];
    if (replyTo is! Map) return null;
    final quote = Map<String, dynamic>.from(replyTo);
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(6),
        border: Border(
          left: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
        ),
      ),
      child: Text(
        _quotePreview(quote),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
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

    final quote = _buildQuoteBlock(msg);
    if (quote != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [quote, _buildMediaOrText(msg, content, type, mediaUrl)],
      );
    }
    return _buildMediaOrText(msg, content, type, mediaUrl);
  }

  Widget _buildMediaOrText(
    Map<String, dynamic> msg,
    String content,
    String type,
    String mediaUrl,
  ) {
    if (type == 'audio' && mediaUrl.isNotEmpty) {
      return AudioBubble(url: '${widget.session.baseUrl}$mediaUrl');
    }

    if (type == 'video' && mediaUrl.isNotEmpty) {
      return VideoBubble(url: '${widget.session.baseUrl}$mediaUrl');
    }

    if (type == 'file') {
      final fileName = msg['file_name'] as String? ?? '文件';
      final size = msg['file_size'];
      final sizeLabel = size is int ? _formatSize(size) : '';
      return GestureDetector(
        onTap: mediaUrl.isEmpty ? null : () => _openAttachment(mediaUrl),
        child: Row(
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
      ),
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
            ListTile(
              leading: const Icon(Icons.mic_none),
              title: const Text('语音消息'),
              onTap: () => Navigator.pop(sheetContext, 'voice'),
            ),
            ListTile(
              leading: const Icon(Icons.videocam_outlined),
              title: const Text('视频消息'),
              onTap: () => Navigator.pop(sheetContext, 'video'),
            ),
          ],
        ),
      ),
    );
    if (!mounted || choice == null) return;
    if (choice == 'voice') {
      await _recordVoice();
      return;
    }
    await _pickAndSend(kind: choice);
  }

  Future<void> _pickAndSend({required String kind}) async {
    final fileType = switch (kind) {
      'image' => FileType.image,
      'video' => FileType.video,
      _ => FileType.any,
    };
    final result = await FilePicker.platform.pickFiles(
      type: fileType,
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
      kind: kind,
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

  Future<void> _recordVoice() async {
    final bytes = await showModalBottomSheet<Uint8List>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _VoiceRecorderSheet(),
    );
    if (!mounted || bytes == null || bytes.isEmpty) return;

    final ok = await widget.session.sendVoice(
      conversationId: widget.conversationId,
      bytes: bytes,
    );
    if (!mounted) return;
    if (ok) {
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '发送语音失败')),
      );
    }
  }

  static String _senderName(Map<String, dynamic> msg) {
    final sender = msg['sender'];
    if (sender is Map) {
      return (sender['nickname'] ?? sender['username'] ?? '对方') as String;
    }
    return '对方';
  }

  Future<void> _openUserProfile(Map<String, dynamic> msg) async {
    final senderId = msg['sender_id'] as String?;
    if (senderId == null || senderId.isEmpty) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UserProfilePage(
          session: widget.session,
          userId: senderId,
          fallbackName: _senderName(msg),
        ),
      ),
    );
  }

  Future<void> _editMessage(Map<String, dynamic> msg) async {
    final controller =
        TextEditingController(text: (msg['content'] as String?) ?? '');
    final saved = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('编辑消息'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: null,
          decoration: const InputDecoration(hintText: '输入新的内容'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, controller.text.trim()),
            child: const Text('保存'),
          ),
        ],
      ),
    );
    controller.dispose();

    if (saved == null || saved.isEmpty) return;
    final ok = await widget.session.editMessage(msg['id'] as String, saved);
    if (!mounted) return;
    if (ok) {
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? '编辑失败')),
      );
    }
  }

  Future<void> _openAttachment(String mediaUrl) async {
    final uri = Uri.parse('${widget.session.baseUrl}$mediaUrl');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法打开文件')),
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
            if (isMine && (msg['type'] ?? 'text') == 'text')
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('编辑'),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  await _editMessage(msg);
                },
              ),
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
                        itemCount: _messages.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            if (_loadingMore) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(vertical: 12),
                                child: Center(
                                  child: SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                ),
                              );
                            }
                            if (!_hasMore && _messages.isNotEmpty) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Center(
                                  child: Text(
                                    '没有更多历史消息了',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ),
                              );
                            }
                            return const SizedBox.shrink();
                          }
                          final msg = _messages[index - 1];
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
                                child: Column(
                                  crossAxisAlignment: isMine
                                      ? CrossAxisAlignment.end
                                      : CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (!isMine)
                                      GestureDetector(
                                        onTap: () => _openUserProfile(msg),
                                        child: Padding(
                                          padding: const EdgeInsets.only(bottom: 2),
                                          child: Text(
                                            _senderName(msg),
                                            style: Theme.of(context).textTheme.bodySmall,
                                          ),
                                        ),
                                      ),
                                    _buildBubbleContent(msg, content),
                                    if (msg['is_edited'] == true)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          '已编辑',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ),
                                  ],
                                ),
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

/// 录音面板：开始录音 → 停止后返回音频字节
class _VoiceRecorderSheet extends StatefulWidget {
  const _VoiceRecorderSheet();

  @override
  State<_VoiceRecorderSheet> createState() => _VoiceRecorderSheetState();
}

class _VoiceRecorderSheetState extends State<_VoiceRecorderSheet> {
  final _recorder = AudioRecorder();
  Timer? _ticker;
  int _seconds = 0;
  bool _recording = false;
  String? _error;

  @override
  void dispose() {
    _ticker?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    try {
      if (!await _recorder.hasPermission()) {
        setState(() => _error = '没有麦克风权限');
        return;
      }
      final dir = await getTemporaryDirectory();
      final path =
          '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc),
        path: path,
      );
      setState(() {
        _recording = true;
        _seconds = 0;
        _error = null;
      });
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        setState(() => _seconds++);
      });
    } catch (e) {
      setState(() => _error = '录音启动失败：$e');
    }
  }

  Future<void> _stopAndSend() async {
    try {
      final path = await _recorder.stop();
      _ticker?.cancel();
      if (!mounted) return;
      setState(() => _recording = false);

      if (path == null) {
        setState(() => _error = '没有录到音频');
        return;
      }
      final bytes = await XFile(path).readAsBytes();
      if (!mounted) return;
      Navigator.of(context).pop(bytes);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '停止录音失败：$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final minutes = _seconds ~/ 60;
    final seconds = _seconds % 60;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _recording
                  ? '$minutes:${seconds.toString().padLeft(2, '0')}'
                  : '语音消息',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            if (_error != null)
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 20),
            if (!_recording)
              FilledButton.icon(
                onPressed: _start,
                icon: const Icon(Icons.mic),
                label: const Text('开始录音'),
              )
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  OutlinedButton(
                    onPressed: () async {
                      await _recorder.cancel();
                      _ticker?.cancel();
                      if (!context.mounted) return;
                      Navigator.of(context).pop();
                    },
                    child: const Text('取消'),
                  ),
                  FilledButton.icon(
                    onPressed: _stopAndSend,
                    icon: const Icon(Icons.send),
                    label: const Text('停止并发送'),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
