import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/screens/auth/login_screen.dart';
import 'package:neochat/screens/auth/register_screen.dart';
import 'package:neochat/screens/auth/forgot_password_screen.dart';
import 'package:neochat/screens/chat/main_chat_screen.dart';
import 'package:neochat/screens/chat/chat_screen.dart';
import 'package:neochat/screens/chat/group_chat_screen.dart';
import 'package:neochat/screens/friends/friend_manage_screen.dart';
import 'package:neochat/screens/friends/add_friend_screen.dart';
import 'package:neochat/screens/friends/blocklist_screen.dart';
import 'package:neochat/screens/settings/settings_screen.dart';
import 'package:neochat/screens/settings/notification_settings_screen.dart';
import 'package:neochat/screens/settings/theme_screen.dart';
import 'package:neochat/screens/settings/chat_background_screen.dart';
import 'package:neochat/screens/settings/chat_backup_screen.dart';
import 'package:neochat/screens/settings/data_clear_screen.dart';
import 'package:neochat/screens/settings/about_screen.dart';
import 'package:neochat/screens/settings/account_security_screen.dart';
import 'package:neochat/screens/settings/chat_settings_screen.dart';
import 'package:neochat/screens/profile/profile_screen.dart';
import 'package:neochat/screens/profile/view_profile_screen.dart';
import 'package:neochat/screens/groups/group_info_screen.dart';
import 'package:neochat/screens/groups/create_group_screen.dart';
import 'package:neochat/screens/media/image_viewer_screen.dart';
import 'package:neochat/screens/media/file_viewer_screen.dart';
import 'package:neochat/screens/search/search_screen.dart';
import 'package:neochat/screens/favorites/favorites_screen.dart';
import 'package:neochat/screens/chat/forward_screen.dart';
import 'package:neochat/screens/call/video_call_screen.dart';
import 'package:neochat/screens/call/voice_call_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';
      final isRegistering = state.matchedLocation == '/register';
      final isForgotPassword = state.matchedLocation == '/forgot-password';

      if (!isAuthenticated) {
        if (isLoggingIn || isRegistering || isForgotPassword) {
          return null;
        }
        return '/login';
      }

      if (isLoggingIn || isRegistering || isForgotPassword) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const MainChatScreen(),
      ),
      GoRoute(
        path: '/chat/:conversationId',
        name: 'chat',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          return ChatScreen(conversationId: conversationId);
        },
      ),
      GoRoute(
        path: '/group-chat/:conversationId',
        name: 'group-chat',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          return GroupChatScreen(conversationId: conversationId);
        },
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/profile/:userId',
        name: 'view-profile',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return ViewProfileScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/friends',
        name: 'friends',
        builder: (context, state) => const FriendManageScreen(),
      ),
      GoRoute(
        path: '/add-friend',
        name: 'add-friend',
        builder: (context, state) => const AddFriendScreen(),
      ),
      GoRoute(
        path: '/blocklist',
        name: 'blocklist',
        builder: (context, state) => const BlocklistScreen(),
      ),
      GoRoute(
        path: '/group-info/:groupId',
        name: 'group-info',
        builder: (context, state) {
          final groupId = state.pathParameters['groupId']!;
          return GroupInfoScreen(groupId: groupId);
        },
      ),
      GoRoute(
        path: '/create-group',
        name: 'create-group',
        builder: (context, state) => const CreateGroupScreen(),
      ),
      GoRoute(
        path: '/image-viewer',
        name: 'image-viewer',
        builder: (context, state) {
          final url = state.uri.queryParameters['url']!;
          return ImageViewerScreen(url: url);
        },
      ),
      GoRoute(
        path: '/file-viewer',
        name: 'file-viewer',
        builder: (context, state) {
          final url = state.uri.queryParameters['url']!;
          final name = state.uri.queryParameters['name'] ?? '文件';
          final size = state.uri.queryParameters['size'] != null ? int.tryParse(state.uri.queryParameters['size']!) : null;
          return FileViewerScreen(url: url, name: name, size: size);
        },
      ),
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/chat-settings/:conversationId',
        name: 'chat-settings',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          return ChatSettingsScreen(conversationId: conversationId);
        },
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/notification-settings',
        name: 'notification-settings',
        builder: (context, state) => const NotificationSettingsScreen(),
      ),
      GoRoute(
        path: '/theme',
        name: 'theme',
        builder: (context, state) => const ThemeScreen(),
      ),
      GoRoute(
        path: '/chat-background',
        name: 'chat-background',
        builder: (context, state) => const ChatBackgroundScreen(),
      ),
      GoRoute(
        path: '/chat-backup',
        name: 'chat-backup',
        builder: (context, state) => const ChatBackupScreen(),
      ),
      GoRoute(
        path: '/data-clear',
        name: 'data-clear',
        builder: (context, state) => const DataClearScreen(),
      ),
      GoRoute(
        path: '/about',
        name: 'about',
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/favorites',
        name: 'favorites',
        builder: (context, state) => const FavoritesScreen(),
      ),
      GoRoute(
        path: '/account-security',
        name: 'account-security',
        builder: (context, state) => const AccountSecurityScreen(),
      ),
      GoRoute(
        path: '/forward/:messageId',
        name: 'forward',
        builder: (context, state) {
          final messageId = state.pathParameters['messageId']!;
          return ForwardScreen(messageId: messageId);
        },
      ),
      GoRoute(
        path: '/video-call',
        name: 'video-call',
        builder: (context, state) {
          final conversationId = state.uri.queryParameters['conversationId']!;
          final userId = state.uri.queryParameters['userId']!;
          return VideoCallScreen(conversationId: conversationId, userId: userId);
        },
      ),
      GoRoute(
        path: '/voice-call',
        name: 'voice-call',
        builder: (context, state) {
          final conversationId = state.uri.queryParameters['conversationId']!;
          final userId = state.uri.queryParameters['userId']!;
          return VoiceCallScreen(conversationId: conversationId, userId: userId);
        },
      ),
    ],
  );
});
