// Web 实现（package:web_socket_channel，浏览器与 wasm 均可用）
import 'package:web_socket_channel/web_socket_channel.dart';

import 'realtime.dart';

RealtimeConnector createRealtimeConnector() => webRealtimeConnector;

String connectorName() => 'web_socket_channel(web)';

class WebRealtimeSocket implements RealtimeSocket {
  WebRealtimeSocket(this._channel);

  final WebSocketChannel _channel;

  @override
  Stream<String> get messages => _channel.stream.map((event) => '$event');

  @override
  void send(String data) => _channel.sink.add(data);

  @override
  Future<void> close() async {
    await _channel.sink.close();
  }
}

Future<RealtimeSocket> webRealtimeConnector(
  Uri uri,
  Map<String, String> headers,
) async {
  // 浏览器无法自定义 WebSocket 请求头，token 已放在 ?token= 查询参数里
  final channel = WebSocketChannel.connect(uri);
  await channel.ready;
  return WebRealtimeSocket(channel);
}
