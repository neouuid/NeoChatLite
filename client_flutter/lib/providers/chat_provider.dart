import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/data/services/chat_service.dart';
import 'package:neochat/data/services/websocket_service.dart';
import 'package:neochat/data/services/storage_service.dart';
import 'package:neochat/providers/services_provider.dart';

final conversationListProvider = StateNotifierProvider<ConversationListNotifier, ConversationListState>((ref) {
  final chatService = ref.watch(chatServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  final wsService = ref.watch(webSocketServiceProvider);
  return ConversationListNotifier(chatService, storageService, wsService);
});

final currentConversationProvider = StateProvider<Conversation?>((ref) => null);

class ConversationListState {
  final bool isLoading;
  final List<Conversation> conversations;
  final String? error;

  ConversationListState({
    this.isLoading = false,
    this.conversations = const [],
    this.error,
  });

  ConversationListState copyWith({
    bool? isLoading,
    List<Conversation>? conversations,
    String? error,
  }) {
    return ConversationListState(
      isLoading: isLoading ?? this.isLoading,
      conversations: conversations ?? this.conversations,
      error: error ?? this.error,
    );
  }
}

class ConversationListNotifier extends StateNotifier<ConversationListState> {
  final ChatService _chatService;
  final StorageService _storageService;
  final WebSocketService _wsService;

  ConversationListNotifier(this._chatService, this._storageService, this._wsService) : super(ConversationListState()) {
    _init();
  }

  Future<void> _init() async {
    await _storageService.init();
    _loadCachedConversations();
    _listenToWebSocket();
    await loadConversations();
  }

  void _loadCachedConversations() {
    final cached = _storageService.getConversations();
    if (cached.isNotEmpty) {
      state = state.copyWith(conversations: cached);
    }
  }

  void _listenToWebSocket() {
    _wsService.conversationStream.listen((conversation) {
      _updateConversation(conversation);
    });
    _wsService.messageStream.listen((message) {
      _updateLastMessage(message);
    });
  }

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _chatService.getConversations();
      if (response.success && response.data != null) {
        final conversations = response.data!;
        await _storageService.saveConversations(conversations);
        state = state.copyWith(
          isLoading: false,
          conversations: conversations,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Failed to load conversations',
        );
      }
    } catch (e, stackTrace) {
      Logger.error('Load conversations failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void _updateConversation(Conversation conversation) {
    final conversations = List<Conversation>.from(state.conversations);
    final index = conversations.indexWhere((c) => c.id == conversation.id);
    if (index != -1) {
      conversations[index] = conversation;
    } else {
      conversations.insert(0, conversation);
    }
    _sortConversations(conversations);
    state = state.copyWith(conversations: conversations);
    _storageService.addConversation(conversation);
  }

  void _updateLastMessage(Message message) {
    final conversations = List<Conversation>.from(state.conversations);
    final index = conversations.indexWhere((c) => c.id == message.conversationId);
    if (index != -1) {
      conversations[index] = conversations[index].copyWith(
        lastMessage: message.content,
        lastMsgAt: message.createdAt,
      );
      _sortConversations(conversations);
      state = state.copyWith(conversations: conversations);
      _storageService.updateConversation(conversations[index]);
    }
  }

  void _sortConversations(List<Conversation> conversations) {
    conversations.sort((a, b) {
      final aTime = a.lastMsgAt ?? a.createdAt;
      final bTime = b.lastMsgAt ?? b.createdAt;
      return bTime.compareTo(aTime);
    });
  }

  Future<Conversation?> createConversation(List<String> userIds, {String? name, String? avatar}) async {
    try {
      final response = await _chatService.createConversation({
        'user_ids': userIds,
        'name': name,
        'avatar': avatar,
      });
      if (response.success && response.data != null) {
        _updateConversation(response.data!);
        return response.data;
      }
      return null;
    } catch (e, stackTrace) {
      Logger.error('Create conversation failed', error: e, stackTrace: stackTrace);
      return null;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final messagesProvider = StateNotifierProvider.family<MessagesNotifier, MessagesState, String>((ref, conversationId) {
  final chatService = ref.watch(chatServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  final wsService = ref.watch(webSocketServiceProvider);
  return MessagesNotifier(conversationId, chatService, storageService, wsService);
});

class MessagesState {
  final bool isLoading;
  final List<Message> messages;
  final bool hasMore;
  final String? error;

  MessagesState({
    this.isLoading = false,
    this.messages = const [],
    this.hasMore = true,
    this.error,
  });

  MessagesState copyWith({
    bool? isLoading,
    List<Message>? messages,
    bool? hasMore,
    String? error,
  }) {
    return MessagesState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      hasMore: hasMore ?? this.hasMore,
      error: error ?? this.error,
    );
  }
}

class MessagesNotifier extends StateNotifier<MessagesState> {
  final String conversationId;
  final ChatService _chatService;
  final StorageService _storageService;
  final WebSocketService _wsService;
  int _page = 1;

  MessagesNotifier(
    this.conversationId,
    this._chatService,
    this._storageService,
    this._wsService,
  ) : super(MessagesState()) {
    _init();
  }

  Future<void> _init() async {
    await _storageService.init();
    _loadCachedMessages();
    _listenToWebSocket();
    await loadMessages();
  }

  void _loadCachedMessages() {
    final cached = _storageService.getMessages(conversationId);
    if (cached.isNotEmpty) {
      state = state.copyWith(messages: cached);
    }
  }

  void _listenToWebSocket() {
    _wsService.messageStream.listen((message) {
      if (message.conversationId == conversationId) {
        _addMessage(message);
      }
    });
  }

  Future<void> loadMessages({bool loadMore = false}) async {
    if (loadMore && !state.hasMore) return;

    if (loadMore) {
      _page++;
    } else {
      _page = 1;
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final response = await _chatService.getMessages(
        conversationId,
        page: _page,
        pageSize: 50,
      );
      if (response.success && response.data != null) {
        final paginatedData = response.data!;
        final newMessages = paginatedData.items;

        List<Message> allMessages;
        if (loadMore) {
          allMessages = List<Message>.from(state.messages);
          allMessages.addAll(newMessages);
        } else {
          allMessages = newMessages;
        }

        if (!loadMore) {
          await _storageService.saveMessages(conversationId, newMessages);
        } else {
          for (final msg in newMessages) {
            await _storageService.addMessage(msg);
          }
        }

        state = state.copyWith(
          isLoading: false,
          messages: allMessages,
          hasMore: paginatedData.items.length >= 50,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Failed to load messages',
        );
      }
    } catch (e, stackTrace) {
      Logger.error('Load messages failed', error: e, stackTrace: stackTrace);
    }
  }

  void _addMessage(Message message) {
    final messages = List<Message>.from(state.messages);
    if (!messages.any((m) => m.id == message.id)) {
      messages.insert(0, message);
      state = state.copyWith(messages: messages);
      _storageService.addMessage(message);
    }
  }

  Future<void> sendMessage(String content, {MessageType type = MessageType.text}) async {
    try {
      _wsService.sendTextMessage(conversationId, content);
    } catch (e, stackTrace) {
      Logger.error('Send message failed', error: e, stackTrace: stackTrace);
    }
  }

  Future<void> sendMediaMessage(MessageType type, String mediaUrl, String fileName, int? fileSize) async {
    try {
      final typeStr = type == MessageType.image ? 'image' : 'file';
      _wsService.sendMediaMessage(conversationId, typeStr, mediaUrl, fileName: fileName, fileSize: fileSize);
    } catch (e, stackTrace) {
      Logger.error('Send media message failed', error: e, stackTrace: stackTrace);
    }
  }

  Future<void> markAsRead(String messageId) async {
    try {
      _wsService.markAsRead(messageId);
    } catch (e, stackTrace) {
      Logger.error('Mark as read failed', error: e, stackTrace: stackTrace);
    }
  }

  Future<void> typing(bool isTyping) async {
    try {
      _wsService.typing(conversationId, isTyping);
    } catch (e, stackTrace) {
      Logger.error('Send typing failed', error: e, stackTrace: stackTrace);
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
