import 'package:json_annotation/json_annotation.dart';
import 'chat.dart';

part 'favorite.g.dart';

@JsonSerializable()
class Favorite {
  final String id;
  @JsonKey(name: 'user_id')
  final String userId;
  @JsonKey(name: 'message_id')
  final String messageId;
  final String? note;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  final Message? message;

  Favorite({
    required this.id,
    required this.userId,
    required this.messageId,
    this.note,
    required this.createdAt,
    this.message,
  });

  Favorite copyWith({
    String? id,
    String? userId,
    String? messageId,
    String? note,
    DateTime? createdAt,
    Message? message,
  }) {
    return Favorite(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      messageId: messageId ?? this.messageId,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      message: message ?? this.message,
    );
  }

  factory Favorite.fromJson(Map<String, dynamic> json) =>
      _$FavoriteFromJson(json);

  Map<String, dynamic> toJson() => _$FavoriteToJson(this);
}
