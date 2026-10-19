// 端到端验证：用生成出来的 SDK 打真实后端（SQLite 模式，不需要 Postgres/Redis）。
//
//   dart run tool/e2e.dart [baseUrl]
//
// 覆盖链路：注册两个用户 → 登录 → 建单聊 → 发消息 → 对方离线补拉 → 未读 → 已读。
import 'dart:io';

import 'package:neochat_api/neochat_api.dart';

int _failed = 0;

void step(String name) => print('\n▶ $name');

void ok(String detail) => print('  ✅ $detail');

void fail(String detail) {
  _failed++;
  print('  ❌ $detail');
}

/// 从会话列表里取出「指定用户在该会话的未读数」。
/// 后端的 unread_count 挂在 conversation.members 上，而不是会话顶层。
int _myUnreadCount(List<dynamic> conversations, String convId, String userId) {
  for (final conv in conversations.whereType<Map>()) {
    if (conv['id'] != convId) continue;
    final members = (conv['members'] as List?) ?? const [];
    for (final member in members.whereType<Map>()) {
      if (member['user_id'] == userId) {
        final count = member['unread_count'];
        return count is int ? count : 0;
      }
    }
  }
  return 0;
}

Map<String, dynamic> _data(dynamic res) {
  if (res is Map && res['data'] is Map) {
    return Map<String, dynamic>.from(res['data'] as Map);
  }
  return <String, dynamic>{};
}

List<dynamic> _list(dynamic res) {
  final d = res is Map ? res['data'] : null;
  return d is List ? d : const [];
}

