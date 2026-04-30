import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/group.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/group_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class GroupInfoScreen extends ConsumerStatefulWidget {
  const GroupInfoScreen({super.key, required this.groupId, this.conversationId});

  final String groupId;
  final String? conversationId;

  @override
  ConsumerState<GroupInfoScreen> createState() => _GroupInfoScreenState();
}

class _GroupInfoScreenState extends ConsumerState<GroupInfoScreen> {
  bool _isEditingName = false;
  bool _isEditingDescription = false;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  bool _muteNotifications = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final groupState = ref.watch(groupProvider(widget.groupId));
    final authState = ref.watch(authStateProvider);
    final isOwner = groupState.group?.ownerId == authState.user?.id;

    if (groupState.isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          title: const Text('群组信息'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (groupState.error != null) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          title: const Text('群组信息'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '加载失败: ${groupState.error}',
                style: TextStyle(color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
              ),
              const SizedBox(height: 16),
              AppButton(
                text: '重试',
                onPressed: () => ref.read(groupProvider(widget.groupId).notifier).loadGroup(),
              ),
            ],
          ),
        ),
      );
    }

    final group = groupState.group;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('群组信息'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildGroupHeader(isDark, group, isOwner),
          const SizedBox(height: 24),
          _buildMembersSection(isDark, groupState.members, isOwner),
          const SizedBox(height: 24),
          _buildSettingsSection(isDark, isOwner),
          const SizedBox(height: 24),
          _buildDangerZone(isDark, isOwner),
        ],
      ),
    );
  }

  Widget _buildGroupHeader(bool isDark, Group? group, bool isOwner) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Stack(
            children: [
              AppAvatar(
                name: group?.name ?? '群组',
                size: AvatarSize.large,
                avatarUrl: group?.avatar,
              ),
              if (isOwner)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: _pickAvatar,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        Icons.camera_alt,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isEditingName)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Row(
                children: [
                  Expanded(
                    child: AppInput(
                      controller: _nameController,
                      hint: '群名称',
                      onSubmitted: (_) => _saveName(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.check, color: AppColors.primary),
                    onPressed: _saveName,
                  ),
                ],
              ),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  group?.name ?? '群组名称',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
                if (isOwner)
                  IconButton(
                    icon: const Icon(Icons.edit, size: 18),
                    onPressed: () {
                      _nameController.text = group?.name ?? '';
                      setState(() => _isEditingName = true);
                    },
                  ),
              ],
            ),
          const SizedBox(height: 4),
          if (_isEditingDescription)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Row(
                children: [
                  Expanded(
                    child: AppInput(
                      controller: _descriptionController,
                      hint: '群描述',
                      onSubmitted: (_) => _saveDescription(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.check, color: AppColors.primary),
                    onPressed: _saveDescription,
                  ),
                ],
              ),
            )
          else if (group?.description != null && group!.description!.isNotEmpty)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  group.description!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
                if (isOwner)
                  IconButton(
                    icon: const Icon(Icons.edit, size: 16),
                    onPressed: () {
                      _descriptionController.text = group.description ?? '';
                      setState(() => _isEditingDescription = true);
                    },
                  ),
              ],
            )
          else if (isOwner)
            TextButton.icon(
              onPressed: () {
                setState(() => _isEditingDescription = true);
              },
              icon: const Icon(Icons.add, size: 16),
              label: const Text('添加群描述', style: TextStyle(fontSize: 14)),
            ),
        ],
      ),
    );
  }

  Widget _buildMembersSection(bool isDark, List<User> members, bool isOwner) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.people),
            title: const Text('群成员'),
            subtitle: Text('${members.length} 人'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showMembersList(members),
          ),
          Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
          ListTile(
            leading: const Icon(Icons.person_add),
            title: const Text('添加成员'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showAddMembers(),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(bool isDark, bool isOwner) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          SwitchListTile(
            secondary: const Icon(Icons.notifications_outlined),
            title: const Text('消息免打扰'),
            value: _muteNotifications,
            onChanged: (value) {
              setState(() => _muteNotifications = value);
            },
            activeColor: AppColors.primary,
          ),
          if (isOwner) ...[
            Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('修改群名称'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                final group = ref.read(groupProvider(widget.groupId)).group;
                _nameController.text = group?.name ?? '';
                setState(() => _isEditingName = true);
              },
            ),
            Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
            ListTile(
              leading: const Icon(Icons.image),
              title: const Text('群头像'),
              trailing: const Icon(Icons.chevron_right),
              onTap: _pickAvatar,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDangerZone(bool isDark, bool isOwner) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.exit_to_app, color: AppColors.error),
            title: const Text('退出群组', style: TextStyle(color: AppColors.error)),
            onTap: () => _showLeaveDialog(isOwner),
          ),
        ],
      ),
    );
  }

  Future<void> _saveName() async {
    if (_nameController.text.trim().isEmpty) {
      setState(() => _isEditingName = false);
      return;
    }

    final success = await ref
        .read(groupProvider(widget.groupId).notifier)
        .updateGroup({'name': _nameController.text.trim()});

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('群名称已更新')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新失败: ${ref.read(groupProvider(widget.groupId)).error}'),
          backgroundColor: AppColors.error,
        ),
      );
    }

    setState(() => _isEditingName = false);
  }

  Future<void> _saveDescription() async {
    final success = await ref
        .read(groupProvider(widget.groupId).notifier)
        .updateGroup({'description': _descriptionController.text.trim()});

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('群描述已更新')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新失败: ${ref.read(groupProvider(widget.groupId)).error}'),
          backgroundColor: AppColors.error,
        ),
      );
    }

    setState(() => _isEditingDescription = false);
  }

  Future<void> _pickAvatar() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('头像上传功能待实现')),
      );
    }
  }

  void _showMembersList(List<User> members) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textSecondaryDark,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                '群成员 (${members.length})',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
            ),
            Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
            Expanded(
              child: ListView.builder(
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  return ListTile(
                    leading: AppAvatar(
                      name: member.nickname,
                      size: AvatarSize.small,
                      avatarUrl: member.avatar,
                    ),
                    title: Text(
                      member.nickname,
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                    subtitle: Text(
                      '@${member.username}',
                      style: const TextStyle(color: AppColors.textSecondaryDark),
                    ),
                    onTap: () {
                      context.pop();
                      context.push('/profile/${member.id}');
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddMembers() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('添加成员功能待实现')),
    );
  }

  void _showLeaveDialog(bool isOwner) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isOwner ? '确定解散群组？' : '确定退出群组？'),
        content: Text(isOwner ? '解散后所有成员将无法查看聊天记录' : '退出后将无法查看聊天记录'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              context.pop();
              final success = await ref.read(groupProvider(widget.groupId).notifier).leaveGroup();
              if (mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(isOwner ? '群组已解散' : '已退出群组')),
                  );
                  context.go('/');
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('操作失败: ${ref.read(groupProvider(widget.groupId)).error}'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            child: Text(
              isOwner ? '解散' : '确定',
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
