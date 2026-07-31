import { errorResponse, messagesFrom } from "./rpc.js";

export const DEFAULT_ENDPOINT = "https://srezai.ru/api/mcp";

/**
 * DeepResearch идёт до двух минут, поэтому таймаут заведомо больше: оборвав
 * соединение раньше сервера, мы спишем кредиты и не отдадим результат.
 */
const TIMEOUT_MS = 300_000;

export interface ProxyOptions {
  /**
   * Ключ доступа. Без него заголовок Authorization не отправляется вовсе:
   * сервер отдаёт initialize и tools/list анонимно, а пустой «Bearer » он
   * разбирает как неверный ключ и отвечает 401.
   */
  apiKey?: string | undefined;
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
  /** Куда писать ответы. Отделено от process.stdout ради тестов. */
  write: (line: string) => void;
  /** Куда писать диагностику. В stdout нельзя: там живёт протокол. */
  log?: (message: string) => void;
}

/** Есть ли у сообщения id: уведомления ответа не требуют. */
function idOf(raw: string): { id: unknown; hasId: boolean } {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    return { id: msg["id"], hasId: "id" in msg };
  } catch {
    return { id: null, hasId: false };
  }
}

/**
 * Пересылает одно сообщение JSON-RPC на удалённый сервер и отдаёт ответ.
 *
 * Прокси намеренно не разбирает содержимое: список инструментов, их описания и
 * цены живут на сервере. Новый инструмент доходит до пользователя без
 * обновления пакета — и не расходится с тем, что реально умеет API.
 */
export async function forward(
  line: string,
  opts: ProxyOptions,
): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed) return;

  const { id, hasId } = idOf(trimmed);
  const doFetch = opts.fetch ?? globalThis.fetch;

  let res: Response;
  try {
    res = await doFetch(opts.endpoint ?? DEFAULT_ENDPOINT, {
      method: "POST",
      headers: {
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: trimmed,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    opts.log?.(`сеть: ${reason}`);
    if (hasId) opts.write(errorResponse(id, `Не удалось связаться с срезAI: ${reason}`));
    return;
  }

  const body = await res.text();

  if (res.status === 401) {
    // Самая частая ошибка настройки. Общий текст «HTTP 401» заставил бы
    // пользователя гадать, а причина всегда одна и та же.
    opts.log?.(opts.apiKey ? "401: ключ не принят" : "401: ключ не задан");
    if (hasId) {
      opts.write(
        errorResponse(
          id,
          opts.apiKey
            ? "срезAI не принял ключ. Проверьте SREZAI_API_KEY: он начинается " +
                "с srz_live_ и создаётся в личном кабинете " +
                "https://srezai.ru/dashboard."
            : "Для вызова инструментов нужен ключ: задайте SREZAI_API_KEY " +
                "(srz_live_…) в конфигурации клиента. Ключ создаётся в личном " +
                "кабинете https://srezai.ru/dashboard.",
          -32001,
        ),
      );
    }
    return;
  }

  const messages = messagesFrom(res.headers.get("Content-Type") ?? "", body);

  if (!res.ok && messages.length === 0) {
    opts.log?.(`HTTP ${res.status}`);
    if (hasId) opts.write(errorResponse(id, `срезAI ответил HTTP ${res.status}.`));
    return;
  }

  for (const msg of messages) opts.write(msg);
}
