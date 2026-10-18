#!/usr/bin/env python3
"""从 backend/docs/swagger.json 生成 Dart 客户端（模型 + API 方法 + 传输层）。

用法：
    python3 scripts/gen_dart_client.py

产出的包位于 client_sdk/dart/，不依赖任何第三方库
（传输层用 dart:io，Flutter Web 可自行实现 Transport）。
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "backend" / "docs" / "swagger.json"
OUT = ROOT / "client_sdk" / "dart"

DART_RESERVED = {
    "abstract", "as", "assert", "async", "await", "break", "case", "catch", "class",
    "const", "continue", "covariant", "default", "deferred", "do", "dynamic", "else",
    "enum", "export", "extends", "extension", "external", "factory", "false", "final",
    "finally", "for", "function", "get", "hide", "if", "implements", "import", "in",
    "interface", "is", "late", "library", "mixin", "new", "null", "on", "operator",
    "part", "required", "rethrow", "return", "set", "show", "static", "super", "switch",
    "sync", "this", "throw", "true", "try", "typedef", "var", "void", "while", "with",
    "yield",
}


def camel(name: str) -> str:
    parts = re.split(r"[_\-\s]+", name)
    head = parts[0]
    rest = "".join(p[:1].upper() + p[1:] for p in parts[1:])
    out = head + rest
    if out in DART_RESERVED:
        out += "_"
    return out


def pascal(name: str) -> str:
    c = camel(name)
    return c[:1].upper() + c[1:]


def short_type_name(ref_name: str) -> str:
    """internal_chat.Message -> Message；保留文件名前缀避免冲突。"""
    tail = ref_name.split(".")[-1]
    return pascal(tail)


def dart_type(schema: dict, known: dict[str, str]) -> str:
    if not schema:
        return "dynamic"
    if "$ref" in schema:
        ref = schema["$ref"].split("/")[-1]
        return known.get(ref, "dynamic")
    t = schema.get("type")
    if t == "string":
        return "String"
    if t == "integer":
        return "int"
    if t == "number":
        return "double"
    if t == "boolean":
        return "bool"
    if t == "array":
        inner = dart_type(schema.get("items", {}), known)
        return f"List<{inner}>"
    if t == "object":
        return "Map<String, dynamic>"
    return "dynamic"


def build_model_map(definitions: dict) -> dict[str, str]:
    """$ref 全名 -> Dart 类名，处理重名冲突。"""
    mapping: dict[str, str] = {}
    used: dict[str, int] = {}
    for ref_name in definitions:
        short = short_type_name(ref_name)
        if short in used:
            used[short] += 1
            short = f"{short}{used[short]}"
        else:
            used[short] = 1
        mapping[ref_name] = short
    return mapping


def gen_models(definitions: dict, name_map: dict[str, str]) -> str:
    lines = [
        "// 由 scripts/gen_dart_client.py 根据 swagger.json 生成，请勿手工修改。",
        "",
        "// ignore_for_file: non_constant_identifier_names, unused_element",
        "",
    ]
    for ref_name, schema in definitions.items():
        cls = name_map[ref_name]
        props = schema.get("properties") or {}
        if not props:
            continue

        fields: list[tuple[str, str, str]] = []  # (dartName, jsonName, dartType)
        for json_name, prop in props.items():
            dt = dart_type(prop, name_map)
            fields.append((camel(json_name), json_name, dt))

        lines.append(f"class {cls} {{")
        for dart_name, _, dt in fields:
            nullable = "" if dt == "dynamic" else "?"
            lines.append(f"  {dt}{nullable} {dart_name};")
        lines.append("")
        lines.append(f"  {cls}({{")
        for dart_name, _, dt in fields:
            lines.append(f"    this.{dart_name},")
        lines.append("  });")
        lines.append("")

        # fromJson
        lines.append(f"  static {cls}? fromJson(dynamic json) {{")
        lines.append("    if (json is! Map) return null;")
        lines.append("    final map = Map<String, dynamic>.from(json);")
        lines.append(f"    return {cls}._fromMap(map);")
        lines.append("  }")
        lines.append("")
        lines.append(f"  factory {cls}._fromMap(Map<String, dynamic> map) {{")
        lines.append(f"    final obj = {cls}();")
        for dart_name, json_name, dt in fields:
            base = dt[:-2] if dt.startswith("List<") else dt
            if base in name_map.values():
                if dt.startswith("List<"):
                    lines.append(f"    final raw_{dart_name} = map['{json_name}'];")
                    lines.append(
                        f"    obj.{dart_name} = raw_{dart_name} is List"
                        f" ? raw_{dart_name}.map((e) => {base}.fromJson(e)).whereType<{base}>().toList()"
                        f" : null;"
                    )
                else:
                    lines.append(f"    obj.{dart_name} = {base}.fromJson(map['{json_name}']);")
            elif dt == "int":
                lines.append(f"    obj.{dart_name} = (map['{json_name}'] as num?)?.toInt();")
            elif dt == "double":
                lines.append(f"    obj.{dart_name} = (map['{json_name}'] as num?)?.toDouble();")
            elif dt == "Map<String, dynamic>":
                lines.append(
                    f"    obj.{dart_name} = map['{json_name}'] is Map"
                    f" ? Map<String, dynamic>.from(map['{json_name}'] as Map)"
                    f" : null;"
                )
            elif dt == "dynamic":
                lines.append(f"    obj.{dart_name} = map['{json_name}'];")
            else:
                lines.append(f"    obj.{dart_name} = map['{json_name}'] as {dt}?;")
        lines.append("    return obj;")
        lines.append("  }")
        lines.append("")

        # toJson
        lines.append("  Map<String, dynamic> toJson() {")
        lines.append("    final map = <String, dynamic>{};")
        for dart_name, json_name, dt in fields:
            base = dt[:-2] if dt.startswith("List<") else dt
            if base in name_map.values():
                if dt.startswith("List<"):
                    lines.append(
                        f"    if ({dart_name} != null) map['{json_name}'] = {dart_name}!.map((e) => e.toJson()).toList();"
                    )
                else:
                    lines.append(
                        f"    if ({dart_name} != null) map['{json_name}'] = {dart_name}!.toJson();"
                    )
            else:
                lines.append(f"    if ({dart_name} != null) map['{json_name}'] = {dart_name};")
        lines.append("    return map;")
        lines.append("  }")
        lines.append("}")
        lines.append("")

    return "\n".join(lines)


def method_name(method: str, path: str, op: dict) -> str:
    if op.get("operationId"):
        return camel(op["operationId"])
    clean = re.sub(r"[{}]", "", path.replace("/api/v1/", ""))
    return camel(method.lower() + "_" + clean.replace("/", "_"))


def gen_api(paths: dict, name_map: dict[str, str]) -> str:
    lines = [
        "// 由 scripts/gen_dart_client.py 根据 swagger.json 生成，请勿手工修改。",
        "",
        "// ignore_for_file: non_constant_identifier_names, unused_element",
        "",
        "import 'transport.dart';",
        "",
        "/// NeoChat 服务端 API 客户端。",
        "class NeoChatApi {",
        "  NeoChatApi({required this.baseUrl, Transport? transport, this.token})",
        "      : transport = transport ?? IoTransport();",
        "",
        "  final String baseUrl;",
        "  final Transport transport;",
        "  String? token;",
        "",
        "  Map<String, String> _headers() {",
        "    final headers = <String, String>{'Content-Type': 'application/json'};",
        "    if (token != null && token!.isNotEmpty) {",
        "      headers['Authorization'] = 'Bearer $token';",
        "    }",
        "    return headers;",
        "  }",
        "",
        "  Uri _uri(String path, [Map<String, dynamic>? query]) {",
        "    final uri = Uri.parse('$baseUrl$path');",
        "    if (query == null || query.isEmpty) return uri;",
        "    final params = <String, String>{};",
        "    query.forEach((key, value) {",
        "      if (value != null) params[key] = value.toString();",
        "    });",
        "    return uri.replace(queryParameters: params);",
        "  }",
        "",
    ]

    seen: set[str] = set()
    for path, ops in sorted(paths.items()):
        for method, op in ops.items():
            name = method_name(method, path, op)
            if name in seen:
                name = camel(name + "_" + method.lower())
            seen.add(name)

            params = op.get("parameters") or []
            path_params = [p for p in params if p.get("in") == "path"]
            query_params = [p for p in params if p.get("in") == "query"]
            body_param = next((p for p in params if p.get("in") == "body"), None)

            args = ["required this." + "_dummy"] if False else []
            sig: list[str] = []
            for p in path_params:
                sig.append(f"required String {camel(p['name'])}")
            if query_params:
                for p in query_params:
                    tp = {"integer": "int", "number": "double", "boolean": "bool"}.get(
                        p.get("type", "string"), "String"
                    )
                    sig.append(f"{tp}? {camel(p['name'])}")
            if body_param is not None:
                sig.append("required Map<String, dynamic> body")

            summary = (op.get("summary") or "").replace("\n", " ")
            lines.append(f"  /// {summary}".rstrip())
            params_sig = "{" + ", ".join(sig) + "}" if sig else ""
            lines.append(f"  Future<dynamic> {name}({params_sig}) async {{")

            interpolated = path
            for p in path_params:
                interpolated = interpolated.replace(
                    "{" + p["name"] + "}", "${" + camel(p["name"]) + "}"
                )
            lines.append(f"    final path = '{interpolated}';")

            if query_params:
                entries = ", ".join(
                    f"'{p['name']}': {camel(p['name'])}" for p in query_params
                )
                lines.append(f"    final query = <String, dynamic>{{{entries}}};")
                lines.append("    final url = _uri(path, query);")
            else:
                lines.append("    final url = _uri(path);")

            body_arg = "body" if body_param is not None else None
            if body_arg:
                lines.append(
                    f"    return transport.send(method: '{method.upper()}', url: url, headers: _headers(), body: {body_arg});"
                )
            else:
                lines.append(
                    f"    return transport.send(method: '{method.upper()}', url: url, headers: _headers());"
                )
            lines.append("  }")
            lines.append("")

    lines.append("}")
    return "\n".join(lines)


TRANSPORT = '''// 由 scripts/gen_dart_client.py 生成，请勿手工修改。

import 'dart:convert';
import 'dart:io';

/// 统一的传输层：默认实现用 dart:io，
/// Flutter Web 等平台可自行实现（例如基于 package:http）。
abstract class Transport {
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  });
}

/// 基于 dart:io 的实现（移动端 / 桌面端可用）
class IoTransport implements Transport {
  IoTransport({HttpClient? client}) : _client = client ?? HttpClient();

  final HttpClient _client;

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    final request = await _client.openUrl(method, url);
    headers?.forEach((key, value) {
      // Content-Type 统一在下面设置（需要带 charset=utf-8，否则中文会报错）
      if (key.toLowerCase() != 'content-type') {
        request.headers.set(key, value);
      }
    });
    if (body != null) {
      request.headers.contentType =
          ContentType('application', 'json', charset: 'utf-8');
      // 必须按 UTF-8 写字节，直接 write 字符串会按 latin1 编码导致中文报错
      request.add(utf8.encode(jsonEncode(body)));
    }

    final response = await request.close();
    final text = await response.transform(utf8.decoder).join();
    final decoded = text.isEmpty ? null : jsonDecode(text);

    if (response.statusCode >= 400) {
      throw ApiException(
        statusCode: response.statusCode,
        message: decoded is Map && decoded['message'] is String
            ? decoded['message'] as String
            : text,
        payload: decoded,
      );
    }
    return decoded;
  }
}

/// API 调用失败时抛出
class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message, this.payload});

  final int statusCode;
  final String message;
  final dynamic payload;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
'''

PUBSPEC = '''name: neochat_api
description: NeoChat 服务端 API 的 Dart 客户端，由 backend/docs/swagger.json 生成。
version: 0.1.0
publish_to: none

environment:
  sdk: '>=3.0.0 <4.0.0'
'''

README = '''# neochat_api (Dart)

NeoChat 服务端 API 的 Dart 客户端契约层，由 `backend/docs/swagger.json` 生成。

```bash
# 重新生成
python3 scripts/gen_dart_client.py
```

## 用法

```dart
import 'package:neochat_api/neochat_api.dart';

final api = NeoChatApi(baseUrl: 'http://localhost:8080');
final res = await api.login(body: {'identifier': 'alice', 'password': '***'});
final token = res['data']['token'];
api.token = token;

final convs = await api.get_chat_conversations();
```

## 设计说明

- 不依赖任何第三方包；传输层用 `dart:io`，Flutter Web 可自行实现 `Transport`
- 方法名由 `operationId` 或「请求方法 + 路径」推导
- 返回值是解码后的 JSON（`Map` / `List`），模型类见 `lib/src/models.dart`
'''


def main() -> None:
    spec = json.loads(SPEC.read_text())
    definitions = spec.get("definitions") or {}
    paths = spec.get("paths") or {}

    name_map = build_model_map(definitions)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "lib" / "src").mkdir(parents=True, exist_ok=True)

    (OUT / "pubspec.yaml").write_text(PUBSPEC)
    (OUT / "README.md").write_text(README)
    (OUT / "lib" / "src" / "models.dart").write_text(gen_models(definitions, name_map))
    (OUT / "lib" / "src" / "transport.dart").write_text(TRANSPORT)
    (OUT / "lib" / "src" / "api_client.dart").write_text(gen_api(paths, name_map))
    (OUT / "lib" / "neochat_api.dart").write_text(
        "// 由 scripts/gen_dart_client.py 生成，请勿手工修改。\n\n"
        "export 'src/api_client.dart';\n"
        "export 'src/models.dart';\n"
        "export 'src/realtime.dart';\n"
        "export 'src/transport.dart';\n"
    )

    print(f"生成完成：{OUT}")
    print(f"  模型 {len(name_map)} 个，接口 {sum(len(v) for v in paths.values())} 个")


if __name__ == "__main__":
    main()
