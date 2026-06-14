# Tosko API

Backend REST API para o app mobile de gerenciamento de tarefas diárias **Tosko**. Suporta autenticação via Google OAuth 2.0, sincronização de tarefas offline-first e controle de concorrência otimista.

## Stack

- **NestJS** + **TypeScript** — framework e linguagem
- **MongoDB** + **Mongoose** — banco de dados
- **Google Auth Library** — validação de `id_token` do Google Sign-In
- **JWT** — sessão após login
- **Pino** — logs estruturados em JSON
- **Docker Compose** — infraestrutura local
- **Arquitetura Hexagonal** — Domain / Ports & Adapters

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores:

```env
# Aplicação
NODE_ENV=development        # development | production
PORT=3000
CORS_ORIGIN=*               # ex: https://meuapp.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tasks_db

# Google OAuth — Google Cloud Console > Credenciais > ID do cliente OAuth 2.0
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com

# JWT
JWT_SECRET=gere-com-openssl-rand-base64-32   # mínimo 32 caracteres aleatórios
JWT_EXPIRES_IN=7d
```

> **JWT_SECRET** nunca deve ser comprometido. Gere um valor seguro:
> ```bash
> openssl rand -base64 32
> ```

---

## Como Rodar

### Localmente (com MongoDB via Docker)

```bash
# 1. Subir o MongoDB
docker-compose up -d mongodb

# 2. Instalar dependências
pnpm install

# 3. Criar o arquivo de ambiente
cp .env.example .env
# edite .env com seus valores reais

# 4. Iniciar em modo desenvolvimento (hot-reload)
pnpm run start:dev
```

### Com Docker Compose completo

```bash
# Cria a imagem e sobe tudo (API + MongoDB)
docker-compose up --build
```

### Outros comandos úteis

```bash
pnpm run build          # compilar para produção
pnpm run start:prod     # rodar build compilado
pnpm run test           # testes unitários
pnpm run test:e2e       # testes end-to-end
pnpm run lint           # checar e corrigir estilo
```

---

## Endpoints

A URL base padrão é `http://localhost:3000`.

Todas as respostas de sucesso seguem o envelope:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-11T00:00:00.000Z"
}
```

Erros retornam:
```json
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2026-06-11T00:00:00.000Z",
  "path": "/tasks",
  "message": "Token JWT inválido ou expirado"
}
```

---

### Auth

#### `POST /auth/google` — Login com Google

Valida o `id_token` do Google Sign-In e retorna um JWT da API.

**Header:**
```
Authorization: Bearer <google_id_token>
```

**Resposta `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "664f1a2b3c4d5e6f7a8b9c0d",
      "googleSub": "108204452871234567890",
      "email": "usuario@gmail.com",
      "givenName": "João",
      "familyName": "Silva",
      "picture": "https://lh3.googleusercontent.com/...",
      "locale": "pt-BR",
      "lastLoginAt": "2026-06-11T12:00:00.000Z"
    }
  },
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

---

### Users

Todos os endpoints abaixo exigem:
```
Authorization: Bearer <api_jwt>
```

#### `GET /users/me` — Perfil do usuário logado

**Resposta `200`:**
```json
{
  "success": true,
  "data": {
    "id": "664f1a2b3c4d5e6f7a8b9c0d",
    "email": "usuario@gmail.com",
    "givenName": "João",
    "familyName": "Silva",
    "picture": "https://lh3.googleusercontent.com/...",
    "locale": "pt-BR",
    "lastLoginAt": "2026-06-11T12:00:00.000Z"
  },
  "timestamp": "..."
}
```

#### `DELETE /users/me` — Remover conta

**Resposta `200`:**
```json
{
  "success": true,
  "data": { "message": "Conta removida com sucesso" },
  "timestamp": "..."
}
```

---

### Tasks

Todos os endpoints exigem:
```
Authorization: Bearer <api_jwt>
```

#### `GET /tasks` — Listar tarefas

**Query params (todos opcionais):**

| Param         | Tipo      | Valores aceitos                        |
|---------------|-----------|----------------------------------------|
| `status`      | `string`  | `TODO` \| `IN_PROGRESS` \| `DONE`      |
| `priority`    | `string`  | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` |
| `dueDateFrom` | `string`  | ISO 8601 (ex: `2026-06-01`)            |
| `dueDateTo`   | `string`  | ISO 8601 (ex: `2026-06-30`)            |

**Exemplo:** `GET /tasks?status=TODO&priority=HIGH`

**Resposta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "664f1a2b3c4d5e6f7a8b9c0d",
      "userId": "664f1a2b3c4d5e6f7a8b9c00",
      "title": "Estudar NestJS",
      "description": "Ver módulo de hexagonal",
      "estimatedMinutes": 60,
      "status": "TODO",
      "priority": "HIGH",
      "dueDate": "2026-06-15T00:00:00.000Z",
      "deleted": false,
      "version": 1,
      "createdAt": "2026-06-11T12:00:00.000Z",
      "updatedAt": "2026-06-11T12:00:00.000Z"
    }
  ],
  "timestamp": "..."
}
```

