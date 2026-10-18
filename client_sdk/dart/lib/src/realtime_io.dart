// dart:io WebSocket 实现（移动端 / 桌面端 / 服务端）
import 'dart:io';

import 'realtime.dart';

RealtimeConnector createRealtimeConnector() => ioRealtimeConnector;

String connectorName() => 'io';

/// 基于 dart:io 的默认实现
class IoRealtimeSocket implements RealtimeSocket {
  IoRealtimeSocket(this._socket);

  final WebSocket _socket;

  @override
  Stream<String> get messages => _socket.map((event) => '$event');

  @override
  void send(String data) => _socket.add(data);

  @override
  Future<void> close() => _socket.close();
}

Future<RealtimeSocket> ioRealtimeConnector(
  Uri uri,
  Map<String, String> headers,
) async {
  final socket = await WebSocket.connect(uri.toString(), headers: headers);
  return IoRealtimeSocket(socket);
}
