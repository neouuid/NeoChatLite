import 'package:json_annotation/json_annotation.dart';

part 'group.g.dart';

@JsonSerializable()
class Group {
  final String id;
  final String name;
  final String? description;
  final String? avatar;
  @JsonKey(name: 'owner_id')
  final String ownerId;
  @JsonKey(name: 'max_members')
  final int maxMembers;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'member_count')
  final int? memberCount;

  Group({
    required this.id,
    required this.name,
    this.description,
    this.avatar,
    required this.ownerId,
    required this.maxMembers,
    required this.createdAt,
    required this.updatedAt,
    this.memberCount,
  });

  Group copyWith({
    String? id,
    String? name,
    String? description,
    String? avatar,
    String? ownerId,
    int? maxMembers,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? memberCount,
  }) {
    return Group(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      avatar: avatar ?? this.avatar,
      ownerId: ownerId ?? this.ownerId,
      maxMembers: maxMembers ?? this.maxMembers,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      memberCount: memberCount ?? this.memberCount,
    );
  }

  factory Group.fromJson(Map<String, dynamic> json) => _$GroupFromJson(json);

  Map<String, dynamic> toJson() => _$GroupToJson(this);
}
