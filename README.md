# Flowment

Flowment is a tool for learning system design by modelling how a system behaves. You describe a design as components and sequence scenarios (who sends what to whom, step by step), and Flowment derives the architecture from those interactions instead of asking you to draw a separate box diagram. An AI coach asks questions about the design, gives progressive hints, and reviews the result without scoring it.

## Features

- **Projects**: create, rename and list projects. Every design edit is saved right away.
- **Components**: add, edit, reorder and delete components (name, kind, responsibility). Deleting a component that scenarios still use shows the affected steps first.
- **Scenarios and sequence diagrams**: add, duplicate and delete scenarios; add interactions and notes, then edit, move, duplicate or delete steps. Diagrams are rendered with a custom CSS-grid renderer.
- **Derived architecture**: a read-only graph and list of which components talk to which, combined from all scenarios.
- **AI coach**: asks one question at a time about the design, with up to three hints per question and, after the third hint, one possible answer. The coach never changes the design.
- **Exercises**: start a practice project from a built-in catalog in one of three training modes: Trace, Complete or Repair. The coach works towards the exercise's learning objectives. Trace and Complete exercises also get fixed questions about blank interactions and the missing-step marker.
- **Review**: submit any project for written feedback (strongest reasoning, most important missed issue, an alternative, the next skill to practise). Each design version is reviewed once and every review is kept.

## Repository layout

This is an Nx workspace using pnpm.

| Path | Project | What it is |
| --- | --- | --- |
| `apps/web` | `@flowment/web` | React 19 + Vite single-page app (Tailwind CSS, TanStack Query, react-hook-form, react-router) |
| `apps/api` | `@flowment/api` | NestJS API with Postgres (Drizzle ORM), Redis (rate limiting) and the OpenAI Responses API for the coach |
| `packages/domain` | `@flowment/domain` | The shared domain model: zod 4 schemas and pure functions for editing designs, deriving the architecture, coaching state and exercises. Used by both apps. |
| `packages/shared` | `@flowment/shared` | Placeholder library, not used by the apps yet |

The API's structure and import rules are described in [apps/api/docs/architecture.md](apps/api/docs/architecture.md).

## Getting started

### Prerequisites

- Node.js and pnpm
- Docker, for Postgres and Redis

### Setup

```sh
pnpm install
docker compose up -d
```

`docker compose` starts Postgres 17 on port `5434` (database `flowment`, user and password `postgres`) and Redis 7 on port `6379`.

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`, and adjust the values. The API validates its environment on startup and exits with a list of the invalid variables. It needs:

| Variables | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT`, `LOG_LEVEL`, `SHUTDOWN_TIMEOUT_MS`, `API_DOCS_ENABLED` | Process settings. Swagger UI is served at `/docs` unless `API_DOCS_ENABLED` is `false` (it defaults to off in production). |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` | Postgres connection |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` | Redis connection |
| `CORS_ORIGINS`, `TRUST_PROXY`, `THROTTLE_TTL_MS`, `THROTTLE_LIMIT` | CORS (comma-separated; empty disables it), proxy trust and rate limiting |
| `AI_PROVIDER` | `openai` (also needs `OPENAI_API_KEY` and `OPENAI_MODEL`) or `mock`, which makes every AI call fail |

The web dev server proxies `/api` and `/health` to `API_URL` (default `http://localhost:3000`), so the API needs no CORS setup in development.

Apply the database migrations:

```sh
pnpm --filter @flowment/api db:migrate
```

### Run

```sh
npx nx serve @flowment/api
npx nx serve @flowment/web
```

The web app runs at http://localhost:4201.

## Development

### Checks

```sh
npx nx run-many -t test,typecheck,lint
```

The API tests need Postgres running. They use a separate `flowment_test` database, created and migrated automatically on the first run, take the other `DB_*` settings from `apps/api/.env`, and replace the AI provider with a scripted one. The web app has no tests; logic that needs tests lives in `@flowment/domain`.

### Database changes

Table schemas live in `apps/api/src/infrastructure/database/schema/`. After changing them:

```sh
pnpm --filter @flowment/api db:generate
pnpm --filter @flowment/api db:migrate
```

Review the generated SQL in `apps/api/src/infrastructure/database/migrations/` before migrating.

### API client

The web app calls the API through a client generated from the API's OpenAPI document (`apps/web/openapi.json` and `apps/web/src/api/`). After changing API routes or DTOs, regenerate both:

```sh
pnpm codegen
```
