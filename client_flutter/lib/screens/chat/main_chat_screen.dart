import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/widgets/chat/conversation_item.dart';
import 'package:neochat/widgets/chat/message_bubble.dart';
import 'package:neochat/core/theme/app_theme.dart';

class MainChatScreen extends StatefulWidget {
  const MainChatScreen({super.key});

  @override
  State<MainChatScreen> createState() => _MainChatScreenState();
}

class _MainChatScreenState extends State<MainChatScreen> {
  int _selectedNavIndex = 0;
  int? _selectedConversationIndex;
  final TextEditingController _messageController = TextEditingController();

  final List<Map<String, dynamic>> _conversations = [
    {
      'name': '李明',
      'lastMessage': '好的，明天见！',
      'time': '12:34',
      'unread': 0,
      'avatarColor': AppColors.primary,
    },
    {
      'name': '王芳',
      'lastMessage': '那个项目进展怎么样了？',
      'time': '昨天',
      'unread': 0,
      'avatarColor': AppColors.secondary,
    },
    {
      'name': '张伟',
      'lastMessage': '周末一起打球吗？',
      'time': '周一',
      'unread': 2,
      'avatarColor': AppColors.success,
    },
  ];

  final List<Map<String, dynamic>> _messages = [
    {
      'isSent': false,
      'text': '你好！今天的项目进展怎么样了？',
      'time': '09:30',
    },
    {
      'isSent': true,
      'text': '进展不错！我刚完成了UI设计稿，正想发给你看看。',
      'time': '09:32',
      'isRead': true,
    },
    {
      'isSent': false,
      'type': 'image',
      'time': '09:35',
    },
    {
      'isSent': true,
      'type': 'file',
      'fileName': 'UI设计稿.sketch',
      'fileSize': 1024 * 1024 * 8,
      'time': '09:38',
      'isRead': true,
    },
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isMobile = MediaQuery.of(context).size.width < 768;

    if (isMobile) {
      return _buildMobileLayout(isDark);
    }

    return _buildDesktopLayout(isDark);
  }