---

#### `GET /tasks/:id` — Buscar tarefa por ID

**Resposta `200`:** objeto de tarefa (mesmo formato acima)

**Resposta `404`:**
```json
{ "success": false, "statusCode": 404, "message": "Tarefa não encontrada" }
```

---

#### `POST /tasks` — Criar tarefa

**Body:**
```json
{
  "title": "Estudar NestJS",
  "description": "Ver módulo de hexagonal",
  "estimatedMinutes": 60,
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-06-15"
}
```

| Campo               | Obrigatório | Tipo     | Restrições                        |
|---------------------|-------------|----------|-----------------------------------|
| `title`             | ✅          | `string` | máx. 200 caracteres               |
| `description`       | ❌          | `string` | máx. 2000 caracteres              |
| `estimatedMinutes`  | ❌          | `number` | inteiro, 1–1440 (default: 25)     |
| `status`            | ❌          | `string` | `TODO` \| `IN_PROGRESS` \| `DONE` (default: `TODO`) |
| `priority`          | ❌          | `string` | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` (default: `MEDIUM`) |
| `dueDate`           | ❌          | `string` | ISO 8601                          |

**Resposta `201`:** objeto da tarefa criada

---

#### `POST /tasks/bulk` — Criar múltiplas tarefas (sincronização offline)

**Body:**
```json
{
  "tasks": [
    { "title": "Tarefa 1", "priority": "HIGH" },
    { "title": "Tarefa 2", "status": "IN_PROGRESS", "estimatedMinutes": 30 }
  ]
}
```

**Resposta `201`:** array das tarefas criadas

---

#### `PUT /tasks/:id` — Atualizar tarefa

Todos os campos são opcionais. Suporta **optimistic locking**: envie o cabeçalho `If-Match` com o valor atual de `version` para garantir que não sobrescreve uma versão mais recente.

**Header (opcional):**
```
If-Match: 2
```

**Body:**
```json
{
  "title": "Estudar NestJS avançado",
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

**Resposta `200`:** objeto da tarefa atualizada

**Resposta `404`** (se `If-Match` não bater com a versão atual):
```json
{ "success": false, "statusCode": 404, "message": "Tarefa não encontrada ou versão desatualizada" }
```

---

#### `DELETE /tasks/:id` — Soft delete de uma tarefa

**Resposta `200`:** objeto da tarefa com `deleted: true`

---

#### `DELETE /tasks/bulk` — Soft delete em lote

**Body:**
```json
{
  "ids": ["664f1a...", "664f1b...", "664f1c..."]
}
```

**Resposta `200`:**
```json
{
  "success": true,
  "data": { "deleted": 3 },
  "timestamp": "..."
}
```

---

### Health

#### `GET /health` — Status da API

Usado pelo Docker Compose para verificar se o serviço está saudável.

**Resposta `200`:**
```json
{ "status": "ok", "timestamp": "2026-06-11T12:00:00.000Z" }
```

---

## Fluxo de Autenticação

```
App Mobile
    │
    ├─ 1. Google Sign-In SDK → obtém id_token do Google
    │
    ├─ 2. POST /auth/google
    │      Header: Authorization: Bearer <id_token_google>
    │
    ├─ 3. API valida token com Google, cria/atualiza usuário no MongoDB
    │
    └─ 4. Resposta: { accessToken: "<jwt_da_api>" }
           └─ Usar este JWT em todos os demais endpoints
```

---

## Arquitetura

O projeto segue **Arquitetura Hexagonal (Ports & Adapters)**:

```
src/
├── auth/
│   ├── domain/
│   │   ├── entities/           GoogleUserEntity
│   │   └── ports/
│   │       ├── inbound/        AuthUseCasePort (interface)
│   │       └── outbound/       GoogleTokenVerifierPort, JwtGeneratorPort
│   ├── application/            AuthService (implementa AuthUseCasePort)
│   └── infrastructure/
│       ├── inbound/            AuthController, JwtAuthGuard, Passport Strategies
│       └── outbound/           GoogleTokenAdapter, JwtAdapter
│
├── users/                      (mesma estrutura)
├── tasks/                      (mesma estrutura)
│
└── common/
    ├── decorators/             @CurrentUser()
    ├── filters/                HttpExceptionFilter (com log pino)
    ├── interceptors/           TransformInterceptor (envelope de resposta)
    └── health/                 HealthController
```


```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# tosko-api
