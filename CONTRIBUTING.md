# Contributing

Thanks for helping. Issues and pull requests are welcome, in English or Persian.

## Setup

Follow [Getting started](README.md#getting-started) in the README: Node.js 20.12+, PostgreSQL, then `npm install`, `npm run db:migrate` and `npm run db:seed`.

## Before opening a pull request

```bash
npm run typecheck
npm test
```

CI runs the same checks, plus the build, on every pull request.

## Guidelines

- Keep pull requests small and focused on one change.
- Write user-facing text in Persian first; layouts are right-to-left.
- Templates are pure React components; shared pieces live in `packages/templates/src/web/parts.tsx`.
- Data shapes belong in `packages/schema` (Zod), so the API and the editor share them.
- Published pages run no scripts except those listed in `packages/templates/src/web/scripts.ts`.
- Add or update tests for behaviour changes.

## Good first issues

Issues labelled `good first issue` are small and self-contained, a good place to start.
