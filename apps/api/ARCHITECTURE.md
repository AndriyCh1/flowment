# API architecture

`apps/api` is a feature-first modular monolith on NestJS. The source is split into five top-level folders with one-way dependencies between them. The boundaries are enforced by oxlint (see [Enforcement](#enforcement)).

```
src/
├── main.ts            # calls bootstrap(), nothing else
├── app/               # composition root: assembles and runs the process
├── shared/            # business-agnostic primitives
├── config/            # env → validated, typed configuration
├── modules/           # business features
├── infrastructure/    # technical adapters (Postgres, Redis, logging)
└── scripts/           # standalone entry points (generate-openapi)
```

> In short: `app/` assembles, `modules/` own business logic, `infrastructure/` provides technical capabilities, and `shared/` provides independent primitives.

## Folders

### `app/`: composition and lifecycle

Owns the running process, not features.

| Path | What it does |
| --- | --- |
| `bootstrap.ts` | Creates the Nest app with buffered logs, installs the logger, calls `configureApp`, mounts Swagger (when `appConfig.docsEnabled`), enables shutdown hooks, listens. |
| `app.module.ts` | Imports `DatabaseModule`, `RedisModule`, the throttler, `HealthModule` and feature modules. Registers the global `ZodValidationPipe`, `ZodSerializerInterceptor`, `AllExceptionsFilter`, `ThrottlerGuard`. Applies `RequestIdMiddleware` to every route. |
| `configure-app.ts` | `trust proxy` (from `TRUST_PROXY`), helmet + CORS, global prefix `api` (excluding `health` and `health/ready`). Also used by `scripts/generate-openapi.ts`, so the spec matches the app. |
| `openapi.ts` | Builds the OpenAPI document. |
| `security/security.ts` | helmet (CSP disabled because Swagger UI needs inline assets) and CORS (only enabled when `CORS_ORIGINS` is non-empty). |
| `security/throttler.ts` | `@nestjs/throttler` with `ThrottlerStorageRedisService`, so limits are shared by every instance. Opt a route out with `@SkipThrottle()`. |
| `middleware/request-id.middleware.ts` | Keeps a valid incoming `x-request-id` or generates a UUID, sets `req.id`, and echoes the header. |
| `errors/all-exceptions.filter.ts` | One error body for everything: `{ statusCode, message, error, path, timestamp, requestId }`. Maps `ApplicationError.code` to an HTTP status. Logs 5xx and unknown errors, and hides their details from the client. |
| `health/` | `GET /health`: liveness, checks nothing. `GET /health/ready`: pings Postgres and Redis (2s timeout each) and returns `503` with per-dependency status if either is down. Health is never rate limited. |
| `lifecycle/shutdown.ts` | On SIGTERM/SIGINT, arms a forced exit after `SHUTDOWN_TIMEOUT_MS` in case a shutdown hook hangs. Logs unhandled rejections, and logs then exits on uncaught exceptions. Nest's `enableShutdownHooks` runs the actual cleanup (`pool.end()`, Redis `quit()`). |

`app/` may import from every other folder. Nothing imports from `app/` except `main.ts` and `scripts/`.

### `shared/`: cross-cutting primitives

Code that is reusable **without knowledge of any business module**. Being used by two modules is not enough to belong here; the code must also be business-agnostic.

| Path | Contents |
| --- | --- |
| `errors/` | `ApplicationError` (abstract base with a `code`) and `ErrorCode` (`NOT_FOUND`, `CONFLICT`, `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`). |
| `http/` | `ErrorResponseDto`, `PaginationQuerySchema` + `paginatedSchema()`, `REQUEST_ID_HEADER` + `getRequestId()`. |
| `zod/openapi-helpers.ts` | `isoDate` codec and `nullableString()` for OpenAPI-friendly schemas. |
| `utils/with-timeout.ts` | Promise timeout helper. |

`UserUtils`, `OrderValidation` and the like belong to their module, not here.

### `config/`: typed configuration

`env.ts` loads `.env`, validates `process.env` with zod and exits on invalid input. The `*.config.ts` files (`app`, `database`, `redis`, `security`, `ai`) expose typed values derived from it. Only files in `config/` read `Env`; everything else imports a `*.config.ts`.

`config/` defines how a dependency is configured; it never creates clients or connections.

### `modules/`: business features

Each module owns its use cases, DTOs, errors and queries. Keep modules flat until complexity justifies internal layering; don't pre-create `domain/`, `application/`, etc.

```
modules/notes/
├── notes.controller.ts   # HTTP routes + OpenAPI decorators
├── notes.service.ts      # business logic; queries Drizzle directly
├── notes.dto.ts          # zod schemas + createZodDto classes
├── notes.errors.ts       # NoteNotFoundError extends ApplicationError
├── notes.module.ts
└── index.ts              # public API: NotesModule, NotesService, Note, NoteNotFoundError
```

Modules throw `ApplicationError` subclasses, not `HttpException`s. The global filter decides the status code.

### `infrastructure/`: technical adapters

Generic technical capabilities. Each folder exposes a public `index.ts`.

| Path | Exports |
| --- | --- |
| `database/` | `DatabaseModule` (global; ends the pool on shutdown), `InjectDb()`, `Db`, `DatabaseHealth`, and every table from `schema/`. `migrate.ts` is a standalone script; drizzle-kit writes to `migrations/`. |
| `database/schema/` | **All** Drizzle table definitions, one file per table, re-exported from `schema/index.ts`. This is the single source for drizzle-kit (`drizzle.config.ts`) and the typed client. |
| `redis/` | `RedisModule` (global; `quit()` on shutdown, `disconnect()` if never connected), `InjectRedis()`, `REDIS_CLIENT`, `RedisHealth`. The client uses `lazyConnect`, so building the app (tests, the openapi script) needs no Redis. |
| `logging/` | `createLogger()`: Nest `ConsoleLogger`, JSON lines in production and colored text elsewhere, with levels from `LOG_LEVEL`. |

There is no separate logger interface: Nest's `LoggerService` already is one. Code everywhere logs through `new Logger(Context)` from `@nestjs/common`.

## Ownership

| Concern | Location |
| --- | --- |
| CORS, helmet, rate limiting, global error filter | `app/` |
| Generic error base class and codes | `shared/errors/` |
| Feature-specific errors | `modules/<feature>/<feature>.errors.ts` |
| Logger implementation | `infrastructure/logging/` |
| Logger installation | `app/bootstrap.ts` |
| Postgres / Redis connections | `infrastructure/` |
| Table schemas | `infrastructure/database/schema/` |
| Feature queries | `modules/<feature>/<feature>.service.ts` |
| DTOs and request validation | `modules/<feature>/<feature>.dto.ts` |
| Reusable middleware *implementation* | `shared/http/` (or an `auth` module) |
| Decision to *enable* middleware | `app/` |

## Import rules

| From ↓ / To → | `app` | `shared` | `config` | `modules` | `infrastructure` |
| --- | --- | --- | --- | --- | --- |
| `app` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `shared` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `config` | ✗ | ✓ | ✓ | ✗ | ✗ |
| `modules` | ✗ | ✓ | △ | △ | △ |
| `infrastructure` | ✗ | ✓ | ✓ | ✗ | ✓ |

✓ allowed · ✗ forbidden · △ allowed under the conditions below

- **modules → config**: import typed `*.config.ts` values when needed, never `config/env`. Prefer passing feature settings into services over reading config deep in business logic.
- **modules → modules**: only through the other module's `index.ts` (`'../users'`), never its internal files. No circular module dependencies. If a module needs only a small capability (e.g. "does this user exist?"), export a narrow service for it rather than the whole module service.
- **modules → infrastructure**: only through a folder's `index.ts` (`'../../infrastructure/database'`).

### Data access policy

Services inject `Db` and query Drizzle directly (pragmatic option A). Keep business rules readable apart from the query code. Introduce a repository interface, owned by the module and implemented with Drizzle (option B), only when a module's domain logic or test isolation needs it.

If infrastructure ever has to implement a contract defined by a module (e.g. a `PaymentGateway` port), that is the one acceptable infrastructure → module dependency. Add it explicitly and adjust the lint rule; infrastructure must still never call arbitrary module services.

## Rules

1. `app/` is the composition root. It may depend on everything; nothing imports from `app/`.
2. `shared/` contains business-independent primitives and depends on no other `src/` folder.
3. `config/` owns configuration, not initialized services, and depends on nothing but `shared/`.
4. `modules/` own business capabilities and must not import `app/`.
5. Cross-module dependencies go through `index.ts` only.
6. `infrastructure/` owns reusable technical implementations, including all table schemas. Feature queries stay in their module.
7. No circular dependencies between folders or between modules.
8. Framework and infrastructure objects (Drizzle, ioredis) stay out of business rules unless it is a deliberate pragmatic tradeoff, as with `Db` in services today.

Avoid reorganizing into technical layers (`controllers/`, `services/`, `repositories/`) or adding top-level `domain/` / `ports/` / `use-cases/` folders. Add internal layering per module only when its complexity calls for it.

## Enforcement

`apps/api/.oxlintrc.json` uses `no-restricted-imports` overrides per folder. `pnpm nx lint @flowment/api` fails on:

| Files | Forbidden import patterns |
| --- | --- |
| `src/shared/**` | `**/app`, `**/app/**`, `**/config/**`, `**/modules/**`, `**/infrastructure/**` |
| `src/config/**` | `**/app`, `**/app/**`, `**/modules/**`, `**/infrastructure/**` |
| `src/infrastructure/**` | `**/app`, `**/app/**`, `**/modules/**`, `**/config/env` |
| `src/modules/**` | `**/app`, `**/app/**`, `../*/*` and `**/modules/*/*` (deep module imports), `**/infrastructure/*/*` (deep infrastructure imports), `**/config/env` |

Circular dependencies (rule 7) are not checked mechanically yet.

## Adding a feature

1. Add the table in `infrastructure/database/schema/<name>.ts` and export it from `schema/index.ts`.
2. `pnpm --filter @flowment/api db:generate`, review the SQL, then `db:migrate`.
3. Create `modules/<name>/` with controller, service, DTOs, errors, module and `index.ts`.
4. Import the module in `app/app.module.ts`.
5. `pnpm codegen` to refresh the OpenAPI spec and web client.
