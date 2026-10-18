// 非 io / 非 Web 平台：明确报错
import 'realtime.dart';

RealtimeConnector createRealtimeConnector() {
  throw UnsupportedError(
    'neochat_api: 当前平台没有可用的 WebSocket 连接器，请自行实现 RealtimeConnector。',
  );
}

String connectorName() => 'unsupported';
