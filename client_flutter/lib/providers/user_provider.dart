import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/services/user_service.dart';
import 'package:neochat/data/services/storage_service.dart';
import 'package:neochat/providers/services_provider.dart';

final friendListProvider = StateNotifierProvider<FriendListNotifier, FriendListState>((ref) {
  final userService = ref.watch(userServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  return FriendListNotifier(userService, storageService);
});

class FriendListState {
  final bool isLoading;
  final List<Friend> friends;
  final String? error;

  FriendListState({
    this.isLoading = false,
    this.friends = const [],
    this.error,
  });

  FriendListState copyWith({
    bool? isLoading,
    List<Friend>? friends,
    String? error,
  }) {
    return FriendListState(
      isLoading: isLoading ?? this.isLoading,
      friends: friends ?? this.friends,
      error: error ?? this.error,
    );
  }
}

class FriendListNotifier extends StateNotifier<FriendListState> {
  final UserService _userService;
  final StorageService _storageService;

  FriendListNotifier(this._userService, this._storageService) : super(FriendListState()) {
    _init();
  }

  Future<void> _init() async {
    await _storageService.init();
    _loadCachedFriends();
    await loadFriends();
  }

  void _loadCachedFriends() {
    final cached = _storageService.getFriends();
    if (cached.isNotEmpty) {
      state = state.copyWith(friends: cached);
    }
  }

  Future<void> loadFriends() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _userService.getFriends();
      if (response.success && response.data != null) {
        final friends = response.data!;
        await _storageService.saveFriends(friends);
        state = state.copyWith(
          isLoading: false,
          friends: friends,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Failed to load friends',
        );
      }
    } catch (e, stackTrace) {
      Logger.error('Load friends failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> sendFriendRequest(String userId) async {
    try {
      final response = await _userService.sendFriendRequest(userId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to send request');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Send friend request failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> acceptFriendRequest(String requestId) async {
    try {
      final response = await _userService.acceptFriendRequest(requestId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to accept request');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Accept friend request failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> rejectFriendRequest(String requestId) async {
    try {
      final response = await _userService.rejectFriendRequest(requestId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to reject request');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Reject friend request failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> removeFriend(String friendId) async {
    try {
      final response = await _userService.deleteFriend(friendId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to remove friend');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Remove friend failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> blockUser(String userId) async {
    try {
      final response = await _userService.blockUser(userId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to block user');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Block user failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> unblockUser(String userId) async {
    try {
      final response = await _userService.unblockUser(userId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      state = state.copyWith(error: response.message ?? 'Failed to unblock user');
      return false;
    } catch (e, stackTrace) {
      Logger.error('Unblock user failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
