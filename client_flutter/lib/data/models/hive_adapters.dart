import 'package:hive/hive.dart';
import 'user.dart';
import 'chat.dart';

class UserAdapter extends TypeAdapter<User> {
  @override
  final int typeId = 0;

  @override
  User read(BinaryReader reader) {
    final hasEmail = reader.readBool();
    final hasPhone = reader.readBool();
    final hasAvatar = reader.readBool();
    final hasBio = reader.readBool();
    return User(
      id: reader.readString(),
      username: reader.readString(),
      email: hasEmail ? reader.readString() : null,
      phone: hasPhone ? reader.readString() : null,
      nickname: reader.readString(),
      avatar: hasAvatar ? reader.readString() : null,
      bio: hasBio ? reader.readString() : null,
      status: UserStatus.values[reader.readInt()],
      createdAt: DateTime.parse(reader.readString()),
      updatedAt: DateTime.parse(reader.readString()),
    );
  }

  @override
  void write(BinaryWriter writer, User obj) {
    writer.writeBool(obj.email != null);
    writer.writeBool(obj.phone != null);
    writer.writeBool(obj.avatar != null);
    writer.writeBool(obj.bio != null);
    writer.writeString(obj.id);
    writer.writeString(obj.username);
    if (obj.email != null) writer.writeString(obj.email!);
    if (obj.phone != null) writer.writeString(obj.phone!);
    writer.writeString(obj.nickname);
    if (obj.avatar != null) writer.writeString(obj.avatar!);
    if (obj.bio != null) writer.writeString(obj.bio!);
    writer.writeInt(obj.status.index);
    writer.writeString(obj.createdAt.toIso8601String());
    writer.writeString(obj.updatedAt.toIso8601String());
  }
}

class FriendAdapter extends TypeAdapter<Friend> {
  @override
  final int typeId = 1;

  @override
  Friend read(BinaryReader reader) {
    final hasAlias = reader.readBool();
    final hasFriend = reader.readBool();
    return Friend(
      id: reader.readString(),
      userId: reader.readString(),
      friendId: reader.readString(),
      alias: hasAlias ? reader.readString() : null,
      status: FriendStatus.values[reader.readInt()],
      createdAt: DateTime.parse(reader.readString()),
      updatedAt: DateTime.parse(reader.readString()),
      friend: hasFriend ? UserAdapter().read(reader) : null,
    );
  }

  @override
  void write(BinaryWriter writer, Friend obj) {
    writer.writeBool(obj.alias != null);
    writer.writeBool(obj.friend != null);
    writer.writeString(obj.id);
    writer.writeString(obj.userId);
    writer.writeString(obj.friendId);
    if (obj.alias != null) writer.writeString(obj.alias!);
    writer.writeInt(obj.status.index);
    writer.writeString(obj.createdAt.toIso8601String());
    writer.writeString(obj.updatedAt.toIso8601String());
    if (obj.friend != null) UserAdapter().write(writer, obj.friend!);
  }
}

class ConversationAdapter extends TypeAdapter<Conversation> {
  @override
  final int typeId = 2;

  @override
  Conversation read(BinaryReader reader) {
    final hasName = reader.readBool();
    final hasAvatar = reader.readBool();
    final hasDescription = reader.readBool();
    final hasLastMessage = reader.readBool();
    final hasLastMsgAt = reader.readBool();
    final hasUnreadCount = reader.readBool();
    final hasMembers = reader.readBool();
    return Conversation(
      id: reader.readString(),
      type: ConversationType.values[reader.readInt()],
      name: hasName ? reader.readString() : null,
      avatar: hasAvatar ? reader.readString() : null,
      description: hasDescription ? reader.readString() : null,
      lastMessage: hasLastMessage ? reader.readString() : null,
      lastMsgAt: hasLastMsgAt ? DateTime.parse(reader.readString()) : null,
      createdBy: reader.readString(),
      createdAt: DateTime.parse(reader.readString()),
      updatedAt: DateTime.parse(reader.readString()),
      unreadCount: hasUnreadCount ? reader.readInt() : null,
      members: hasMembers
          ? List.generate(reader.readInt(), (_) => ConversationMemberAdapter().read(reader))
          : null,
    );
  }

  @override
  void write(BinaryWriter writer, Conversation obj) {
    writer.writeBool(obj.name != null);
    writer.writeBool(obj.avatar != null);
    writer.writeBool(obj.description != null);
    writer.writeBool(obj.lastMessage != null);
    writer.writeBool(obj.lastMsgAt != null);
    writer.writeBool(obj.unreadCount != null);
    writer.writeBool(obj.members != null);
    writer.writeString(obj.id);
    writer.writeInt(obj.type.index);
    if (obj.name != null) writer.writeString(obj.name!);
    if (obj.avatar != null) writer.writeString(obj.avatar!);
    if (obj.description != null) writer.writeString(obj.description!);
    if (obj.lastMessage != null) writer.writeString(obj.lastMessage!);
    if (obj.lastMsgAt != null) writer.writeString(obj.lastMsgAt!.toIso8601String());
    writer.writeString(obj.createdBy);
    writer.writeString(obj.createdAt.toIso8601String());
    writer.writeString(obj.updatedAt.toIso8601String());
    if (obj.unreadCount != null) writer.writeInt(obj.unreadCount!);
    if (obj.members != null) {
      writer.writeInt(obj.members!.length);
      for (final member in obj.members!) {
        ConversationMemberAdapter().write(writer, member);
      }
    }
  }
}

