# oliang-app

Express + TypeScript app scaffolded with [create-oliang](https://github.com/thefordz/oliang) ☕

## Getting started

```bash
npm install
npm run dev
```

The server starts at http://localhost:3000 — try http://localhost:3000/health

## Scripts

| Script          | What it does                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start dev server with watch mode (tsx)    |
| `npm run build` | Compile TypeScript to `dist/`             |
| `npm start`     | Run the compiled app (`node dist/index.js`) |

## Environment variables

Copy `.env.example` to `.env` (done for you on scaffold) and adjust as needed.
Variables without a default value throw at startup when missing — add required
ones in `src/config/env.config.ts`.

## Project structure

```
http/                       # .http request files for API testing
├── health.http
└── http-client.env.json    # base_url / base_api_url per environment
src/
├── index.ts                # App entry: express setup + route mounting
├── config/                 # env + HTTP status constants
├── controllers/            # request/response handling (health.controller.ts)
├── lib/                    # shared libraries (yours to fill)
├── middlewares/            # errorHandler
├── routes/                 # route definitions (health.route.ts)
├── script/                 # one-off scripts, e.g. seeding
├── services/               # business logic
├── types/                  # shared TypeScript types
├── utils/                  # AppError, getEnv
└── validators/             # request schemas
```

## API testing with .http files

Open any file in `http/` and send requests straight from your editor with
[kulala.nvim](https://github.com/mistweaverco/kulala.nvim) (Neovim),
the VS Code REST Client extension, or the JetBrains HTTP client.
Environment URLs live in `http/http-client.env.json`.