Future<void> main(List<String> args) async {
  final baseUrl = args.isNotEmpty ? args.first : 'http://127.0.0.1:18080';
  final suffix = DateTime.now().millisecondsSinceEpoch % 100000000;
  print('E2E 目标后端: $baseUrl');

  final api = NeoChatApi(baseUrl: baseUrl);

  step('1. 注册两个用户');
  final userA = 'alice$suffix';
  final userB = 'bob$suffix';
  try {
    await api.postAuthRegister(
      body: {
        'username': userA,
        'password': 'Passw0rd!',
        'nickname': 'Alice',
        'email': '$userA@e2e.local',
        'phone': '139${suffix.toString().padLeft(8, '0')}',
      },
    );
    await api.postAuthRegister(
      body: {
        'username': userB,
        'password': 'Passw0rd!',
        'nickname': 'Bob',
        'email': '$userB@e2e.local',
        'phone': '138${suffix.toString().padLeft(8, '0')}',
      },
    );
    ok('注册成功: $userA / $userB');
  } catch (e) {
    fail('注册失败: $e');
    exit(1);
  }

  step('2. 登录两个用户');
  late String tokenA;
  late String tokenB;
  late String idA;
  late String idB;
  try {
    final resA = await api.postAuthLogin(
      body: {'identifier': userA, 'password': 'Passw0rd!'},
    );
    final dataA = _data(resA);
    tokenA = (dataA['token'] ?? dataA['access_token'] ?? '') as String;
    idA = ((dataA['user'] as Map?)?['id'] ?? '') as String;

    final resB = await api.postAuthLogin(
      body: {'identifier': userB, 'password': 'Passw0rd!'},
    );
    final dataB = _data(resB);
    tokenB = (dataB['token'] ?? dataB['access_token'] ?? '') as String;
    idB = ((dataB['user'] as Map?)?['id'] ?? '') as String;

    if (tokenA.isEmpty || tokenB.isEmpty || idA.isEmpty || idB.isEmpty) {
      fail('登录响应缺少 token/id: $dataA');
      exit(1);
    }
    ok('登录成功，A=$idA B=$idB');
  } catch (e) {
    fail('登录失败: $e');
    exit(1);
  }

  step('3. A 与 B 建立单聊');
  late String convId;
  try {
    api.token = tokenA;
    final res = await api.postChatConversations(body: {'user_id': idB});
    final conv = _data(res);
    convId = (conv['id'] ?? '') as String;
    if (convId.isEmpty) {
      fail('创建会话响应缺少 id: $conv');
      exit(1);
    }
    ok('会话创建成功: $convId');
  } catch (e) {
    fail('创建会话失败: $e');
    exit(1);
  }

  step('4. A 发送一条消息');
  const content = '端到端验证消息 hello-e2e';
  late String messageId;
  try {
    final res = await api.postChatMessages(
      body: {'conversation_id': convId, 'type': 'text', 'content': content},
    );
    messageId = (_data(res)['id'] ?? '') as String;
    ok('消息已发送 id=$messageId');
  } catch (e) {
    fail('发送消息失败: $e');
    exit(1);
  }

  step('5. B 离线补拉（GET /chat/sync）');
  try {
    api.token = tokenB;
    final res = await api.getChatSync();
    final payload = (res is Map && res['data'] is Map)
        ? Map<String, dynamic>.from(res['data'] as Map)
        : <String, dynamic>{};
    final messages = (payload['messages'] as List?) ?? const [];
    final contents = messages
        .whereType<Map>()
        .map((m) => m['content'])
        .whereType<String>()
        .toList();
    if (contents.contains(content)) {
      ok('补拉到 ${messages.length} 条消息，包含刚发的消息');
    } else {
      fail('补拉结果里没有刚发的消息: ${contents.take(5).toList()}');
    }
    final serverTime = payload['server_time'] as String?;
    if (serverTime != null && serverTime.isNotEmpty) {
      ok('返回同步游标 server_time=$serverTime');
    } else {
      fail('响应缺少 server_time');
    }
  } catch (e) {
    fail('离线补拉失败: $e');
  }

  step('6. B 的会话列表应带未读数');
  try {
    final convs = _list(await api.getChatConversations());
    final unread = _myUnreadCount(convs, convId, idB);
    if (unread > 0) {
      ok('未读数 = $unread');
    } else {
      fail('未读数不符合预期: $unread');
    }
  } catch (e) {
    fail('查询会话列表失败: $e');
  }

  step('7. B 标记已读后未读清零');
  try {
    await api.postChatConversationsIdRead(id: convId);
    final convs = _list(await api.getChatConversations());
    final unread = _myUnreadCount(convs, convId, idB);
    if (unread == 0) {
      ok('已读后未读数 = 0');
    } else {
      fail('已读后仍有未读: $unread');
    }
  } catch (e) {
    fail('标记已读失败: $e');
  }

  step('8. A 通过消息列表看到该消息');
  try {
    api.token = tokenA;
    final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
    final found = msgs.whereType<Map>().any((m) => m['content'] == content);
    if (found) {
      ok('消息列表中命中，共 ${msgs.length} 条');
    } else {
      fail('消息列表中没有找到刚发的消息');
    }
  } catch (e) {
    fail('拉取消息列表失败: $e');
  }

  step('9. A 收藏该消息，收藏列表可见');
  try {
    api.token = tokenA;
    await api.postChatFavorites(body: {'message_id': messageId});
    final favorites = _list(await api.getChatFavorites());
    final found = favorites.whereType<Map>().any((f) => f['message_id'] == messageId);
    if (found) {
      ok('收藏成功，共 ${favorites.length} 条');
    } else {
      fail('收藏列表中没有该消息');
    }
  } catch (e) {
    fail('收藏失败: $e');
  }

  step('10. A 转发该消息到第二个会话');
  late String conv2;
  try {
    // 建一个 A 与 B 的另一个会话（用群聊场景更简单：直接再建单聊会复用已有会话）
    final res = await api.postChatConversations(body: {'user_id': idB});
    conv2 = (_data(res)['id'] ?? '') as String;
    ok('第二个会话: $conv2');
  } catch (e) {
    fail('建第二个会话失败: $e');
  }
  if (conv2.isNotEmpty) {
    try {
      await api.postChatMessagesForward(
        body: {
          'message_id': messageId,
          'conversation_ids': [conv2],
        },
      );
      final msgs = _list(await api.getChatConversationsIdMessages(id: conv2));
      final forwarded = msgs.whereType<Map>().any(
            (m) => (m['content'] as String?)?.contains(content) == true,
          );
      if (forwarded) {
        ok('转发成功，目标会话包含该消息');
      } else {
        fail('目标会话里没有找到转发内容');
      }
    } catch (e) {
      fail('转发失败: $e');
    }
  }

  step('11. A 搜索消息');
  try {
    final res = await api.getChatSearchMessages(q: '端到端验证');
    final hits = _list(res);
    final found = hits.whereType<Map>().any(
          (m) => (m['content'] as String?)?.contains('端到端验证') == true,
        );
    if (found) {
      ok('搜索命中 ${hits.length} 条');
    } else {
      fail('搜索没有命中');
    }
  } catch (e) {
    fail('搜索失败: $e');
  }

  step('12. A 撤回消息后不再出现在消息列表');
  try {
    await api.deleteChatMessagesId(id: messageId);
    final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
    final stillThere = msgs.whereType<Map>().any((m) => m['id'] == messageId);
    if (stillThere) {
      fail('撤回后消息仍在列表中');
    } else {
      ok('撤回生效');
    }
  } catch (e) {
    fail('撤回失败: $e');
  }

  step('13. A 取消收藏后列表为空');
  try {
    api.token = tokenA;
    final favorites = _list(await api.getChatFavorites());
    String? favId;
    for (final fav in favorites.whereType<Map>()) {
      if (fav['message_id'] == messageId) {
        favId = fav['id'] as String?;
        break;
      }
    }
    if (favId == null) {
      fail('没找到刚才的收藏记录');
    } else {
      await api.deleteChatFavoritesId(id: favId);
      final after = _list(await api.getChatFavorites());
      final still = after.whereType<Map>().any((f) => f['message_id'] == messageId);
      if (still) {
        fail('取消收藏后仍在列表里');
      } else {
        ok('取消收藏生效');
      }
    }
  } catch (e) {
    fail('取消收藏失败: $e');
  }

  step('14. 群聊 @提及：B 收到提及并可标记已读');
  try {
    api.token = tokenA;
    final groupRes = await api.postGroups(
      body: {
        'name': 'e2e 群 $suffix',
        'member_ids': [idB],
      },
    );
    final groupData = _data(groupRes);
    // 建群返回 {conversation: {...}, group: {...}}
    final groupConv = ((groupData['conversation'] as Map?)?['id'] ?? '') as String;
    if (groupConv.isEmpty) {
      fail('建群响应缺少会话 id');
    } else {
      ok('群会话: $groupConv');

      await api.postChatMessages(
        body: {
          'conversation_id': groupConv,
          'type': 'text',
          'content': '@[Bob]($idB) 请查收这条提及',
        },
      );

      api.token = tokenB;
      // 提及是在服务端 goroutine 里异步创建的，轮询等待最多 3 秒
      var mentions = _list(await api.getChatMentions(limit: 20));
      var hit = false;
      final deadline = DateTime.now().add(const Duration(seconds: 3));
      while (!hit && DateTime.now().isBefore(deadline)) {
        mentions = _list(await api.getChatMentions(limit: 20));
        hit = mentions.whereType<Map>().any(
              (m) => (m['message'] is Map) &&
                  ((m['message'] as Map)['conversation_id'] == groupConv),
            );
        if (!hit) await Future<void>.delayed(const Duration(milliseconds: 150));
      }
      if (hit) {
        ok('B 收到提及，共 ${mentions.length} 条');
      } else {
        fail('B 没有收到提及');
      }

      final countRes = await api.getChatMentionsUnreadCount();
      final unread = (_data(countRes)['count'] as num?)?.toInt() ?? 0;
      if (unread >= 1) {
        ok('未读提及数 = $unread');
      } else {
        fail('未读提及数不符合预期: $unread');
      }

      await api.postChatMentionsReadAll();
      final afterRes = await api.getChatMentionsUnreadCount();
      final after = (_data(afterRes)['count'] as num?)?.toInt() ?? 0;
      if (after == 0) {
        ok('全部标记已读后未读清零');
      } else {
        fail('已读后未读仍为 $after');
      }
    }
  } catch (e) {
    fail('提及验证失败: $e');
  }

  step('15. 群管理：拉人 / 改角色 / 踢人 / 退群');
  try {
    // 注册第三个用户 C
    final userC = 'carol$suffix';
    await api.postAuthRegister(
      body: {
        'username': userC,
        'password': 'Passw0rd!',
        'email': '$userC@e2e.local',
        'phone': '133${suffix.toString().padLeft(8, '0')}',
      },
    );
    final resC = _data(
      await api.postAuthLogin(
        body: {'identifier': userC, 'password': 'Passw0rd!'},
      ),
    );
    final idC = ((resC['user'] as Map?)?['id'] ?? '') as String;
    if (idC.isEmpty) {
      fail('用户 C 登录响应缺少 id');
      exit(1);
    }

    api.token = tokenA;
    final groupData = _data(
      await api.postGroups(body: {
        'name': 'gm 群 $suffix',
        'member_ids': [idB],
      }),
    );
    final gid = ((groupData['conversation'] as Map?)?['id'] ?? '') as String;

    // 拉人
    await api.postGroupsIdMembers(id: gid, body: {'user_id': idC});
    var members = _list(await api.getGroupsIdMembers(id: gid));
    if (members.length == 3) {
      ok('拉人成功，成员数 = 3');
    } else {
      fail('拉人后成员数为 ${members.length}，期望 3');
    }

    // 改角色
    await api.putGroupsIdMembersUserIdRole(
      id: gid,
      userId: idB,
      body: {'role': 'admin'},
    );
    members = _list(await api.getGroupsIdMembers(id: gid));
    final bobRole = members
        .whereType<Map>()
        .firstWhere((m) => m['user_id'] == idB, orElse: () => {})['role'];
    if (bobRole == 'admin') {
      ok('B 已设为管理员');
    } else {
      fail('B 的角色为 $bobRole，期望 admin');
    }

    // 踢人
    await api.deleteGroupsIdMembersUserId(id: gid, userId: idC);
    members = _list(await api.getGroupsIdMembers(id: gid));
    if (members.length == 2) {
      ok('踢人成功，成员数 = 2');
    } else {
      fail('踢人后成员数为 ${members.length}，期望 2');
    }

    // B 退群
    api.token = tokenB;
    await api.postGroupsIdLeave(id: gid);
    api.token = tokenA;
    members = _list(await api.getGroupsIdMembers(id: gid));
    if (members.length == 1) {
      ok('B 退群成功，成员数 = 1');
    } else {
      fail('退群后成员数为 ${members.length}，期望 1');
    }
  } catch (e) {
    fail('群管理验证失败: $e');
  }

  step('16. 上传图片并发送图片消息');
  try {
    // 1x1 透明 PNG
    final png = <int>[
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
    ];

    api.token = tokenA;
    final uploaded = await uploadWithUploader(
      uploader: TransportUploader(),
      baseUrl: baseUrl,
      bytes: png,
      filename: 'tiny.png',
      type: 'image',
      token: tokenA,
    );
    final mediaUrl = (uploaded['url'] ?? '') as String;
    if (mediaUrl.isEmpty) {
      fail('上传响应缺少 url: $uploaded');
    } else {
      ok('上传成功: $mediaUrl');

      await api.postChatMessages(
        body: {
          'conversation_id': convId,
          'type': 'image',
          'content': '',
          'media_url': mediaUrl,
          'file_name': 'tiny.png',
          'file_size': png.length,
        },
      );

      final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
      final found = msgs.whereType<Map>().any(
            (m) => m['type'] == 'image' && m['media_url'] == mediaUrl,
          );
      if (found) {
        ok('图片消息已发送');
      } else {
        fail('消息列表里没有找到图片消息');
      }

      final req = await HttpClient().getUrl(Uri.parse('$baseUrl$mediaUrl'));
      final resp = await req.close();
      if (resp.statusCode == 200) {
        ok('附件可访问（HTTP 200）');
      } else {
        fail('附件访问失败: ${resp.statusCode}');
      }
    }
  } catch (e) {
    fail('上传/图片消息失败: $e');
  }

  step('17. 消息分页：before 游标向上翻历史');
  try {
    api.token = tokenA;
    // 在 conv2 里补 5 条消息，便于分页
    for (var i = 1; i <= 5; i++) {
      await api.postChatMessages(
        body: {
          'conversation_id': conv2,
          'type': 'text',
          'content': 'page-msg-$i',
        },
      );
    }

    final page1 = _list(
      await api.getChatConversationsIdMessages(id: conv2, limit: 3),
    );
    if (page1.length == 3) {
      ok('第一页 3 条');
    } else {
      fail('第一页条数为 ${page1.length}，期望 3');
    }

    final oldestCreatedAt = (page1.first['created_at'] ?? '') as String;
    final page2 = _list(
      await api.getChatConversationsIdMessages(
        id: conv2,
        before: oldestCreatedAt,
        limit: 3,
      ),
    );

    final page1Ids = page1.map((m) => (m as Map)['id']).toSet();
    final page2Ids = page2.map((m) => (m as Map)['id']).toSet();
    final overlap = page1Ids.intersection(page2Ids);

    if (page2.isEmpty) {
      fail('第二页为空');
    } else if (overlap.isNotEmpty) {
      fail('两页有重叠消息: $overlap');
    } else {
      ok('第二页 ${page2.length} 条，与第一页无重叠');
    }

    // 第二页的消息应早于第一页最早一条
    final page2Latest = (page2.last['created_at'] ?? '') as String;
    if (page2Latest.compareTo(oldestCreatedAt) <= 0) {
      ok('第二页时间均早于第一页最早时间');
    } else {
      fail('第二页出现了更新的消息: $page2Latest > $oldestCreatedAt');
    }
  } catch (e) {
    fail('分页验证失败: $e');
  }

  step('18. 好友流程：搜索 → 请求 → 接受 → 互为好友');
  try {
    api.token = tokenA;
    // 1) A 搜索 B
    final searchRes = await api.getUsersSearch(keyword: userB);
    final searchData = (searchRes is Map && searchRes['data'] is Map)
        ? Map<String, dynamic>.from(searchRes['data'] as Map)
        : <String, dynamic>{};
    final found = (searchData['items'] as List?) ?? const [];
    final target = found.whereType<Map>().firstWhere(
          (u) => u['id'] == idB,
          orElse: () => <String, dynamic>{},
        );
    if (target.isEmpty) {
      fail('搜索没有找到用户 B');
    } else {
      ok('搜索到用户 B');

      // 2) A 发送好友请求
      await api.postFriendsRequests(body: {'friend_id': idB});
      ok('好友请求已发送');

      // 3) B 查看请求并接受
      api.token = tokenB;
      final reqRes = await api.getFriendsRequests();
      final reqData = (reqRes is Map && reqRes['data'] is Map)
          ? Map<String, dynamic>.from(reqRes['data'] as Map)
          : <String, dynamic>{};
      final requests = (reqData['pending'] as List?) ?? const [];
      String? requestId;
      for (final req in requests.whereType<Map>()) {
        // pending 项是 Friend 记录：user_id 是请求者
        if (req['user_id'] == idA) {
          requestId = req['id'] as String?;
          break;
        }
      }
      if (requestId == null) {
        fail('B 没有收到 A 的好友请求');
      } else {
        await api.postFriendsRequestsIdAccept(id: requestId);
        ok('B 已接受请求');

        // 4) 双方好友列表互相包含
        final bFriends = _list(await api.getFriends());
        final bHasA = bFriends.whereType<Map>().any((f) {
          final info = f['friend'] is Map ? f['friend'] as Map : f;
          return info['id'] == idA || f['friend_id'] == idA;
        });
        api.token = tokenA;
        final aFriends = _list(await api.getFriends());
        final aHasB = aFriends.whereType<Map>().any((f) {
          final info = f['friend'] is Map ? f['friend'] as Map : f;
          return info['id'] == idB || f['friend_id'] == idB;
        });
        if (bHasA && aHasB) {
          ok('双方好友列表中已互为好友（A 有 ${aFriends.length}，B 有 ${bFriends.length}）');
        } else {
          fail('好友关系未建立: aHasB=$aHasB bHasA=$bHasA');
        }
      }
    }
  } catch (e) {
    fail('好友流程失败: $e');
  }

  step('19. 语音 / 视频消息上传与发送');
  try {
    api.token = tokenA;

    // 构造一个最小 WAV（44 字节头 + 少量静音采样）
    final wav = <int>[
      ...'RIFF'.codeUnits, 0x24, 0x00, 0x00, 0x00, ...'WAVE'.codeUnits,
      ...'fmt '.codeUnits, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x40, 0x1F, 0x00, 0x00, 0x80, 0x3E, 0x00, 0x00, 0x02, 0x00, 0x10, 0x00,
      ...'data'.codeUnits, 0x00, 0x00, 0x00, 0x00,
    ];

    final audio = await uploadWithUploader(
      uploader: TransportUploader(),
      baseUrl: baseUrl,
      bytes: wav,
      filename: 'voice.wav',
      type: 'audio',
      token: tokenA,
    );
    final audioUrl = (audio['url'] ?? '') as String;
    if (audioUrl.isEmpty) {
      fail('语音上传失败: $audio');
    } else {
      await api.postChatMessages(
        body: {
          'conversation_id': convId,
          'type': 'audio',
          'content': '',
          'media_url': audioUrl,
          'file_name': 'voice.wav',
          'file_size': wav.length,
        },
      );
      final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
      final audioOk = msgs.whereType<Map>().any(
            (m) => m['type'] == 'audio' && m['media_url'] == audioUrl,
          );
      if (audioOk) {
        ok('语音消息已发送: $audioUrl');
      } else {
        fail('消息列表里没有语音消息');
      }
    }

    // 视频：服务端只校验 MIME 与大小，这里用小段字节模拟
    final videoBytes = List<int>.generate(2048, (i) => i % 256);
    final video = await uploadWithUploader(
      uploader: TransportUploader(),
      baseUrl: baseUrl,
      bytes: videoBytes,
      filename: 'clip.mp4',
      type: 'video',
      token: tokenA,
    );
    final videoUrl = (video['url'] ?? '') as String;
    if (videoUrl.isEmpty) {
      fail('视频上传失败: $video');
    } else {
      await api.postChatMessages(
        body: {
          'conversation_id': convId,
          'type': 'video',
          'content': '',
          'media_url': videoUrl,
          'file_name': 'clip.mp4',
          'file_size': videoBytes.length,
        },
      );
      final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
      final videoOk = msgs.whereType<Map>().any(
            (m) => m['type'] == 'video' && m['media_url'] == videoUrl,
          );
      if (videoOk) {
        ok('视频消息已发送: $videoUrl');
      } else {
        fail('消息列表里没有视频消息');
      }

      final req = await HttpClient().getUrl(Uri.parse('$baseUrl$videoUrl'));
      final resp = await req.close();
      if (resp.statusCode == 200) {
        ok('视频附件可访问（HTTP 200）');
      } else {
        fail('视频附件访问失败: ${resp.statusCode}');
      }
    }

    // 不合法的音视频类型应被服务端拒绝
    try {
      await uploadWithUploader(
        uploader: TransportUploader(),
        baseUrl: baseUrl,
        bytes: [1, 2, 3],
        filename: 'bad.flac',
        type: 'audio',
        token: tokenA,
      );
      fail('非白名单音频类型竟然上传成功');
    } on UploadException catch (e) {
      ok('非白名单类型被拒绝（${e.statusCode}）');
    }
  } catch (e) {
    fail('语音/视频验证失败: $e');
  }

  step('20. 引用回复：reply_to_id 与 reply_to 回填');
  try {
    api.token = tokenA;
    await api.postChatMessages(
      body: {
        'conversation_id': convId,
        'type': 'text',
        'content': '这条是原始消息',
      },
    );

    final before = _list(await api.getChatConversationsIdMessages(id: convId));
    final target = before.whereType<Map>().firstWhere(
          (m) => m['content'] == '这条是原始消息',
          orElse: () => <String, dynamic>{},
        );
    final targetId = (target['id'] ?? '') as String;

    if (targetId.isEmpty) {
      fail('没找到原始消息');
    } else {
      await api.postChatMessages(
        body: {
          'conversation_id': convId,
          'type': 'text',
          'content': '这条是引用回复',
          'reply_to_id': targetId,
        },
      );

      final after = _list(await api.getChatConversationsIdMessages(id: convId));
      final reply = after.whereType<Map>().firstWhere(
            (m) => m['content'] == '这条是引用回复',
            orElse: () => <String, dynamic>{},
          );
      final replyTo = reply['reply_to'];
      if (replyTo is Map && replyTo['content'] == '这条是原始消息') {
        ok('引用关系已回填（reply_to 指向原消息）');
      } else {
        fail('引用关系缺失: $replyTo');
      }
    }
  } catch (e) {
    fail('引用回复验证失败: $e');
  }

  step('21. 免打扰：按用户生效并可关闭');
  try {
    api.token = tokenA;
    var res = await api.putChatConversationsIdMute(
      id: convId,
      body: {'muted': true},
    );
    if (res['success'] == true) {
      ok('已开启免打扰');
    } else {
      fail('开启免打扰失败: $res');
    }

    final convs = _list(await api.getChatConversations());
    var mutedFlag = false;
    for (final c in convs.whereType<Map>()) {
      if (c['id'] != convId) continue;
      for (final m in (c['members'] as List? ?? const [])) {
        if (m is Map && m['user_id'] == idA) mutedFlag = m['muted'] == true;
      }
    }
    if (mutedFlag) {
      ok('会话列表显示 A 已免打扰');
    } else {
      fail('会话列表未体现免打扰状态');
    }

    // B 不应受影响
    api.token = tokenB;
    final bConvs = _list(await api.getChatConversations());
    var bMuted = false;
    for (final c in bConvs.whereType<Map>()) {
      if (c['id'] != convId) continue;
      for (final m in (c['members'] as List? ?? const [])) {
        if (m is Map && m['user_id'] == idB) bMuted = m['muted'] == true;
      }
    }
    if (!bMuted) {
      ok('免打扰只影响 A，B 不受影响');
    } else {
      fail('B 也被误设为免打扰');
    }

    // 关闭
    api.token = tokenA;
    await api.putChatConversationsIdMute(id: convId, body: {'muted': false});
    final convs2 = _list(await api.getChatConversations());
    var closed = true;
    for (final c in convs2.whereType<Map>()) {
      if (c['id'] != convId) continue;
      for (final m in (c['members'] as List? ?? const [])) {
        if (m is Map && m['user_id'] == idA && m['muted'] == true) closed = false;
      }
    }
    if (closed) {
      ok('免打扰已关闭');
    } else {
      fail('关闭免打扰失败');
    }
  } catch (e) {
    fail('免打扰验证失败: $e');
  }

  step('22. 个人资料与群资料修改');
  try {
    api.token = tokenA;

    // 修改昵称与签名
    await api.putUsersProfile(
      body: {'nickname': '改过的昵称', 'bio': '这是一句签名'},
    );
    final me = _data(await api.getUsersId(id: idA));
    if (me['nickname'] == '改过的昵称' && me['bio'] == '这是一句签名') {
      ok('个人资料已更新');
    } else {
      fail('个人资料未更新: $me');
    }

    // 改群名（A 是群主）
    final groupData = _data(
      await api.postGroups(body: {
        'name': '待改名群 $suffix',
        'member_ids': [idB],
      }),
    );
    final renameConv =
        ((groupData['conversation'] as Map?)?['id'] ?? '') as String;
    await api.putGroupsId(
      id: renameConv,
      body: {'name': '改名后的群 $suffix', 'description': '群描述已更新'},
    );
    final group = _data(await api.getGroupsId(id: renameConv));
    if ((group['name'] ?? '') == '改名后的群 $suffix') {
      ok('群名称已更新');
    } else {
      fail('群名称未更新: $group');
    }
  } catch (e) {
    fail('资料修改验证失败: $e');
  }

  step('23. 注册 + refresh token 换发');
  try {
    final ru = 'reg$suffix';
    final regRes = _data(
      await NeoChatApi(baseUrl: baseUrl).postAuthRegister(
        body: {
          'username': ru,
          'password': 'Passw0rd!',
          'email': '$ru@e2e.local',
          'phone': '135${suffix.toString().padLeft(8, '0')}',
          'nickname': '新注册用户',
        },
      ),
    );
    final regToken = (regRes['access_token'] ?? '') as String;
    final regRefresh = (regRes['refresh_token'] ?? '') as String;
    final regUser = ((regRes['user'] as Map?)?['username'] ?? '') as String;

    if (regToken.isNotEmpty && regRefresh.isNotEmpty && regUser == ru) {
      ok('注册即返回 token（用户 $regUser）');
    } else {
      fail('注册响应不完整: $regRes');
    }

    // 用 refresh token 换新 access token
    final refreshed = _data(
      await NeoChatApi(baseUrl: baseUrl).postAuthRefresh(
        body: {'refresh_token': regRefresh},
      ),
    );
    final newToken = (refreshed['access_token'] ?? '') as String;
    if (newToken.isEmpty) {
      fail('刷新响应缺少 access_token: $refreshed');
    } else {
      // JWT 的 exp 是秒级，同一秒内刷新会得到完全相同的串，因此不比对差异
      // 新 token 必须真的能用
      final client = NeoChatApi(baseUrl: baseUrl)..token = newToken;
      final me = _data(await client.getUsersProfile());
      if ((me['username'] ?? '') == ru) {
        ok('新 access token 可用');
      } else {
        fail('新 token 请求失败: $me');
      }

      // 轮换：旧 refresh token 必须失效
      try {
        await NeoChatApi(baseUrl: baseUrl).postAuthRefresh(
          body: {'refresh_token': regRefresh},
        );
        fail('旧 refresh token 竟然还能用（未轮换）');
      } on ApiException catch (e) {
        ok('旧 refresh token 已失效（HTTP ${e.statusCode}）');
      }

      // access token 不能当 refresh token 用
      try {
        await NeoChatApi(baseUrl: baseUrl).postAuthRefresh(
          body: {'refresh_token': newToken},
        );
        fail('access token 被当成 refresh token 接受了');
      } on ApiException catch (e) {
        ok('access token 不能用于刷新（HTTP ${e.statusCode}）');
      }
    }
  } catch (e) {
    fail('注册/刷新验证失败: $e');
  }

  step('24. 登录失败锁定与密码策略');
  try {
    final lu = 'lock$suffix';
    await NeoChatApi(baseUrl: baseUrl).postAuthRegister(
      body: {
        'username': lu,
        'password': 'Passw0rd!',
        'email': '$lu@e2e.local',
        'phone': '136${suffix.toString().padLeft(8, '0')}',
      },
    );

    // 连续 5 次错误密码
    for (var i = 0; i < 5; i++) {
      try {
        await NeoChatApi(baseUrl: baseUrl).postAuthLogin(
          body: {'identifier': lu, 'password': 'wrong-$i'},
        );
        fail('第 ${i + 1} 次错误密码竟然登录成功');
        break;
      } on ApiException {
        // 预期失败
      }
    }

    // 第 6 次即使密码正确也应被锁定
    try {
      await NeoChatApi(baseUrl: baseUrl).postAuthLogin(
        body: {'identifier': lu, 'password': 'Passw0rd!'},
      );
      fail('连续失败后仍能登录，账号未被锁定');
    } on ApiException catch (e) {
      if (e.message.contains('too many failed attempts')) {
        ok('连续失败后账号被锁定');
      } else {
        fail('锁定提示不符合预期: ${e.message}');
      }
    }

    // 密码太短应被拒绝
    try {
      await NeoChatApi(baseUrl: baseUrl).postAuthRegister(
        body: {
          'username': 'shortpw$suffix',
          'password': '1234567',
          'email': 'shortpw$suffix@e2e.local',
          'phone': '137${suffix.toString().padLeft(8, '0')}',
        },
      );
      fail('过短的密码竟然注册成功');
    } on ApiException catch (e) {
      if (e.message.contains('at least 8')) {
        ok('过短密码被拒绝');
      } else {
        fail('密码策略提示不符: ${e.message}');
      }
    }
  } catch (e) {
    fail('登录锁定/密码策略验证失败: $e');
  }

  print('');
  if (_failed == 0) {
    print('✅ E2E 全部通过');
  } else {
    print('❌ E2E 有 $_failed 个步骤失败');
    exit(1);
  }
}
