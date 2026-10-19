"""Web 端检查：用 CDP 驱动真实 Chrome。

前置：先执行 `bash scripts/verify_web.sh start`（起后端、静态服务、headless Chrome）。
本脚本会：
  1) 打开构建产物，确认 Flutter 已在浏览器里挂载（出现 flt-glass-pane）
  2) 在浏览器 origin 下完成 注册 → 建群 → 发消息 → 读回（验证 CORS 与 fetch 路径）
  3) 确认没有 JS 异常
"""
import asyncio
import json
import os
import sys
import urllib.request

import websockets

APP_URL = os.environ.get("WEB_APP_URL", "http://127.0.0.1:18091/")
API = os.environ.get("WEB_API_URL", "http://127.0.0.1:18090")
DEVTOOLS = os.environ.get("CHROME_DEVTOOLS", "http://127.0.0.1:9222")


def page_target(retries: int = 30) -> str:
    """复用 Chrome 自带的 about:blank 标签页（新建标签在 headless 下偶发不导航）"""
    last_err = None
    for _ in range(retries):
        try:
            with urllib.request.urlopen(f"{DEVTOOLS}/json/list", timeout=10) as r:
                targets = json.load(r)
            pages = [t for t in targets if t.get("type") == "page"]
            if pages:
                return pages[0]["webSocketDebuggerUrl"]
        except Exception as exc:  # noqa: BLE001
            last_err = exc
        try:
            req = urllib.request.Request(f"{DEVTOOLS}/json/new?about:blank", method="PUT")
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.load(r)["webSocketDebuggerUrl"]
        except Exception as exc:  # noqa: BLE001
            last_err = exc
        import time as _t

        _t.sleep(1)
    raise RuntimeError(f"没有可用的 page target: {last_err}")


class CDP:
    def __init__(self, ws):
        self.ws = ws
        self.next_id = 0
        self.console = []
        self.errors = []

    async def call(self, method, **params):
        self.next_id += 1
        msg_id = self.next_id
        await self.ws.send(json.dumps({"id": msg_id, "method": method, "params": params}))
        while True:
            raw = await asyncio.wait_for(self.ws.recv(), timeout=30)
            data = json.loads(raw)
            if data.get("id") == msg_id:
                if "error" in data:
                    raise RuntimeError(f"{method} failed: {data['error']}")
                return data.get("result", {})
            if data.get("method") == "Runtime.consoleAPICalled":
                self.console.append(
                    " ".join(
                        str(a.get("value", a.get("description", "")))
                        for a in data["params"]["args"]
                    )
                )
            if data.get("method") == "Runtime.exceptionThrown":
                self.errors.append(str(data["params"]["exceptionDetails"])[:300])

    async def send_only(self, method, **params):
        """只发不等待：headless 下 Page.navigate 的响应偶发丢失，但导航已发生"""
        self.next_id += 1
        await self.ws.send(json.dumps({"id": self.next_id, "method": method, "params": params}))

    async def eval(self, expression, await_promise=False):
        res = await self.call(
            "Runtime.evaluate",
            expression=expression,
            returnByValue=True,
            awaitPromise=await_promise,
        )
        if res.get("exceptionDetails"):
            raise RuntimeError(str(res["exceptionDetails"])[:300])
        return res.get("result", {}).get("value")


async def main() -> int:
    ws_url = page_target()
    async with websockets.connect(ws_url, max_size=20_000_000) as ws:
        cdp = CDP(ws)
        await cdp.call("Runtime.enable")
        await cdp.call("Page.enable")
        await cdp.send_only("Page.navigate", url=APP_URL)

        booted = False
        for _ in range(60):
            await asyncio.sleep(0.5)
            try:
                booted = await asyncio.wait_for(
                    cdp.eval(
                        "!!document.querySelector('flt-glass-pane') || !!document.querySelector('flutter-view')"
                    ),
                    timeout=10,
                )
            except Exception:  # noqa: BLE001
                booted = False
            if booted:
                break

        title = await cdp.eval("document.title")
        print(f"PAGE title={title!r} flutter_booted={booted}")

        suffix = str(int(asyncio.get_event_loop().time() * 1000) % 100000000)
        username = f"webrun{suffix}"
        result = await cdp.eval(
            f"""
        (async () => {{
          const API = {json.dumps(API)};
          const post = (path, body, token) => fetch(API + path, {{
            method: 'POST',
            headers: Object.assign({{'Content-Type': 'application/json'}},
              token ? {{Authorization: 'Bearer ' + token}} : {{}}),
            body: JSON.stringify(body),
          }}).then(r => r.json().then(j => ({{status: r.status, json: j}})));

          const reg = await post('/api/v1/auth/register',
            {{username: '{username}', password: 'Passw0rd!',
              email: '{username}@web.local', phone: '138{suffix.zfill(8)}'}});
          if (reg.status !== 200) return {{step: 'register', status: reg.status, body: reg.json}};

          const token = reg.json.data.access_token;
          const group = await post('/api/v1/groups', {{name: 'web 浏览器验证群', member_ids: []}}, token);
          if (group.status !== 200) return {{step: 'group', status: group.status, body: group.json}};
          const convId = group.json.data.conversation.id;

          const send = await post('/api/v1/chat/messages',
            {{conversation_id: convId, type: 'text', content: '浏览器发出的消息'}}, token);
          if (send.status !== 200) return {{step: 'send', status: send.status, body: send.json}};

          const listRes = await fetch(API + '/api/v1/chat/conversations/' + convId + '/messages',
            {{headers: {{Authorization: 'Bearer ' + token}}}});
          const list = await listRes.json();
          const found = (list.data || []).some(m => m.content === '浏览器发出的消息');
          return {{step: 'ok', user: reg.json.data.user.username, convId, found}};
        }})()
        """,
            await_promise=True,
        )

        print(f"API_RESULT={json.dumps(result, ensure_ascii=False)}")
        print(f"CONSOLE_LOGS={len(cdp.console)} ERRORS={len(cdp.errors)}")
        for e in cdp.errors[:3]:
            print("ERR:", e)

        ok = (
            booted
            and isinstance(result, dict)
            and result.get("step") == "ok"
            and result.get("found") is True
            and len(cdp.errors) == 0
        )
        print("VERIFY_RESULT=" + ("PASS" if ok else "FAIL"))
        return 0 if ok else 1


sys.exit(asyncio.run(main()))
