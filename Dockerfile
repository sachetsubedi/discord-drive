FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

RUN pnpm prisma migrate deploy

RUN pnpm prisma generate

RUN pnpm build

CMD [ "pnpm", "start" ]