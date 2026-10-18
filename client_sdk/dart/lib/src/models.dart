// 由 scripts/gen_dart_client.py 根据 swagger.json 生成，请勿手工修改。

// ignore_for_file: non_constant_identifier_names, unused_element

class User {
  String? avatar;
  String? bio;
  String? createdAt;
  String? email;
  String? id;
  String? nickname;
  String? phone;
  String? status;
  String? updatedAt;
  String? username;

  User({
    this.avatar,
    this.bio,
    this.createdAt,
    this.email,
    this.id,
    this.nickname,
    this.phone,
    this.status,
    this.updatedAt,
    this.username,
  });

  static User? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return User._fromMap(map);
  }

  factory User._fromMap(Map<String, dynamic> map) {
    final obj = User();
    obj.avatar = map['avatar'] as String?;
    obj.bio = map['bio'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.email = map['email'] as String?;
    obj.id = map['id'] as String?;
    obj.nickname = map['nickname'] as String?;
    obj.phone = map['phone'] as String?;
    obj.status = map['status'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    obj.username = map['username'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (avatar != null) map['avatar'] = avatar;
    if (bio != null) map['bio'] = bio;
    if (createdAt != null) map['created_at'] = createdAt;
    if (email != null) map['email'] = email;
    if (id != null) map['id'] = id;
    if (nickname != null) map['nickname'] = nickname;
    if (phone != null) map['phone'] = phone;
    if (status != null) map['status'] = status;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    if (username != null) map['username'] = username;
    return map;
  }
}

class ApiResponse {
  dynamic data;
  dynamic errors;
  String? message;
  bool? success;

  ApiResponse({
    this.data,
    this.errors,
    this.message,
    this.success,
  });

  static ApiResponse? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return ApiResponse._fromMap(map);
  }

  factory ApiResponse._fromMap(Map<String, dynamic> map) {
    final obj = ApiResponse();
    obj.data = map['data'];
    obj.errors = map['errors'];
    obj.message = map['message'] as String?;
    obj.success = map['success'] as bool?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (data != null) map['data'] = data;
    if (errors != null) map['errors'] = errors;
    if (message != null) map['message'] = message;
    if (success != null) map['success'] = success;
    return map;
  }
}

class AuthResponse {
  String? accessToken;
  String? refreshToken;
  User? user;

  AuthResponse({
    this.accessToken,
    this.refreshToken,
    this.user,
  });

  static AuthResponse? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return AuthResponse._fromMap(map);
  }

  factory AuthResponse._fromMap(Map<String, dynamic> map) {
    final obj = AuthResponse();
    obj.accessToken = map['access_token'] as String?;
    obj.refreshToken = map['refresh_token'] as String?;
    obj.user = User.fromJson(map['user']);
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (accessToken != null) map['access_token'] = accessToken;
    if (refreshToken != null) map['refresh_token'] = refreshToken;
    if (user != null) map['user'] = user!.toJson();
    return map;
  }
}

class ChangePasswordRequest {
  String? newPassword;
  String? oldPassword;

  ChangePasswordRequest({
    this.newPassword,
    this.oldPassword,
  });

  static ChangePasswordRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return ChangePasswordRequest._fromMap(map);
  }

  factory ChangePasswordRequest._fromMap(Map<String, dynamic> map) {
    final obj = ChangePasswordRequest();
    obj.newPassword = map['new_password'] as String?;
    obj.oldPassword = map['old_password'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (newPassword != null) map['new_password'] = newPassword;
    if (oldPassword != null) map['old_password'] = oldPassword;
    return map;
  }
}

class ForgotPasswordRequest {
  String? email;

  ForgotPasswordRequest({
    this.email,
  });

  static ForgotPasswordRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return ForgotPasswordRequest._fromMap(map);
  }

  factory ForgotPasswordRequest._fromMap(Map<String, dynamic> map) {
    final obj = ForgotPasswordRequest();
    obj.email = map['email'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (email != null) map['email'] = email;
    return map;
  }
}

class LoginRequest {
  String? identifier;
  String? password;

  LoginRequest({
    this.identifier,
    this.password,
  });

  static LoginRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return LoginRequest._fromMap(map);
  }

  factory LoginRequest._fromMap(Map<String, dynamic> map) {
    final obj = LoginRequest();
    obj.identifier = map['identifier'] as String?;
    obj.password = map['password'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (identifier != null) map['identifier'] = identifier;
    if (password != null) map['password'] = password;
    return map;
  }
}

