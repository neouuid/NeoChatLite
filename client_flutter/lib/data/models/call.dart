import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'call.g.dart';

enum CallType {
  video,
  voice,
}

enum CallStatus {
  calling,
  inProgress,
  completed,
  missed,
  rejected,
  cancelled,
}

@JsonSerializable()
class CallRecord {
  final String id;
  @JsonKey(name: 'caller_id')
  final String callerId;
  @JsonKey(name: 'callee_id')
  final String calleeId;
  @JsonKey(name: 'conversation_id')
  final String? conversationId;
  final CallType type;
  final CallStatus status;
  @JsonKey(name: 'started_at')
  final DateTime? startedAt;
  @JsonKey(name: 'answered_at')
  final DateTime? answeredAt;
  @JsonKey(name: 'ended_at')
  final DateTime? endedAt;
  final int duration;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  final User? caller;
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
    required this.duration,
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

  factory CallRecord.fromJson(Map<String, dynamic> json) =>
      _$CallRecordFromJson(json);

  Map<String, dynamic> toJson() => _$CallRecordToJson(this);
}
