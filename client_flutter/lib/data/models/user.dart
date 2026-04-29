import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';

part 'user.g.dart';

@HiveType(typeId: 4)
enum UserStatus {
  @HiveField(0)
  online,
  @HiveField(1)
  offline,
  @HiveField(2)
  away,
  @HiveField(3)
  busy,
  @HiveField(4)
  dnd,
}

@JsonSerializable()
@HiveType(typeId: 0)
class User {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String username;
  @HiveField(2)
  final String? email;
  @HiveField(3)
  final String? phone;
  @HiveField(4)
  final String nickname;
  @HiveField(5)
  final String? avatar;
  @HiveField(6)
  final String? bio;
  @HiveField(7)
  final UserStatus status;
  @JsonKey(name: 'created_at')
  @HiveField(8)
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  @HiveField(9)
  final DateTime updatedAt;

  User({
    required this.id,
    required this.username,
    this.email,
    this.phone,
    required this.nickname,
    this.avatar,
    this.bio,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? phone,
    String? nickname,
    String? avatar,
    String? bio,
    UserStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      nickname: nickname ?? this.nickname,
      avatar: avatar ?? this.avatar,
      bio: bio ?? this.bio,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
@HiveType(typeId: 1)
class Friend {
  @HiveField(0)
  final String id;
  @JsonKey(name: 'user_id')
  @HiveField(1)
  final String userId;
  @JsonKey(name: 'friend_id')
  @HiveField(2)
  final String friendId;
  @HiveField(3)
  final String? alias;
  @HiveField(4)
  final FriendStatus status;
  @JsonKey(name: 'created_at')
  @HiveField(5)
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  @HiveField(6)
  final DateTime updatedAt;
  @HiveField(7)
  final User? friend;

  Friend({
    required this.id,
    required this.userId,
    required this.friendId,
    this.alias,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.friend,
  });

  Friend copyWith({
    String? id,
    String? userId,
    String? friendId,
    String? alias,
    FriendStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    User? friend,
  }) {
    return Friend(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      friendId: friendId ?? this.friendId,
      alias: alias ?? this.alias,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      friend: friend ?? this.friend,
    );
  }

  factory Friend.fromJson(Map<String, dynamic> json) => _$FriendFromJson(json);

  Map<String, dynamic> toJson() => _$FriendToJson(this);
}

@HiveType(typeId: 5)
enum FriendStatus {
  @HiveField(0)
  pending,
  @HiveField(1)
  accepted,
  @HiveField(2)
  blocked,
}
