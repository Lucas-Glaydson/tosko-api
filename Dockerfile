FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