  Widget _buildMobileLayout(bool isDark) {
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            // 顶部导航
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  AppAvatar(
                    name: '我',
                    size: AvatarSize.medium,
                    backgroundColor: AppColors.warning,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      '消息',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings),
                    onPressed: () => context.go('/settings'),
                  ),
                ],
              ),
            ),
            // 底部导航栏
            Expanded(
              child: _selectedConversationIndex == null
                  ? _buildConversationList(isDark)
                  : _buildChatArea(isDark),
            ),
            if (_selectedConversationIndex == null) _buildBottomNavBar(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildDesktopLayout(bool isDark) {
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Row(
          children: [
            _buildIconSidebar(isDark),
            _buildSidebar(isDark),
            Expanded(child: _buildChatArea(isDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildIconSidebar(bool isDark) {
    return Container(
      width: 72,
      color: AppColors.backgroundDark,
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Expanded(
            child: Column(
              children: [
                // 用户头像
                AppAvatar(
                  name: '我',
                  size: AvatarSize.medium,
                  backgroundColor: AppColors.warning,
                ),
                const SizedBox(height: 16),
                // 聊天图标
                _buildNavIcon(Icons.message, 0, isDark),
                const SizedBox(height: 16),
                // 群组图标
                _buildNavIcon(Icons.group, 1, isDark),
                const SizedBox(height: 16),
                // 好友图标
                _buildNavIcon(Icons.person_add, 2, isDark),
              ],
            ),
          ),
          // 设置图标
          _buildNavIcon(Icons.settings, 3, isDark, isBottom: true),
        ],
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, int index, bool isDark, {bool isBottom = false}) {
    final isSelected = _selectedNavIndex == index;
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary : AppColors.inputBackgroundDark,
        borderRadius: BorderRadius.circular(12),
      ),
      child: IconButton(
        icon: Icon(icon),
        color: isSelected ? Colors.white : AppColors.textSecondaryDark,
        onPressed: () {
          setState(() {
            _selectedNavIndex = index;
          });
          if (index == 3) {
            context.go('/settings');
          }
        },
      ),
    );
  }

  Widget _buildSidebar(bool isDark) {
    return Container(
      width: 320,
      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 搜索栏
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AppColors.inputBackgroundDark,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.search, color: AppColors.textSecondaryDark, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '搜索联系人...',
                    style: TextStyle(
                      color: AppColors.textSecondaryDark,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // 会话列表
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemBuilder: (context, index) {
                final conversation = _conversations[index];
                return ConversationItem(
                  name: conversation['name'],
                  lastMessage: conversation['lastMessage'],
                  time: conversation['time'],
                  isSelected: _selectedConversationIndex == index,
                  hasUnread: conversation['unread'] > 0,
                  unreadCount: conversation['unread'],
                  onTap: () {
                    setState(() {
                      _selectedConversationIndex = index;
                    });
                  },
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemCount: _conversations.length,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationList(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // 搜索栏
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.search, color: AppColors.textSecondaryDark, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '搜索联系人...',
                    style: TextStyle(
                      color: AppColors.textSecondaryDark,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // 会话列表
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemBuilder: (context, index) {
                final conversation = _conversations[index];
                return ConversationItem(
                  name: conversation['name'],
                  lastMessage: conversation['lastMessage'],
                  time: conversation['time'],
                  isSelected: false,
                  hasUnread: conversation['unread'] > 0,
                  unreadCount: conversation['unread'],
                  onTap: () {
                    setState(() {
                      _selectedConversationIndex = index;
                    });
                  },
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemCount: _conversations.length,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatArea(bool isDark) {
    final conversation = _selectedConversationIndex != null
        ? _conversations[_selectedConversationIndex!]
        : null;

    return Container(
      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      child: Column(
        children: [
          // 聊天标题栏
          _buildChatHeader(isDark, conversation),
          // 消息列表
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isSent = message['isSent'] as bool;
                final messageType = message['type'] == 'image'
                    ? MessageType.image
                    : message['type'] == 'file'
                        ? MessageType.file
                        : MessageType.text;
                String? senderName;
                if (!isSent && conversation != null) {
                  senderName = conversation['name'] as String?;
                }
                return MessageBubble(
                  isSent: isSent,
                  type: messageType,
                  text: message['text'] as String?,
                  fileName: message['fileName'] as String?,
                  fileSize: message['fileSize'] as int?,
                  time: message['time'] as String,
                  isRead: message['isRead'] ?? false,
                  senderName: senderName,
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemCount: _messages.length,
            ),
          ),
          // 输入区域
          _buildInputArea(isDark),
        ],
      ),
    );
  }

  Widget _buildChatHeader(bool isDark, Map<String, dynamic>? conversation) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          if (MediaQuery.of(context).size.width < 768)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  setState(() {
                    _selectedConversationIndex = null;
                  });
                },
              ),
            ),
          if (conversation != null)
            AppAvatar(
              name: conversation['name'],
              size: AvatarSize.medium,
              backgroundColor: conversation['avatarColor'],
            ),
          const SizedBox(width: 12),
          if (conversation != null)
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    conversation['name'],
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '在线',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondaryDark,
                    ),
                  ),
                ],
              ),
            ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.phone),
            color: AppColors.textSecondaryDark,
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.videocam),
            color: AppColors.textSecondaryDark,
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            color: AppColors.textSecondaryDark,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.emoji_emotions_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.image_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.attach_file_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.sticky_note_2_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: '输入消息...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    style: TextStyle(
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: Colors.white, size: 20),
                  onPressed: () {
                    if (_messageController.text.trim().isNotEmpty) {
                      setState(() {
                        _messages.add({
                          'isSent': true,
                          'text': _messageController.text.trim(),
                          'time': DateTime.now().toString().substring(11, 16),
                          'isRead': false,
                        });
                        _messageController.clear();
                      });
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildBottomNavItem(Icons.message, '聊天', 0, isDark),
          _buildBottomNavItem(Icons.group, '群组', 1, isDark),
          _buildBottomNavItem(Icons.person_add, '好友', 2, isDark),
        ],
      ),
    );
  }

  Widget _buildBottomNavItem(IconData icon, String label, int index, bool isDark) {
    final isSelected = _selectedNavIndex == index;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedNavIndex = index;
        });
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? AppColors.primary : AppColors.textSecondaryDark,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isSelected ? AppColors.primary : AppColors.textSecondaryDark,
            ),
          ),
        ],
      ),
    );
  }
}
