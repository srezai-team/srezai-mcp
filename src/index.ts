#!/usr/bin/env node
/**
 * MCP-сервер срезAI для клиентов, умеющих только stdio.
 *
 * Клиенты с поддержкой Streamable HTTP (Claude Desktop, современные IDE-агенты)
 * подключаются к https://srezai.ru/api/mcp напрямую и в этом пакете не
 * нуждаются. Пакет нужен там, где доступен лишь запуск процесса.
 *
 * Готовый мост mcp-remote здесь не подходит: он начинает с OAuth-регистрации
 * клиента и не умеет статический Bearer-ключ, на котором работает API.
 */

import { createInterface } from "node:readline";

import { DEFAULT_ENDPOINT, forward } from "./proxy.js";

const KEY = process.env["SREZAI_API_KEY"];

// Без ключа процесс не завершается: initialize и tools/list сервер отдаёт и
// анонимно, а каталоги MCP опрашивают сервер в песочнице, где ключа нет и взять
// его негде. Выход с кодом 1 там выглядел как неработающий сервер. Вызовы
// инструментов упрутся в 401 — с объяснением ниже, а не с молчаливым падением.
if (!KEY) {
  process.stderr.write(
    "srezai-mcp: не задан SREZAI_API_KEY — доступен только просмотр списка " +
      "инструментов.\n\n" +
      "Ключ создаётся в личном кабинете: https://srezai.ru/dashboard\n" +
      "Пример конфигурации клиента:\n\n" +
      '  "srezai": {\n' +
      '    "command": "npx",\n' +
      '    "args": ["-y", "srezai-mcp"],\n' +
      '    "env": { "SREZAI_API_KEY": "srz_live_ваш_ключ" }\n' +
      "  }\n",
  );
}

const endpoint = process.env["SREZAI_MCP_ENDPOINT"] ?? DEFAULT_ENDPOINT;

// stdout занят протоколом: любая посторонняя строка ломает клиенту разбор.
// Всё человеческое уходит в stderr.
const log = (message: string): void => {
  process.stderr.write(`srezai-mcp: ${message}\n`);
};

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Сообщения обрабатываются по очереди.
 *
 * Клиент вправе прислать следующий запрос, не дождавшись ответа на предыдущий,
 * но stdout один: параллельная запись перемешала бы строки.
 */
let queue: Promise<void> = Promise.resolve();

createInterface({ input: process.stdin }).on("line", (line) => {
  queue = queue.then(() =>
    forward(line, { apiKey: KEY, endpoint, write, log }).catch((err: unknown) => {
      log(err instanceof Error ? err.message : String(err));
    }),
  );
});

process.stdin.on("end", () => {
  void queue.then(() => process.exit(0));
});
