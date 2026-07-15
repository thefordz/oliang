# ☕ Oliang

> **Oliang (โอเลี้ยง)** is Thai iced black coffee — strong, sweet, and served fast.
> This project brews Express + TypeScript apps the same way.

```bash
npm create oliang
```

That's it. Pick TypeScript or JavaScript, then **Blank** (clean structure) or
**Example** (users CRUD demo), and you get a ready-to-run Express 5 starter
with env config, HTTP status constants, and centralized error handling.

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
The `models/` layer is intentionally left out — add it when you wire up a
real database.

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
- [ ] Template variants (with database, with auth)
- [ ] Grow `oliang` core: validation helpers, async handler wrapper
- [ ] Docs site

## License

MIT © thefordz
