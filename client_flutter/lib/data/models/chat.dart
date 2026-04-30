import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';
import 'user.dart';

part 'chat.g.dart';

@HiveType(typeId: 6)
enum ConversationType {
  @HiveField(0)
  single,
  @HiveField(1)
  group,
}

@JsonSerializable()
@HiveType(typeId: 2)
class Conversation {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final ConversationType type;
  @HiveField(2)
  final String? name;
  @HiveField(3)
  final String? avatar;
  @HiveField(4)
  final String? description;
  @JsonKey(name: 'last_message')
  @HiveField(5)
  final String? lastMessage;
  @JsonKey(name: 'last_msg_at')
  @HiveField(6)
  final DateTime? lastMsgAt;
  @JsonKey(name: 'created_by')
  @HiveField(7)
  final String createdBy;
  @JsonKey(name: 'created_at')
  @HiveField(8)
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  @HiveField(9)
  final DateTime updatedAt;
  @JsonKey(name: 'unread_count')
  @HiveField(10)
  final int? unreadCount;
  @HiveField(11)
  final List<ConversationMember>? members;

  Conversation({
    required this.id,
    required this.type,
    this.name,
    this.avatar,
    this.description,
    this.lastMessage,
    this.lastMsgAt,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.unreadCount,
    this.members,
  });

  Conversation copyWith({
    String? id,
    ConversationType? type,
    String? name,
    String? avatar,
    String? description,
    String? lastMessage,
    DateTime? lastMsgAt,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? unreadCount,
    List<ConversationMember>? members,
  }) {
    return Conversation(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      description: description ?? this.description,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMsgAt: lastMsgAt ?? this.lastMsgAt,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      unreadCount: unreadCount ?? this.unreadCount,
      members: members ?? this.members,
    );
  }

  factory Conversation.fromJson(Map<String, dynamic> json) => _$ConversationFromJson(json);

  Map<String, dynamic> toJson() => _$ConversationToJson(this);
}

@HiveType(typeId: 7)
enum MemberRole {
  @HiveField(0)
  member,
  @HiveField(1)
  admin,
  @HiveField(2)
  owner,
}

@JsonSerializable()
@HiveType(typeId: 8)
class ConversationMember {
  @HiveField(0)
  final String id;
  @JsonKey(name: 'conversation_id')
  @HiveField(1)
  final String conversationId;
  @JsonKey(name: 'user_id')
  @HiveField(2)
  final String userId;
  @HiveField(3)
  final MemberRole role;
  @HiveField(4)
  final String? nickname;
  @JsonKey(name: 'last_read_at')
  @HiveField(5)
  final DateTime? lastReadAt;
  @JsonKey(name: 'unread_count')
  @HiveField(6)
  final int unreadCount;
  @HiveField(7)
  final bool muted;
  @JsonKey(name: 'joined_at')
  @HiveField(8)
  final DateTime joinedAt;
  @HiveField(9)
  final User? user;

  ConversationMember({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.role,
    this.nickname,
    this.lastReadAt,
    required this.unreadCount,
    required this.muted,
    required this.joinedAt,
    this.user,
  });

  ConversationMember copyWith({
    String? id,
    String? conversationId,
    String? userId,
    MemberRole? role,
    String? nickname,
    DateTime? lastReadAt,
    int? unreadCount,
    bool? muted,
    DateTime? joinedAt,
    User? user,
  }) {
    return ConversationMember(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      nickname: nickname ?? this.nickname,
      lastReadAt: lastReadAt ?? this.lastReadAt,
      unreadCount: unreadCount ?? this.unreadCount,
      muted: muted ?? this.muted,
      joinedAt: joinedAt ?? this.joinedAt,
      user: user ?? this.user,
    );
  }

  factory ConversationMember.fromJson(Map<String, dynamic> json) => _$ConversationMemberFromJson(json);

  Map<String, dynamic> toJson() => _$ConversationMemberToJson(this);
}

@HiveType(typeId: 9)
enum MessageType {
  @HiveField(0)
  text,
  @HiveField(1)
  image,
  @HiveField(2)
  file,
  @HiveField(3)
  system,
}

