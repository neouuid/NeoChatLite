import 'package:hive/hive.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:neochat/core/constants/app_constants.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/models/chat.dart';

class StorageService {
  static const String _boxConversations = 'conversations';
  static const String _boxMessages = 'messages';
  static const String _boxFriends = 'friends';
  static const String _boxUser = 'user';

  late SharedPreferences _prefs;
  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;

    _prefs = await SharedPreferences.getInstance();

    // Initialize Hive boxes
    if (!Hive.isBoxOpen(_boxConversations)) {
      await Hive.openBox<Conversation>(_boxConversations);
    }
    if (!Hive.isBoxOpen(_boxMessages)) {
      await Hive.openBox<Message>(_boxMessages);
    }
    if (!Hive.isBoxOpen(_boxFriends)) {
      await Hive.openBox<Friend>(_boxFriends);
    }
    if (!Hive.isBoxOpen(_boxUser)) {
      await Hive.openBox<User>(_boxUser);
    }

    _isInitialized = true;
    Logger.debug('StorageService initialized');
  }

  // Token management
  String? getAccessToken() {
    return _prefs.getString(AppConstants.storageKeyAccessToken);
  }

  Future<void> setAccessToken(String token) async {
    await _prefs.setString(AppConstants.storageKeyAccessToken, token);
  }

  String? getRefreshToken() {
    return _prefs.getString(AppConstants.storageKeyRefreshToken);
  }

  Future<void> setRefreshToken(String token) async {
    await _prefs.setString(AppConstants.storageKeyRefreshToken, token);
  }

  Future<void> clearTokens() async {
    await _prefs.remove(AppConstants.storageKeyAccessToken);
    await _prefs.remove(AppConstants.storageKeyRefreshToken);
  }

  // User management
  User? getCurrentUser() {
    final box = Hive.box<User>(_boxUser);
    return box.get('current');
  }

  Future<void> setCurrentUser(User user) async {
    final box = Hive.box<User>(_boxUser);
    await box.put('current', user);
  }

  Future<void> clearCurrentUser() async {
    final box = Hive.box<User>(_boxUser);
    await box.delete('current');
  }

  // Theme & Language
  String? getThemeMode() {
    return _prefs.getString(AppConstants.storageKeyThemeMode);
  }

  Future<void> setThemeMode(String mode) async {
    await _prefs.setString(AppConstants.storageKeyThemeMode, mode);
  }

  String? getLanguage() {
    return _prefs.getString(AppConstants.storageKeyLanguage);
  }

  Future<void> setLanguage(String language) async {
    await _prefs.setString(AppConstants.storageKeyLanguage, language);
  }

  // Conversations
  List<Conversation> getConversations() {
    final box = Hive.box<Conversation>(_boxConversations);
    return box.values.toList();
  }

  Future<void> saveConversations(List<Conversation> conversations) async {
    final box = Hive.box<Conversation>(_boxConversations);
    await box.clear();
    for (final conv in conversations) {
      await box.put(conv.id, conv);
    }
  }

  Future<void> addConversation(Conversation conversation) async {
    final box = Hive.box<Conversation>(_boxConversations);
    await box.put(conversation.id, conversation);
  }

  Future<void> updateConversation(Conversation conversation) async {
    final box = Hive.box<Conversation>(_boxConversations);
    await box.put(conversation.id, conversation);
  }

  Future<void> deleteConversation(String conversationId) async {
    final box = Hive.box<Conversation>(_boxConversations);
    await box.delete(conversationId);
  }

  Conversation? getConversation(String conversationId) {
    final box = Hive.box<Conversation>(_boxConversations);
    return box.get(conversationId);
  }

  // Messages
  List<Message> getMessages(String conversationId) {
    final box = Hive.box<Message>(_boxMessages);
    return box.values
        .where((msg) => msg.conversationId == conversationId)
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> saveMessages(String conversationId, List<Message> messages) async {
    final box = Hive.box<Message>(_boxMessages);
    // Delete old messages for this conversation
    final oldMessages = box.values
        .where((msg) => msg.conversationId == conversationId)
        .toList();
    for (final msg in oldMessages) {
      await box.delete(msg.id);
    }
    // Add new messages
    for (final msg in messages) {
      await box.put(msg.id, msg);
    }
  }

  Future<void> addMessage(Message message) async {
    final box = Hive.box<Message>(_boxMessages);
    await box.put(message.id, message);
  }

  Future<void> updateMessage(Message message) async {
    final box = Hive.box<Message>(_boxMessages);
    await box.put(message.id, message);
  }

  Future<void> deleteMessage(String messageId) async {
    final box = Hive.box<Message>(_boxMessages);
    await box.delete(messageId);
  }

  Message? getMessage(String messageId) {
    final box = Hive.box<Message>(_boxMessages);
    return box.get(messageId);
  }

  // Friends
  List<Friend> getFriends() {
    final box = Hive.box<Friend>(_boxFriends);
    return box.values.toList();
  }

  Future<void> saveFriends(List<Friend> friends) async {
    final box = Hive.box<Friend>(_boxFriends);
    await box.clear();
    for (final friend in friends) {
      await box.put(friend.id, friend);
    }
  }

  Future<void> addFriend(Friend friend) async {
    final box = Hive.box<Friend>(_boxFriends);
    await box.put(friend.id, friend);
  }

  Future<void> updateFriend(Friend friend) async {
    final box = Hive.box<Friend>(_boxFriends);
    await box.put(friend.id, friend);
  }

  Future<void> deleteFriend(String friendId) async {
    final box = Hive.box<Friend>(_boxFriends);
    await box.delete(friendId);
  }

  Friend? getFriend(String friendId) {
    final box = Hive.box<Friend>(_boxFriends);
    return box.get(friendId);
  }

  // Clear all data
  Future<void> clearAll() async {
    await clearTokens();
    await clearCurrentUser();

    final convBox = Hive.box<Conversation>(_boxConversations);
    await convBox.clear();

    final msgBox = Hive.box<Message>(_boxMessages);
    await msgBox.clear();

    final friendBox = Hive.box<Friend>(_boxFriends);
    await friendBox.clear();

    final userBox = Hive.box<User>(_boxUser);
    await userBox.clear();

    Logger.debug('All storage data cleared');
  }

  // Close boxes (for app shutdown)
  Future<void> close() async {
    await Hive.close();
  }
}
