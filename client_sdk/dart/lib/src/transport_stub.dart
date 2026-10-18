// 既非 dart:io 也非 Web 的平台：明确报错，避免静默失败。
import 'transport.dart';

Transport createTransport() {
  throw UnsupportedError(
    'neochat_api: 当前平台没有可用的 Transport 实现，请自行实现 Transport 并注入。',
  );
}

String transportName() => 'unsupported';
