FROM node:22.14-alpine3.21 AS build

WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false
COPY . .
RUN yarn build

FROM node:22.14-alpine3.21 AS final
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

COPY --from=build /src /app

CMD ["node", "dist/src/main.js"]
