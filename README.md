# ☕ Oliang

![smoke test](https://github.com/thefordz/oliang/actions/workflows/smoke.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/create-oliang.svg)](https://www.npmjs.com/package/create-oliang)
[![license](https://img.shields.io/npm/l/create-oliang.svg)](LICENSE)

> **Oliang (โอเลี้ยง)** is Thai iced black coffee — strong, sweet, and served fast.
> This project brews Express + TypeScript apps the same way.

```bash
npm create oliang
```

That's it. Pick TypeScript or JavaScript, **Blank** (clean structure) or
**Example** (users CRUD demo), and your database (**MongoDB**, **Prisma** with
PostgreSQL, or none) — and you get a ready-to-run Express 5 starter with
env config, HTTP status constants, and centralized error handling.

## Packages

| Package                                        | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| [`create-oliang`](packages/create-oliang)      | Scaffolder CLI — `npm create oliang`           |
| [`oliang`](packages/oliang)                    | Error-handling core for Express + TypeScript   |

## What you get

```
my-app/
├── http/                   # .http test files (kulala.nvim / VS Code / JetBrains)
│   ├── health.http         # (+ users.http in Example)
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

The **Example** starter fills the structure with a users CRUD (`/api/users`)
showing the full request flow: route → controller (typed zod parse) → service.
Pick **MongoDB** or **Prisma** and the CRUD runs on a real database — mongoose
models in `src/models/`, or a Prisma schema on PostgreSQL
(`npm run db:push` → `npm run dev`).

## Docs

See [docs/getting-started.md](docs/getting-started.md).

## Development

This repo is an npm-workspaces monorepo:

```bash
npm install        # install all workspace deps
npm run build      # build all packages
```

To try the CLI locally:

```bash
node packages/create-oliang/index.js my-test-app
```

To run the full smoke test (scaffolds every combo, builds, boots, and hits
the endpoints):

```bash
npm run test:smoke
```

## Roadmap

- [x] `create-oliang` scaffolder
- [x] Database option: MongoDB (mongoose) & Prisma (PostgreSQL by default)
- [ ] Auth starter variant
- [ ] Grow `oliang` core: validation helpers
- [ ] Docs site

## License

MIT © thefordz
