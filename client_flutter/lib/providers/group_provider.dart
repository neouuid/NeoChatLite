import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/data/models/group.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/services/user_service.dart';
import 'package:neochat/providers/services_provider.dart';

final groupProvider = StateNotifierProvider.family<GroupNotifier, GroupState, String>((ref, groupId) {
  final userService = ref.watch(userServiceProvider);
  return GroupNotifier(userService, groupId);
});

class GroupState {
  final Group? group;
  final List<User> members;
  final bool isLoading;
  final String? error;

  GroupState({
    this.group,
    this.members = const [],
    this.isLoading = false,
    this.error,
  });

  GroupState copyWith({
    Group? group,
    List<User>? members,
    bool? isLoading,
    String? error,
  }) {
    return GroupState(
      group: group ?? this.group,
      members: members ?? this.members,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class GroupNotifier extends StateNotifier<GroupState> {
  final UserService _userService;
  final String _groupId;

  GroupNotifier(this._userService, this._groupId) : super(GroupState(isLoading: true)) {
    loadGroup();
  }

  Future<void> loadGroup() async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      final groupResponse = await _userService.getGroup(_groupId);
      final membersResponse = await _userService.getGroupMembers(_groupId);
      state = state.copyWith(
        group: groupResponse.data,
        members: membersResponse.data,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> updateGroup(Map<String, dynamic> data) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      final response = await _userService.updateGroup(_groupId, data);
      state = state.copyWith(group: response.data, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> addMembers(List<String> userIds) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      await _userService.inviteGroupMembers(_groupId, userIds);
      await loadGroup();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> removeMember(String userId) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      await _userService.removeGroupMember(_groupId, userId);
      await loadGroup();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> leaveGroup() async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      await _userService.leaveGroup(_groupId);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}