class MessageAdapter extends TypeAdapter<Message> {
  @override
  final int typeId = 3;

  @override
  Message read(BinaryReader reader) {
    final hasMediaUrl = reader.readBool();
    final hasFileName = reader.readBool();
    final hasFileSize = reader.readBool();
    final hasReplyToId = reader.readBool();
    final hasSender = reader.readBool();
    final hasReplyTo = reader.readBool();
    final hasReadCount = reader.readBool();
    final hasTotalCount = reader.readBool();
    return Message(
      id: reader.readString(),
      conversationId: reader.readString(),
      senderId: reader.readString(),
      type: MessageType.values[reader.readInt()],
      content: reader.readString(),
      mediaUrl: hasMediaUrl ? reader.readString() : null,
      fileName: hasFileName ? reader.readString() : null,
      fileSize: hasFileSize ? reader.readInt() : null,
      replyToId: hasReplyToId ? reader.readString() : null,
      isEdited: reader.readBool(),
      createdAt: DateTime.parse(reader.readString()),
      updatedAt: DateTime.parse(reader.readString()),
      sender: hasSender ? UserAdapter().read(reader) : null,
      replyTo: hasReplyTo ? MessageAdapter().read(reader) : null,
      readCount: hasReadCount ? reader.readInt() : null,
      totalCount: hasTotalCount ? reader.readInt() : null,
    );
  }

  @override
  void write(BinaryWriter writer, Message obj) {
    writer.writeBool(obj.mediaUrl != null);
    writer.writeBool(obj.fileName != null);
    writer.writeBool(obj.fileSize != null);
    writer.writeBool(obj.replyToId != null);
    writer.writeBool(obj.sender != null);
    writer.writeBool(obj.replyTo != null);
    writer.writeBool(obj.readCount != null);
    writer.writeBool(obj.totalCount != null);
    writer.writeString(obj.id);
    writer.writeString(obj.conversationId);
    writer.writeString(obj.senderId);
    writer.writeInt(obj.type.index);
    writer.writeString(obj.content);
    if (obj.mediaUrl != null) writer.writeString(obj.mediaUrl!);
    if (obj.fileName != null) writer.writeString(obj.fileName!);
    if (obj.fileSize != null) writer.writeInt(obj.fileSize!);
    if (obj.replyToId != null) writer.writeString(obj.replyToId!);
    writer.writeBool(obj.isEdited);
    writer.writeString(obj.createdAt.toIso8601String());
    writer.writeString(obj.updatedAt.toIso8601String());
    if (obj.sender != null) UserAdapter().write(writer, obj.sender!);
    if (obj.replyTo != null) MessageAdapter().write(writer, obj.replyTo!);
    if (obj.readCount != null) writer.writeInt(obj.readCount!);
    if (obj.totalCount != null) writer.writeInt(obj.totalCount!);
  }
}

class ConversationMemberAdapter extends TypeAdapter<ConversationMember> {
  @override
  final int typeId = 8;

  @override
  ConversationMember read(BinaryReader reader) {
    final hasNickname = reader.readBool();
    final hasLastReadAt = reader.readBool();
    final hasUser = reader.readBool();
    return ConversationMember(
      id: reader.readString(),
      conversationId: reader.readString(),
      userId: reader.readString(),
      role: MemberRole.values[reader.readInt()],
      nickname: hasNickname ? reader.readString() : null,
      lastReadAt: hasLastReadAt ? DateTime.parse(reader.readString()) : null,
      unreadCount: reader.readInt(),
      muted: reader.readBool(),
      joinedAt: DateTime.parse(reader.readString()),
      user: hasUser ? UserAdapter().read(reader) : null,
    );
  }

  @override
  void write(BinaryWriter writer, ConversationMember obj) {
    writer.writeBool(obj.nickname != null);
    writer.writeBool(obj.lastReadAt != null);
    writer.writeBool(obj.user != null);
    writer.writeString(obj.id);
    writer.writeString(obj.conversationId);
    writer.writeString(obj.userId);
    writer.writeInt(obj.role.index);
    if (obj.nickname != null) writer.writeString(obj.nickname!);
    if (obj.lastReadAt != null) writer.writeString(obj.lastReadAt!.toIso8601String());
    writer.writeInt(obj.unreadCount);
    writer.writeBool(obj.muted);
    writer.writeString(obj.joinedAt.toIso8601String());
    if (obj.user != null) UserAdapter().write(writer, obj.user!);
  }
}

void registerHiveAdapters() {
  Hive.registerAdapter(UserAdapter());
  Hive.registerAdapter(FriendAdapter());
  Hive.registerAdapter(ConversationAdapter());
  Hive.registerAdapter(MessageAdapter());
  Hive.registerAdapter(ConversationMemberAdapter());
}
