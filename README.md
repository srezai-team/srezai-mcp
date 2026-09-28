# srezai-mcp

MCP-сервер [срезAI](https://srezai.ru) — поисковый API для ИИ-агентов: живой
веб-поиск по Рунету и глобальному вебу, чтение страниц в чистый Markdown, карта
сайта, извлечение по схеме, проверка утверждений, готовые ответы и многошаговое
исследование как встроенные инструменты ИИ-агента.

MCP server for [SrezAI](https://srezai.ru) — a search API for AI agents: live web
search, page reading into clean Markdown, site map, schema-based extraction,
claim verification, ready answers and multi-step research as native agent tools.

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
| `web_search` | Поиск в живом вебе: заголовок, ссылка, фрагмент. Категории, языки, свежесть, фильтр по доменам |
| `image_search` | Картинки: прямые ссылки, источник, разрешение |
| `read_url` | Страница → чистый Markdown; длинная приходит окнами по `offset` |
| `read_urls` | То же, до 5 страниц за вызов |
| `fetch_page` | Рендер в браузере: скриншот и Markdown; если рендер не удался — текст за 1 кредит вместо 3 |
| `extract` | Только запрошенные поля по вашей схеме, без текста страницы; до 5 ссылок |
| `verify_claim` | Вердикт `supported` / `refuted` / `mixed` / `unverified` с дословными цитатами по 2–5 независимым доменам |
| `answer_search` | Готовый ответ со ссылками: поиск, семантическое ранжирование BGE-reranker-v2-m3, чтение и синтез |
| `deep_research` | Агентное исследование по многим источникам; идёт долго, поэтому возвращает талон, а ответ забирается по нему |
| `get_usage` | Баланс, квота, расход по услугам и прайс-лист. Бесплатно, квоту не расходует |
| `map` | Карта сайта: адреса и разделы из `sitemap` или со стартовой страницы, до 200 адресов за вызов |
| `crawl` | Карта адресов плюс текст найденных страниц; фильтры по адресу и по тексту |

Описания, параметры и цены живут на сервере, а не в пакете: агент видит их
через `tools/list` в момент подключения. Новый инструмент появляется у вас без
обновления `srezai-mcp`.

Платите только за результат: ошибка и вызов, не принёсший ничего, не списываются.
1 кредит = 0,10 ₽, точный прайс-лист отдаёт `get_usage`.

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

Правки принимаются здесь, на GitHub: [CONTRIBUTING.md](CONTRIBUTING.md) объясняет,
почему копия на GitVerse — зеркало и как прислать патч, если GitHub недоступен.
Об уязвимости — [SECURITY.md](SECURITY.md), не публичным issue. Правила общения —
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Changes go to GitHub: [CONTRIBUTING.md](CONTRIBUTING.md) explains why the GitVerse
copy is a mirror and how to send a patch if GitHub is unavailable to you. For
vulnerabilities see [SECURITY.md](SECURITY.md) rather than a public issue. Ground
rules: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Лицензия / License

MIT
