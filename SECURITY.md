# Безопасность / Security

## Куда сообщать / Where to report

Об уязвимости пишите на **support@srezai.ru** с темой `security: srezai-mcp`.
Первый ответ — в течение 1 рабочего дня. Публичный issue для уязвимости лучше
не открывать: пакет получает на вход API-ключ, и до выпуска исправления описание
проблемы работает как инструкция.

Report vulnerabilities to **support@srezai.ru** with the subject
`security: srezai-mcp`. First reply within 1 business day. Please avoid a public
issue: the package handles an API key, so until a fix ships the report doubles as
an exploit guide.

## Не присылайте ключи / Do not send keys

В письме, issue, логе и скриншоте не должно быть ключа `srz_live_…`. Если ключ
всё же куда-то попал — отзовите его в личном кабинете на
[srezai.ru](https://srezai.ru), это занимает минуту и не требует нашего участия.

Never include an `srz_live_…` key in an email, issue, log or screenshot. If one
leaked anyway, revoke it in your dashboard at [srezai.ru](https://srezai.ru) —
that takes a minute and needs nothing from us.

## Что относится к этому репозиторию / Scope

Здесь живёт только stdio-мост: он читает строку JSON-RPC из stdin, пересылает её
на `https://srezai.ru/api/mcp` с вашим ключом и печатает ответ в stdout. Список
инструментов, их параметры и цены приходят с сервера — в пакете их нет.

Поэтому в этот репозиторий идут находки вида «ключ утекает в stdout или в лог»,
«мост шлёт запрос не на тот адрес», «зависимость с известной CVE». Проблемы самого
API (`api/mcp`, `api/v1/*`, личный кабинет) относятся не к пакету — их присылайте
на тот же адрес, но упоминайте сервис, а не `srezai-mcp`.

This repository contains only the stdio bridge: it reads a JSON-RPC line from
stdin, forwards it to `https://srezai.ru/api/mcp` with your key and prints the
response to stdout. The tool list, parameters and prices come from the server.

So findings that belong here look like: a key leaking to stdout or a log, the
bridge sending requests to the wrong host, a dependency with a known CVE. Issues
in the API itself (`api/mcp`, `api/v1/*`, the dashboard) are out of scope for the
package — same address, just say which service you mean.

## Поддерживаемые версии / Supported versions

Исправления выходят в последнем минорном релизе. Старые версии не патчатся:
обновление — `npx -y srezai-mcp@latest` или новый `npm i -g srezai-mcp`.

Fixes ship in the latest minor release. Older versions are not patched; update
with `npx -y srezai-mcp@latest` or a fresh `npm i -g srezai-mcp`.
