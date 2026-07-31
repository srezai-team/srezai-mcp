# Образ нужен каталогам MCP (Glama и подобные): они собирают сервер в песочнице
# и опрашивают его по протоколу. Без Dockerfile сборка выводится эвристикой и
# падает — листинг остаётся, но из поиска и рекомендаций исключается.
#
# Сборка отделена от запуска: tsup, TypeScript и tsx нужны только чтобы получить
# dist, и в финальном образе им делать нечего.
FROM node:22-alpine AS build

WORKDIR /app

# Слой зависимостей отдельно от исходников: правка src не инвалидирует npm ci.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Зависимостей во время работы у пакета нет — только встроенные модули Node,
# поэтому node_modules в финальный образ не переносится.
COPY --from=build /app/dist ./dist
COPY package.json LICENSE README.md ./

# stdio-транспорт: клиент общается с процессом через stdin/stdout, порт не нужен.
# Ключ передаётся окружением: docker run -e SREZAI_API_KEY=srz_live_… <image>
ENTRYPOINT ["node", "dist/index.js"]
