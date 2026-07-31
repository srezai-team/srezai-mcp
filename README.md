# srezai-mcp

MCP-сервер [срезAI](https://srezai.ru): веб-поиск, чтение страниц, скриншоты и
извлечение данных по схеме как встроенные инструменты ИИ-агента.

MCP server for [SrezAI](https://srezai.ru) — web search, page reading,
screenshots and schema-based extraction as native agent tools.

## Нужен ли вам этот пакет / Do you need this package

**Скорее всего нет.** Если ваш клиент умеет Streamable HTTP (Claude Desktop,
современные IDE-агенты) — подключайтесь к серверу напрямую, без установки:

```json
{
  "mcpServers": {
    "srezai": {
      "url": "https://srezai.ru/api/mcp",
      "headers": { "Authorization": "Bearer srz_live_ваш_ключ" }
    }
  }
}
```

Пакет нужен там, где клиент умеет **только stdio** и не поддерживает удалённые
серверы по HTTP.

## Установка / Installation

```json
{
  "mcpServers": {
    "srezai": {
      "command": "npx",
      "args": ["-y", "srezai-mcp"],
      "env": { "SREZAI_API_KEY": "srz_live_ваш_ключ" }
    }
  }
}
```

Ключ создаётся в [личном кабинете](https://srezai.ru/dashboard). Нужен Node 18+.

Если Windows капризничает с переменными окружения, в некоторых клиентах
помогает такая форма:

```
cmd /c "set SREZAI_API_KEY=srz_live_ваш_ключ && npx -y srezai-mcp"
```

## Инструменты / Tools

| Инструмент | Что делает |
| --- | --- |
| `web_search` | Поиск актуальной информации: заголовок, ссылка, фрагмент |
| `image_search` | Поиск картинок: прямые ссылки, источник, разрешение |
| `read_url` | Страница → чистый Markdown без навигации и рекламы |
| `read_urls` | То же, до 5 страниц за вызов |
| `fetch_page` | Скриншот и Markdown через реальный браузер |
| `extract` | Только запрошенные поля по вашей схеме, без выдуманных значений |
| `deep_research` | Агентное исследование по многим источникам, 10 с – 2 мин |
| `get_usage` | Баланс, квота и цены. Бесплатно, лимит не расходует |

Описания, параметры и цены живут на сервере, а не в пакете: агент видит их
через `tools/list` в момент подключения. Новый инструмент появляется у вас без
обновления `srezai-mcp`.

## Как это работает / How it works

Пакет — тонкий мост: читает JSON-RPC из stdin, пересылает на
`https://srezai.ru/api/mcp` с вашим ключом, возвращает ответ в stdout.
Собственной логики инструментов в нём нет — поэтому он не может разойтись с тем,
что на самом деле умеет API.

Зависимостей во время работы — ноль: только встроенные модули Node.

Готовый `mcp-remote` здесь не подошёл: он начинает с OAuth-регистрации клиента и
не умеет статический Bearer-ключ, на котором работает срезAI.

## Настройка / Configuration

| Переменная | Назначение |
| --- | --- |
| `SREZAI_API_KEY` | Ключ доступа. Нужен для вызова инструментов |
| `SREZAI_MCP_ENDPOINT` | Другой адрес сервера. По умолчанию `https://srezai.ru/api/mcp` |

Без ключа мост всё равно запускается и отдаёт `initialize` и `tools/list`: список
инструментов сервер публикует анонимно, так его читают каталоги MCP. Вызов любого
инструмента в этом режиме вернёт ошибку с указанием задать `SREZAI_API_KEY`. /
Without a key the bridge still starts and serves `initialize` and `tools/list` —
the tool list is public, which is how MCP directories read it. Calling a tool
returns an error asking you to set `SREZAI_API_KEY`.

## Разработка / Development

```bash
npm ci && npm test && npm run build
```

Docker-образ (его собирают каталоги MCP, опрашивая сервер в песочнице) /
Docker image, built by MCP directories to introspect the server in a sandbox:

```bash
docker build -t srezai-mcp . && docker run --rm -i -e SREZAI_API_KEY=srz_live_ваш_ключ srezai-mcp
```

## Лицензия / License

MIT
