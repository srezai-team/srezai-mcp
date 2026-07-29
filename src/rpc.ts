/**
 * Разбор ответа /api/mcp.
 *
 * Эндпоинт отвечает либо обычным JSON, либо потоком SSE — зависит от метода и
 * от согласования с клиентом. Прокси должен понимать оба формата: клиент на
 * другом конце stdio ждёт строки JSON-RPC и про SSE ничего не знает.
 */

/** Кадр SSE → полезная нагрузка. Служебные поля (event, id, retry) не нужны. */
export function parseSse(body: string): string[] {
  const out: string[] = [];
  for (const frame of body.split(/\r?\n\r?\n/)) {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (data) out.push(data);
  }
  return out;
}

/**
 * Ответ HTTP → строки JSON-RPC для stdout.
 *
 * Возвращает массив: один SSE-поток может нести несколько сообщений, а
 * уведомление (запрос без id) — ни одного.
 */
export function messagesFrom(contentType: string, body: string): string[] {
  if (!body.trim()) return [];
  return contentType.includes("text/event-stream")
    ? parseSse(body)
    : [body.trim()];
}

/** Ошибка транспорта в виде валидного ответа JSON-RPC. */
export function errorResponse(
  id: unknown,
  message: string,
  code = -32603,
): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}
