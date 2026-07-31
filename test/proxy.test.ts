/** Проверяем ровно то, что прокси и делает: разбор SSE, Bearer, обработку 401. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { forward } from "../src/proxy.js";
import { messagesFrom, parseSse } from "../src/rpc.js";

const KEY = "srz_live_test";
const REQ = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}';

/** Ответ-заготовка: fetch подменяется, сеть не нужна. */
function stubFetch(
  status: number,
  contentType: string,
  body: string,
  seen?: { init?: RequestInit | undefined },
): typeof globalThis.fetch {
  return (async (_url: string, init?: RequestInit) => {
    if (seen) seen.init = init;
    return new Response(body, {
      status,
      headers: { "Content-Type": contentType },
    });
  }) as unknown as typeof globalThis.fetch;
}

test("кадр SSE разбирается в полезную нагрузку", () => {
  const raw = 'event: message\ndata: {"jsonrpc":"2.0","id":1}\n\n';
  assert.deepEqual(parseSse(raw), ['{"jsonrpc":"2.0","id":1}']);
});

test("многострочный data склеивается", () => {
  assert.deepEqual(parseSse("data: {\ndata: }\n\n"), ["{\n}"]);
});

test("один поток может нести несколько сообщений", () => {
  const raw = 'data: {"id":1}\n\ndata: {"id":2}\n\n';
  assert.deepEqual(messagesFrom("text/event-stream", raw), ['{"id":1}', '{"id":2}']);
});

test("обычный JSON проходит как есть", () => {
  assert.deepEqual(messagesFrom("application/json", '{"id":1}\n'), ['{"id":1}']);
});

test("пустое тело не даёт пустых строк в stdout", () => {
  assert.deepEqual(messagesFrom("application/json", "   "), []);
});

test("ключ уходит в заголовке Bearer", async () => {
  const seen: { init?: RequestInit | undefined } = {};
  const out: string[] = [];
  await forward(REQ, {
    apiKey: KEY,
    fetch: stubFetch(200, "application/json", '{"jsonrpc":"2.0","id":1}', seen),
    write: (l) => out.push(l),
  });
  const headers = seen.init?.headers as Record<string, string>;
  assert.equal(headers["Authorization"], `Bearer ${KEY}`);
  assert.match(headers["Accept"] ?? "", /text\/event-stream/);
  assert.deepEqual(out, ['{"jsonrpc":"2.0","id":1}']);
});

test("без ключа заголовок Authorization не отправляется", async () => {
  // Пустой «Bearer » сервер разбирает как неверный ключ и отвечает 401, тогда
  // как запрос совсем без заголовка получает анонимный tools/list. Каталоги MCP
  // опрашивают сервер именно так — ключа у них нет.
  const seen: { init?: RequestInit | undefined } = {};
  await forward(REQ, {
    fetch: stubFetch(200, "application/json", '{"jsonrpc":"2.0","id":1}', seen),
    write: () => {},
  });
  const headers = seen.init?.headers as Record<string, string>;
  assert.equal("Authorization" in headers, false);
});

test("тело запроса пересылается дословно", async () => {
  const seen: { init?: RequestInit | undefined } = {};
  await forward(`  ${REQ}  `, {
    apiKey: KEY,
    fetch: stubFetch(200, "application/json", "{}", seen),
    write: () => {},
  });
  assert.equal(seen.init?.body, REQ);
});

test("401 объясняет, что не так с ключом", async () => {
  const out: string[] = [];
  await forward(REQ, {
    apiKey: KEY,
    fetch: stubFetch(401, "application/json", '{"error":"invalid_token"}'),
    write: (l) => out.push(l),
  });
  const msg = JSON.parse(out[0] ?? "{}") as {
    id: number;
    error: { message: string };
  };
  assert.equal(msg.id, 1);
  assert.match(msg.error.message, /srz_live_/);
  assert.match(msg.error.message, /dashboard/);
});

test("уведомление без id не получает ответа", async () => {
  const out: string[] = [];
  await forward('{"jsonrpc":"2.0","method":"notifications/initialized"}', {
    apiKey: KEY,
    fetch: stubFetch(401, "application/json", "{}"),
    write: (l) => out.push(l),
  });
  assert.deepEqual(out, []);
});

test("сетевой сбой превращается в ответ JSON-RPC, а не в падение", async () => {
  const out: string[] = [];
  await forward(REQ, {
    apiKey: KEY,
    fetch: (() => Promise.reject(new Error("ECONNREFUSED"))) as unknown as typeof fetch,
    write: (l) => out.push(l),
  });
  const msg = JSON.parse(out[0] ?? "{}") as { error: { message: string } };
  assert.match(msg.error.message, /ECONNREFUSED/);
});

test("пустая строка игнорируется", async () => {
  const out: string[] = [];
  let called = false;
  await forward("   ", {
    apiKey: KEY,
    fetch: (() => {
      called = true;
      return Promise.resolve(new Response("{}"));
    }) as unknown as typeof fetch,
    write: (l) => out.push(l),
  });
  assert.equal(called, false);
  assert.deepEqual(out, []);
});
