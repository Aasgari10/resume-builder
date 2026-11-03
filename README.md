# Resume Builder

Online resume and portfolio builder. Users write their resume once, then export it as a PDF or publish it as a personal portfolio website. Persian (RTL) first, with English support.

**Stack:** TypeScript · React · Vite · Node.js · Express · Prisma · PostgreSQL · Zod

## Project structure

npm workspaces monorepo:

```
packages/schema     Shared resume and theme schemas (Zod), used by both API and web
packages/templates  Resume and portfolio templates as pure React components
apps/api            REST API — Express + Prisma (PostgreSQL)
apps/web            Web app — React + Vite (editor with live preview)
```

Templates are pure components driven by a theme (colors, typography, spacing, section order) exposed as CSS variables. Layout adapts to the container width, so the editor preview can emulate mobile, and the same components can later render published sites on the server.

The resume model has two validation levels built from one definition: a lenient **draft** schema accepted on autosave, and a strict schema required for export and publishing.

## Getting started

Requirements: **Node.js 20.12+** and **PostgreSQL** (native install, or Docker via `npm run db:up`).

```bash
npm install

cp apps/api/.env.example apps/api/.env   # Windows: copy apps\api\.env.example apps\api\.env
# Set DATABASE_URL and SESSION_SECRET in apps/api/.env

npm run db:migrate    # create tables
npm run db:seed       # insert initial templates
```

Run the API and the web app in two terminals:

```bash
npm run dev:api       # http://localhost:4000
npm run dev:web       # http://localhost:5173
```

In development, login codes are printed in the API terminal and shown on the login page, so no SMS provider is needed.

## Scripts

| Command | Description |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Start API / web app in watch mode |
| `npm run typecheck` | Type-check all workspaces |
| `npm test` | Run unit tests |
| `npm run build` | Production build of API and web app |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed initial templates |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:up` | Start PostgreSQL with Docker Compose |

## API

All responses are JSON. Errors share one shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "path": "…", "message": "…" }] } }
```

Authentication uses a signed, httpOnly session cookie (`rb_session`, 30 days).

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/request-otp` | `{ phone }` | Send a login code. One request per 60 s per phone. |
| POST | `/api/auth/verify-otp` | `{ phone, code }` | Sign in; creates the user on first login. Codes expire after 2 min and lock after 5 wrong attempts. |
| POST | `/api/auth/logout` | — | Sign out |
| GET | `/api/auth/me` | — | Current user, or 401 |

### Resumes (authenticated)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/resumes` | — | List own resumes (without content) |
| POST | `/api/resumes` | `{ title, locale }` | Create a blank resume (max 20 per user) |
| GET | `/api/resumes/:id` | — | Get a resume with content |
| PATCH | `/api/resumes/:id` | `{ title?, data? }` | Save; `data` is validated with the draft schema |
| DELETE | `/api/resumes/:id` | — | Delete (204) |
| GET | `/api/resumes/:id/check` | — | Validate against the strict schema; returns failing field paths |

Resumes owned by other users return 404, so their existence is not revealed.

### Sites (authenticated)

One site per resume. Publishing stores a snapshot of the resume and theme; the public page always renders the last snapshot, so later edits go live only when published again.

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/resumes/:id/site` | — | Site settings and publish state (`hasUnpublishedChanges`), or `null` |
| GET | `/api/resumes/:id/site/availability?subdomain=` | — | Live address check: format, reserved names, taken |
| PUT | `/api/resumes/:id/site` | `{ subdomain, seoTitle?, seoDescription?, noindex? }` | Create or update settings |
| POST | `/api/resumes/:id/site/publish` | — | Validate with the strict schema and publish a snapshot; `NOT_PUBLISHABLE` lists failing fields |
| POST | `/api/resumes/:id/site/unpublish` | — | Take the site offline; settings are kept |

`PATCH /api/resumes/:id` also accepts `portfolioTheme`, so the editor's appearance settings are saved with autosave.

### Public sites

| Path | Description |
|---|---|
| `GET /s/:subdomain` | Published site, server-rendered HTML |
| `GET /` on `<subdomain>.<ROOT_DOMAIN>` | Same page on its own subdomain |

Pages ship no JavaScript and are served with a strict Content Security Policy. Metadata is generated from the resume: title, description, Open Graph tags and schema.org `Person` JSON-LD, with optional user overrides and a `noindex` switch.

In development, set `ROOT_DOMAIN="localhost"` and open `http://<subdomain>.localhost:4000`, or use `http://localhost:5173/s/<subdomain>`.

### Payments

Premium templates are sold through a gateway adapter (`apps/api/src/payments`). Zarinpal is implemented; a local **fake** gateway is used in development so the full flow works without a merchant account.

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/orders` | `{ templateId }` | Create a pending order at the template's current price and return the gateway `paymentUrl` |
| GET | `/api/orders/:id` | — | Order status for the result page (own orders only) |
| GET | `/api/payments/callback` | — | Gateway return URL: verifies server-to-server and redirects to `/payment/result` |

- The amount sent for verification comes from the stored transaction, never from the callback.
- Each gateway reference (`authority`) is unique, and the transition out of `PENDING` is a conditional update, so a repeated or concurrent callback cannot grant a purchase twice.
- Publishing a site with a premium template requires a purchase (`402 TEMPLATE_NOT_PURCHASED`).
- `GET /api/templates` includes `owned` for the signed-in user.

Configuration: `APP_URL`, `PAYMENT_PROVIDER` (`fake` | `zarinpal`), `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`. The fake gateway is refused in production.

### Templates (public)

| Method | Path | Description |
|---|---|---|
| GET | `/api/templates?kind=PDF\|PORTFOLIO` | Active templates |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server and database status |

## CI

GitHub Actions runs on every push to `main` and on pull requests: install, Prisma generate, migrations against a throwaway PostgreSQL, typecheck, tests and build.