@JsonSerializable()
@HiveType(typeId: 3)
class Message {
  @HiveField(0)
  final String id;
  @JsonKey(name: 'conversation_id')
  @HiveField(1)
  final String conversationId;
  @JsonKey(name: 'sender_id')
  @HiveField(2)
  final String senderId;
  @HiveField(3)
  final MessageType type;
  @HiveField(4)
  final String content;
  @JsonKey(name: 'media_url')
  @HiveField(5)
  final String? mediaUrl;
  @JsonKey(name: 'file_name')
  @HiveField(6)
  final String? fileName;
  @JsonKey(name: 'file_size')
  @HiveField(7)
  final int? fileSize;
  @JsonKey(name: 'reply_to_id')
  @HiveField(8)
  final String? replyToId;
  @JsonKey(name: 'is_edited')
  @HiveField(9)
  final bool isEdited;
  @JsonKey(name: 'created_at')
  @HiveField(10)
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  @HiveField(11)
  final DateTime updatedAt;
  @HiveField(12)
  final User? sender;
  @HiveField(13)
  final Message? replyTo;
  @JsonKey(name: 'read_count')
  @HiveField(14)
  final int? readCount;
  @JsonKey(name: 'total_count')
  @HiveField(15)
  final int? totalCount;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.type,
    required this.content,
    this.mediaUrl,
    this.fileName,
    this.fileSize,
    this.replyToId,
    required this.isEdited,
    required this.createdAt,
    required this.updatedAt,
    this.sender,
    this.replyTo,
    this.readCount,
    this.totalCount,
  });

  Message copyWith({
    String? id,
    String? conversationId,
    String? senderId,
    MessageType? type,
    String? content,
    String? mediaUrl,
    String? fileName,
    int? fileSize,
    String? replyToId,
    bool? isEdited,
    DateTime? createdAt,
    DateTime? updatedAt,
    User? sender,
    Message? replyTo,
    int? readCount,
    int? totalCount,
  }) {
    return Message(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      type: type ?? this.type,
      content: content ?? this.content,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      replyToId: replyToId ?? this.replyToId,
      isEdited: isEdited ?? this.isEdited,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      sender: sender ?? this.sender,
      replyTo: replyTo ?? this.replyTo,
      readCount: readCount ?? this.readCount,
      totalCount: totalCount ?? this.totalCount,
    );
  }

  factory Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);

  Map<String, dynamic> toJson() => _$MessageToJson(this);
}

@HiveType(typeId: 10)
enum CallType {
  @HiveField(0)
  video,
  @HiveField(1)
  voice,
}

@HiveType(typeId: 11)
enum CallStatus {
  @HiveField(0)
  calling,
  @HiveField(1)
  in_progress,
  @HiveField(2)
  completed,
  @HiveField(3)
  missed,
  @HiveField(4)
  rejected,
  @HiveField(5)
  cancelled,
}

@JsonSerializable()
@HiveType(typeId: 12)
class CallRecord {
  @HiveField(0)
  final String id;
  @JsonKey(name: 'caller_id')
  @HiveField(1)
  final String callerId;
  @JsonKey(name: 'callee_id')
  @HiveField(2)
  final String calleeId;
  @JsonKey(name: 'conversation_id')
  @HiveField(3)
  final String? conversationId;
  @HiveField(4)
  final CallType type;
  @HiveField(5)
  final CallStatus status;
  @JsonKey(name: 'started_at')
  @HiveField(6)
  final DateTime? startedAt;
  @JsonKey(name: 'answered_at')
  @HiveField(7)
  final DateTime? answeredAt;
  @JsonKey(name: 'ended_at')
  @HiveField(8)
  final DateTime? endedAt;
  @HiveField(9)
  final int? duration;
  @JsonKey(name: 'created_at')
  @HiveField(10)
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  @HiveField(11)
  final DateTime updatedAt;
  @HiveField(12)
  final User? caller;
  @HiveField(13)
  final User? callee;

  CallRecord({
    required this.id,
    required this.callerId,
    required this.calleeId,
    this.conversationId,
    required this.type,
    required this.status,
    this.startedAt,
    this.answeredAt,
    this.endedAt,
    this.duration,
    required this.createdAt,
    required this.updatedAt,
    this.caller,
    this.callee,
  });

  CallRecord copyWith({
    String? id,
    String? callerId,
    String? calleeId,
    String? conversationId,
    CallType? type,
    CallStatus? status,
    DateTime? startedAt,
    DateTime? answeredAt,
    DateTime? endedAt,
    int? duration,
    DateTime? createdAt,
    DateTime? updatedAt,
    User? caller,
    User? callee,
  }) {
    return CallRecord(
      id: id ?? this.id,
      callerId: callerId ?? this.callerId,
      calleeId: calleeId ?? this.calleeId,
      conversationId: conversationId ?? this.conversationId,
      type: type ?? this.type,
      status: status ?? this.status,
      startedAt: startedAt ?? this.startedAt,
      answeredAt: answeredAt ?? this.answeredAt,
      endedAt: endedAt ?? this.endedAt,
      duration: duration ?? this.duration,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      caller: caller ?? this.caller,
      callee: callee ?? this.callee,
    );
  }

  factory CallRecord.fromJson(Map<String, dynamic> json) => _$CallRecordFromJson(json);

  Map<String, dynamic> toJson() => _$CallRecordToJson(this);
}

