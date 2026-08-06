# Участие в разработке / Contributing

## Куда отправлять правки / Where to send changes

Исходный репозиторий — **[github.com/srezai-team/srezai-mcp](https://github.com/srezai-team/srezai-mcp)**.
Issues и pull request'ы принимаются только там.

Копия на [gitverse.ru/a1_ai_a4b/srezai-mcp](https://gitverse.ru/a1_ai_a4b/srezai-mcp) —
зеркало для тех, кому GitHub недоступен или неудобен. Оно обновляется пушем вслед
за GitHub, поэтому коммит, сделанный прямо в зеркале, при следующем обновлении
конфликтует с основной историей и будет потерян. Если GitHub для вас закрыт,
пришлите патч (`git format-patch`) на support@srezai.ru — приложим от вашего имени.

The upstream repository is
**[github.com/srezai-team/srezai-mcp](https://github.com/srezai-team/srezai-mcp)**;
issues and pull requests go there. The
[GitVerse copy](https://gitverse.ru/a1_ai_a4b/srezai-mcp) is a push-only mirror,
so a commit made there conflicts with upstream history on the next sync and gets
lost. If GitHub is unavailable to you, send a `git format-patch` to
support@srezai.ru and we will apply it under your name.

## Что здесь уместно / What belongs here

Пакет намеренно маленький: приём строки JSON-RPC из stdin, пересылка на
`https://srezai.ru/api/mcp` с ключом из `SREZAI_API_KEY`, вывод ответа в stdout.
Список инструментов, их параметры и цены живут на сервере — так новый инструмент
появляется у всех без обновления версии.

Отсюда следует, чего в PR лучше не делать: копировать схемы инструментов в код,
кешировать `tools/list`, добавлять свою валидацию аргументов. Всё это придётся
обновлять при каждом изменении API, и мост начнёт врать о возможностях сервера.

Welcome: исправления ошибок, совместимость с MCP-клиентами, диагностика (понятное
сообщение вместо стектрейса), зависимости и сборка.

The package is deliberately thin: read a JSON-RPC line from stdin, forward it to
`https://srezai.ru/api/mcp` with the key from `SREZAI_API_KEY`, print the response
to stdout. Tool definitions and prices live on the server, so a new tool reaches
everyone without a release.

Which means: please don't copy tool schemas into the code, cache `tools/list`, or
add local argument validation — all of that needs updating on every API change and
makes the bridge misreport what the server can do. Bug fixes, MCP client
compatibility, better error messages, dependency and build work are welcome.

## Локально / Locally

```bash
npm ci && npm test && npm run build
```

Тесты не требуют ключа и в сеть не ходят. Для проверки живьём положите настоящий
ключ в `SREZAI_API_KEY` — в репозиторий он попадать не должен, ни в тесте, ни в
примере, ни в логе из вывода.

Tests need no key and make no network calls. To try it against the live service put
a real key in `SREZAI_API_KEY` — it must never end up in the repository, in a test,
an example or a pasted log.

## Оформление / Style

- Один PR — одна тема. Рефакторинг «по пути» лучше отдельным PR.
- Комментарии объясняют **почему** так, а не что делает строка.
- Тексты, которые видит пользователь (сообщения об ошибках, README), — на двух
  языках: русский, затем английский через ` / `. Мелкие модели русский держат
  хуже, а пакет ставят и за пределами РФ.

- One topic per PR; drive-by refactoring is better as its own PR.
- Comments explain **why**, not what the line does.
- User-facing text (error messages, README) is bilingual: Russian first, then
  English after ` / `. Small models handle Russian less reliably, and the package
  is installed outside Russia too.
