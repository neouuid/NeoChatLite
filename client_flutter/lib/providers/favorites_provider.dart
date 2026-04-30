import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/favorite.dart';
import 'package:neochat/data/services/chat_service.dart';
import 'package:neochat/providers/services_provider.dart';

class FavoritesState {
  final List<Favorite> favorites;
  final bool isLoading;
  final String? error;

  FavoritesState({
    this.favorites = const [],
    this.isLoading = false,
    this.error,
  });

  FavoritesState copyWith({
    List<Favorite>? favorites,
    bool? isLoading,
    String? error,
  }) {
    return FavoritesState(
      favorites: favorites ?? this.favorites,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  final ChatService _chatService;

  FavoritesNotifier(this._chatService) : super(FavoritesState());

  Future<void> loadFavorites() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _chatService.getFavorites();

      if (response.success) {
        state = state.copyWith(favorites: response.data ?? [], isLoading: false);
      } else {
        state = state.copyWith(error: response.message, isLoading: false);
      }
    } catch (e) {
      Logger.error('Failed to load favorites: $e');
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<bool> addFavorite(String messageId, {String? note}) async {
    try {
      final response = await _chatService.addFavorite(messageId, note: note);

      if (response.success && response.data != null) {
        state = state.copyWith(
          favorites: [response.data!, ...state.favorites],
        );
        return true;
      } else {
        return false;
      }
    } catch (e) {
      Logger.error('Failed to add favorite: $e');
      return false;
    }
  }

  Future<bool> removeFavorite(String favoriteId) async {
    try {
      final response = await _chatService.removeFavorite(favoriteId);

      if (response.success) {
        state = state.copyWith(
          favorites: state.favorites.where((f) => f.id != favoriteId).toList(),
        );
        return true;
      } else {
        return false;
      }
    } catch (e) {
      Logger.error('Failed to remove favorite: $e');
      return false;
    }
  }
}

final favoritesProvider = StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
  final chatService = ref.watch(chatServiceProvider);
  final notifier = FavoritesNotifier(chatService);
  notifier.loadFavorites();
  return notifier;
});