class RegisterRequest {
  String? email;
  String? nickname;
  String? password;
  String? phone;
  String? username;

  RegisterRequest({
    this.email,
    this.nickname,
    this.password,
    this.phone,
    this.username,
  });

  static RegisterRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return RegisterRequest._fromMap(map);
  }

  factory RegisterRequest._fromMap(Map<String, dynamic> map) {
    final obj = RegisterRequest();
    obj.email = map['email'] as String?;
    obj.nickname = map['nickname'] as String?;
    obj.password = map['password'] as String?;
    obj.phone = map['phone'] as String?;
    obj.username = map['username'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (email != null) map['email'] = email;
    if (nickname != null) map['nickname'] = nickname;
    if (password != null) map['password'] = password;
    if (phone != null) map['phone'] = phone;
    if (username != null) map['username'] = username;
    return map;
  }
}

class ResetPasswordRequest {
  String? newPassword;
  String? token;

  ResetPasswordRequest({
    this.newPassword,
    this.token,
  });

  static ResetPasswordRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return ResetPasswordRequest._fromMap(map);
  }

  factory ResetPasswordRequest._fromMap(Map<String, dynamic> map) {
    final obj = ResetPasswordRequest();
    obj.newPassword = map['new_password'] as String?;
    obj.token = map['token'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (newPassword != null) map['new_password'] = newPassword;
    if (token != null) map['token'] = token;
    return map;
  }
}

class VerifyEmailRequest {
  String? code;

  VerifyEmailRequest({
    this.code,
  });

  static VerifyEmailRequest? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return VerifyEmailRequest._fromMap(map);
  }

  factory VerifyEmailRequest._fromMap(Map<String, dynamic> map) {
    final obj = VerifyEmailRequest();
    obj.code = map['code'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (code != null) map['code'] = code;
    return map;
  }
}

class CallRecord {
  String? answeredAt;
  User? callee;
  String? calleeId;
  dynamic caller;
  String? callerId;
  String? conversationId;
  String? createdAt;
  int? duration;
  String? endedAt;
  String? id;
  String? startedAt;
  String? status;
  String? type;
  String? updatedAt;

  CallRecord({
    this.answeredAt,
    this.callee,
    this.calleeId,
    this.caller,
    this.callerId,
    this.conversationId,
    this.createdAt,
    this.duration,
    this.endedAt,
    this.id,
    this.startedAt,
    this.status,
    this.type,
    this.updatedAt,
  });

