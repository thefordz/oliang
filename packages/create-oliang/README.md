# create-oliang ☕

[![npm version](https://img.shields.io/npm/v/create-oliang.svg)](https://www.npmjs.com/package/create-oliang)
![smoke test](https://github.com/thefordz/oliang/actions/workflows/smoke.yml/badge.svg)
[![license](https://img.shields.io/npm/l/create-oliang.svg)](https://github.com/thefordz/oliang/blob/main/LICENSE)

Scaffold an Express + TypeScript (or JavaScript) app, brewed the Thai way.

> **Oliang (โอเลี้ยง)** is Thai iced black coffee — strong, sweet, and served fast.

## Usage

```bash
npm create oliang
# or with a name up front:
npm create oliang my-app
# or:
npx create-oliang my-app
```

The CLI asks which language you want (TypeScript / JavaScript), how to start
(Blank / Example), and whether to add `.http` test files (for kulala.nvim,
VS Code REST Client, or JetBrains), then copies the matching template, writes
`.env` from `.env.example`, and offers to run `npm install` for you.

Skip the prompts with flags:

```bash
npm create oliang my-app -- --ts --blank     # TypeScript, clean structure
npm create oliang my-app -- --ts --example   # TypeScript, users CRUD demo
npm create oliang my-app -- --js --example   # JavaScript, users CRUD demo
npm create oliang my-app -- --ts --blank --no-http   # skip .http test files
```

## Starters

- **Blank** — the full folder structure with the core wired up (env config,
  error handling, `/health` as route + controller). Feature folders are empty
  and ready to build.
- **Example** — everything in Blank plus a users CRUD
  (`/api/users`) showing the full request flow:
  route → controller (typed zod parse) → service.

## What you get

- Express 5 with `cors`, `cookie-parser`, and JSON/urlencoded parsing wired up
- Typed env config with fail-fast on missing required variables
- Centralized error handling: `AppError` + ready-made exceptions mapped to JSON responses
- HTTP status constants
- A `/health` endpoint to build from
- TypeScript variant: `tsx` watch mode + `tsc` build — JavaScript variant: zero build step, `node --watch`

```
my-app/
├── http/                   # .http test files (health.http, + users.http in Example)
│   └── http-client.env.json
├── src/
│   ├── index.ts            # Express setup + route mounting
│   ├── config/             # env + HTTP status constants
│   ├── controllers/        # request/response handling (health, + user in Example)
│   ├── lib/                # shared libraries
│   ├── middlewares/        # errorHandler (zod-aware in Example)
│   ├── routes/             # route definitions (health, + user in Example)
│   ├── script/             # one-off scripts, e.g. seeding
│   ├── services/           # business logic (in-memory data in Example)
│   ├── types/              # shared types
│   ├── utils/              # AppError, getEnv
│   └── validators/         # request schemas (zod in Example)
├── .env / .env.example
├── tsconfig.json           # (TypeScript variant)
└── package.json
```

## Requirements

- Node.js >= 18

## Docs

See the [oliang repository](https://github.com/thefordz/oliang) for full docs.

## Related

- [`oliang`](https://www.npmjs.com/package/oliang) — error-handling core for
  Express + TypeScript apps (AppError, errorHandler, HTTPSTATUS, getEnv)

## License

MIT © thefordz
