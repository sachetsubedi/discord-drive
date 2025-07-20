FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

RUN pnpm prisma migrate deploy

RUN pnpm prisma generate

COPY . .

EXPOSE 3000

RUN pnpm build

CMD [ "pnpm", "start" ]