  static CallRecord? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return CallRecord._fromMap(map);
  }

  factory CallRecord._fromMap(Map<String, dynamic> map) {
    final obj = CallRecord();
    obj.answeredAt = map['answered_at'] as String?;
    obj.callee = User.fromJson(map['callee']);
    obj.calleeId = map['callee_id'] as String?;
    obj.caller = map['caller'];
    obj.callerId = map['caller_id'] as String?;
    obj.conversationId = map['conversation_id'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.duration = (map['duration'] as num?)?.toInt();
    obj.endedAt = map['ended_at'] as String?;
    obj.id = map['id'] as String?;
    obj.startedAt = map['started_at'] as String?;
    obj.status = map['status'] as String?;
    obj.type = map['type'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (answeredAt != null) map['answered_at'] = answeredAt;
    if (callee != null) map['callee'] = callee!.toJson();
    if (calleeId != null) map['callee_id'] = calleeId;
    if (caller != null) map['caller'] = caller;
    if (callerId != null) map['caller_id'] = callerId;
    if (conversationId != null) map['conversation_id'] = conversationId;
    if (createdAt != null) map['created_at'] = createdAt;
    if (duration != null) map['duration'] = duration;
    if (endedAt != null) map['ended_at'] = endedAt;
    if (id != null) map['id'] = id;
    if (startedAt != null) map['started_at'] = startedAt;
    if (status != null) map['status'] = status;
    if (type != null) map['type'] = type;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    return map;
  }
}

class Conversation {
  String? avatar;
  String? createdAt;
  String? createdBy;
  String? id;
  String? lastMessage;
  String? lastMsgAt;
  List<ConversationMember>? members;
  String? name;
  String? type;
  String? updatedAt;

  Conversation({
    this.avatar,
    this.createdAt,
    this.createdBy,
    this.id,
    this.lastMessage,
    this.lastMsgAt,
    this.members,
    this.name,
    this.type,
    this.updatedAt,
  });

  static Conversation? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Conversation._fromMap(map);
  }

  factory Conversation._fromMap(Map<String, dynamic> map) {
    final obj = Conversation();
    obj.avatar = map['avatar'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.createdBy = map['created_by'] as String?;
    obj.id = map['id'] as String?;
    obj.lastMessage = map['last_message'] as String?;
    obj.lastMsgAt = map['last_msg_at'] as String?;
    obj.members = map['members'] as List<ConversationMember>?;
    obj.name = map['name'] as String?;
    obj.type = map['type'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (avatar != null) map['avatar'] = avatar;
    if (createdAt != null) map['created_at'] = createdAt;
    if (createdBy != null) map['created_by'] = createdBy;
    if (id != null) map['id'] = id;
    if (lastMessage != null) map['last_message'] = lastMessage;
    if (lastMsgAt != null) map['last_msg_at'] = lastMsgAt;
    if (members != null) map['members'] = members;
    if (name != null) map['name'] = name;
    if (type != null) map['type'] = type;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    return map;
  }
}

class ConversationMember {
  String? conversationId;
  String? id;
  String? joinedAt;
  String? lastReadAt;
  bool? muted;
  String? nickname;
  String? role;
  int? unreadCount;
  dynamic user;
  String? userId;

  ConversationMember({
    this.conversationId,
    this.id,
    this.joinedAt,
    this.lastReadAt,
    this.muted,
    this.nickname,
    this.role,
    this.unreadCount,
    this.user,
    this.userId,
  });

  static ConversationMember? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return ConversationMember._fromMap(map);
  }

  factory ConversationMember._fromMap(Map<String, dynamic> map) {
    final obj = ConversationMember();
    obj.conversationId = map['conversation_id'] as String?;
    obj.id = map['id'] as String?;
    obj.joinedAt = map['joined_at'] as String?;
    obj.lastReadAt = map['last_read_at'] as String?;
    obj.muted = map['muted'] as bool?;
    obj.nickname = map['nickname'] as String?;
    obj.role = map['role'] as String?;
    obj.unreadCount = (map['unread_count'] as num?)?.toInt();
    obj.user = map['user'];
    obj.userId = map['user_id'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (conversationId != null) map['conversation_id'] = conversationId;
    if (id != null) map['id'] = id;
    if (joinedAt != null) map['joined_at'] = joinedAt;
    if (lastReadAt != null) map['last_read_at'] = lastReadAt;
    if (muted != null) map['muted'] = muted;
    if (nickname != null) map['nickname'] = nickname;
    if (role != null) map['role'] = role;
    if (unreadCount != null) map['unread_count'] = unreadCount;
    if (user != null) map['user'] = user;
    if (userId != null) map['user_id'] = userId;
    return map;
  }
}

class Favorite {
  String? createdAt;
  String? id;
  dynamic message;
  String? messageId;
  String? note;
  String? userId;

  Favorite({
    this.createdAt,
    this.id,
    this.message,
    this.messageId,
    this.note,
    this.userId,
  });

  static Favorite? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Favorite._fromMap(map);
  }

  factory Favorite._fromMap(Map<String, dynamic> map) {
    final obj = Favorite();
    obj.createdAt = map['created_at'] as String?;
    obj.id = map['id'] as String?;
    obj.message = map['message'];
    obj.messageId = map['message_id'] as String?;
    obj.note = map['note'] as String?;
    obj.userId = map['user_id'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (createdAt != null) map['created_at'] = createdAt;
    if (id != null) map['id'] = id;
    if (message != null) map['message'] = message;
    if (messageId != null) map['message_id'] = messageId;
    if (note != null) map['note'] = note;
    if (userId != null) map['user_id'] = userId;
    return map;
  }
}

class Group {
  String? avatar;
  String? createdAt;
  String? description;
  String? id;
  int? maxMembers;
  int? memberCount;
  String? name;
  String? ownerId;
  String? updatedAt;

  Group({
    this.avatar,
    this.createdAt,
    this.description,
    this.id,
    this.maxMembers,
    this.memberCount,
    this.name,
    this.ownerId,
    this.updatedAt,
  });

  static Group? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Group._fromMap(map);
  }

  factory Group._fromMap(Map<String, dynamic> map) {
    final obj = Group();
    obj.avatar = map['avatar'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.description = map['description'] as String?;
    obj.id = map['id'] as String?;
    obj.maxMembers = (map['max_members'] as num?)?.toInt();
    obj.memberCount = (map['member_count'] as num?)?.toInt();
    obj.name = map['name'] as String?;
    obj.ownerId = map['owner_id'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (avatar != null) map['avatar'] = avatar;
    if (createdAt != null) map['created_at'] = createdAt;
    if (description != null) map['description'] = description;
    if (id != null) map['id'] = id;
    if (maxMembers != null) map['max_members'] = maxMembers;
    if (memberCount != null) map['member_count'] = memberCount;
    if (name != null) map['name'] = name;
    if (ownerId != null) map['owner_id'] = ownerId;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    return map;
  }
}

class Mention {
  String? createdAt;
  bool? hasRead;
  String? id;
  dynamic message;
  String? messageId;
  String? readAt;
  User? user;
  String? userId;

  Mention({
    this.createdAt,
    this.hasRead,
    this.id,
    this.message,
    this.messageId,
    this.readAt,
    this.user,
    this.userId,
  });

  static Mention? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Mention._fromMap(map);
  }

  factory Mention._fromMap(Map<String, dynamic> map) {
    final obj = Mention();
    obj.createdAt = map['created_at'] as String?;
    obj.hasRead = map['has_read'] as bool?;
    obj.id = map['id'] as String?;
    obj.message = map['message'];
    obj.messageId = map['message_id'] as String?;
    obj.readAt = map['read_at'] as String?;
    obj.user = User.fromJson(map['user']);
    obj.userId = map['user_id'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (createdAt != null) map['created_at'] = createdAt;
    if (hasRead != null) map['has_read'] = hasRead;
    if (id != null) map['id'] = id;
    if (message != null) map['message'] = message;
    if (messageId != null) map['message_id'] = messageId;
    if (readAt != null) map['read_at'] = readAt;
    if (user != null) map['user'] = user!.toJson();
    if (userId != null) map['user_id'] = userId;
    return map;
  }
}

class Message {
  String? content;
  String? conversationId;
  String? createdAt;
  String? fileName;
  int? fileSize;
  String? id;
  bool? isEdited;
  String? mediaUrl;
  List<Mention>? mentions;
  int? readCount;
  Message? replyTo;
  String? replyToId;
  dynamic sender;
  String? senderId;
  int? totalCount;
  String? type;
  String? updatedAt;

  Message({
    this.content,
    this.conversationId,
    this.createdAt,
    this.fileName,
    this.fileSize,
    this.id,
    this.isEdited,
    this.mediaUrl,
    this.mentions,
    this.readCount,
    this.replyTo,
    this.replyToId,
    this.sender,
    this.senderId,
    this.totalCount,
    this.type,
    this.updatedAt,
  });

  static Message? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Message._fromMap(map);
  }

  factory Message._fromMap(Map<String, dynamic> map) {
    final obj = Message();
    obj.content = map['content'] as String?;
    obj.conversationId = map['conversation_id'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.fileName = map['file_name'] as String?;
    obj.fileSize = (map['file_size'] as num?)?.toInt();
    obj.id = map['id'] as String?;
    obj.isEdited = map['is_edited'] as bool?;
    obj.mediaUrl = map['media_url'] as String?;
    obj.mentions = map['mentions'] as List<Mention>?;
    obj.readCount = (map['read_count'] as num?)?.toInt();
    obj.replyTo = Message.fromJson(map['reply_to']);
    obj.replyToId = map['reply_to_id'] as String?;
    obj.sender = map['sender'];
    obj.senderId = map['sender_id'] as String?;
    obj.totalCount = (map['total_count'] as num?)?.toInt();
    obj.type = map['type'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (content != null) map['content'] = content;
    if (conversationId != null) map['conversation_id'] = conversationId;
    if (createdAt != null) map['created_at'] = createdAt;
    if (fileName != null) map['file_name'] = fileName;
    if (fileSize != null) map['file_size'] = fileSize;
    if (id != null) map['id'] = id;
    if (isEdited != null) map['is_edited'] = isEdited;
    if (mediaUrl != null) map['media_url'] = mediaUrl;
    if (mentions != null) map['mentions'] = mentions;
    if (readCount != null) map['read_count'] = readCount;
    if (replyTo != null) map['reply_to'] = replyTo!.toJson();
    if (replyToId != null) map['reply_to_id'] = replyToId;
    if (sender != null) map['sender'] = sender;
    if (senderId != null) map['sender_id'] = senderId;
    if (totalCount != null) map['total_count'] = totalCount;
    if (type != null) map['type'] = type;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    return map;
  }
}

class Blocklist {
  dynamic blocked;
  String? blockedId;
  String? createdAt;
  String? id;
  String? reason;
  String? userId;

  Blocklist({
    this.blocked,
    this.blockedId,
    this.createdAt,
    this.id,
    this.reason,
    this.userId,
  });

  static Blocklist? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Blocklist._fromMap(map);
  }

  factory Blocklist._fromMap(Map<String, dynamic> map) {
    final obj = Blocklist();
    obj.blocked = map['blocked'];
    obj.blockedId = map['blocked_id'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.id = map['id'] as String?;
    obj.reason = map['reason'] as String?;
    obj.userId = map['user_id'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (blocked != null) map['blocked'] = blocked;
    if (blockedId != null) map['blocked_id'] = blockedId;
    if (createdAt != null) map['created_at'] = createdAt;
    if (id != null) map['id'] = id;
    if (reason != null) map['reason'] = reason;
    if (userId != null) map['user_id'] = userId;
    return map;
  }
}

class Friend {
  String? alias;
  String? createdAt;
  User2? friend;
  String? friendId;
  String? id;
  String? status;
  String? updatedAt;
  dynamic user;
  String? userId;

  Friend({
    this.alias,
    this.createdAt,
    this.friend,
    this.friendId,
    this.id,
    this.status,
    this.updatedAt,
    this.user,
    this.userId,
  });

  static Friend? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return Friend._fromMap(map);
  }

  factory Friend._fromMap(Map<String, dynamic> map) {
    final obj = Friend();
    obj.alias = map['alias'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.friend = User2.fromJson(map['friend']);
    obj.friendId = map['friend_id'] as String?;
    obj.id = map['id'] as String?;
    obj.status = map['status'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    obj.user = map['user'];
    obj.userId = map['user_id'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (alias != null) map['alias'] = alias;
    if (createdAt != null) map['created_at'] = createdAt;
    if (friend != null) map['friend'] = friend!.toJson();
    if (friendId != null) map['friend_id'] = friendId;
    if (id != null) map['id'] = id;
    if (status != null) map['status'] = status;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    if (user != null) map['user'] = user;
    if (userId != null) map['user_id'] = userId;
    return map;
  }
}

class User2 {
  String? avatar;
  String? bio;
  String? createdAt;
  String? email;
  String? id;
  String? nickname;
  String? phone;
  String? status;
  String? updatedAt;
  String? username;

  User2({
    this.avatar,
    this.bio,
    this.createdAt,
    this.email,
    this.id,
    this.nickname,
    this.phone,
    this.status,
    this.updatedAt,
    this.username,
  });

  static User2? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    return User2._fromMap(map);
  }

  factory User2._fromMap(Map<String, dynamic> map) {
    final obj = User2();
    obj.avatar = map['avatar'] as String?;
    obj.bio = map['bio'] as String?;
    obj.createdAt = map['created_at'] as String?;
    obj.email = map['email'] as String?;
    obj.id = map['id'] as String?;
    obj.nickname = map['nickname'] as String?;
    obj.phone = map['phone'] as String?;
    obj.status = map['status'] as String?;
    obj.updatedAt = map['updated_at'] as String?;
    obj.username = map['username'] as String?;
    return obj;
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (avatar != null) map['avatar'] = avatar;
    if (bio != null) map['bio'] = bio;
    if (createdAt != null) map['created_at'] = createdAt;
    if (email != null) map['email'] = email;
    if (id != null) map['id'] = id;
    if (nickname != null) map['nickname'] = nickname;
    if (phone != null) map['phone'] = phone;
    if (status != null) map['status'] = status;
    if (updatedAt != null) map['updated_at'] = updatedAt;
    if (username != null) map['username'] = username;
    return map;
  }
}
