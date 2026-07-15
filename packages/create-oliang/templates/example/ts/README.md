# oliang-app

Express + TypeScript app scaffolded with [create-oliang](https://github.com/thefordz/oliang) ☕
— **Example starter** with a users CRUD demonstrating the layered structure.

## Getting started

```bash
npm install
npm run dev
```

The server starts at http://localhost:3000 — try http://localhost:3000/health

## Example API

| Method | Path             | Description                     |
| ------ | ---------------- | ------------------------------- |
| GET    | `/api/users`     | List users                      |
| POST   | `/api/users`     | Create user `{ name, email }`   |
| GET    | `/api/users/:id` | Get one user (404 if missing)   |
| PUT    | `/api/users/:id` | Update user (validated)         |
| DELETE | `/api/users/:id` | Delete user                     |

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ford","email":"ford@example.com"}'
```

Or send the ready-made requests in `http/users.http` straight from your editor
with [kulala.nvim](https://github.com/mistweaverco/kulala.nvim) (Neovim),
the VS Code REST Client extension, or the JetBrains HTTP client.

## How a request flows

```
routes/user.route.ts          # URL → controller
  └─ controllers/user.controller.ts       # zod parse (typed body) + HTTP in/out
       └─ services/user.service.ts        # business logic + data
                                          # (in-memory — swap for a real database)
```

Validation happens right in the controller — `schema.parse(req.body)` returns
a fully typed body. Errors thrown anywhere (ZodError, AppError) land in
`middlewares/errorHandler.middleware.ts` and become consistent JSON responses;
validation failures return 400 with per-field errors.

## Scripts

| Script          | What it does                                |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Start dev server with watch mode (tsx)      |
| `npm run build` | Compile TypeScript to `dist/`               |
| `npm start`     | Run the compiled app (`node dist/index.js`) |

## Project structure

```
http/                   # .http request files (health.http, users.http)
src/
├── index.ts            # Express setup + route mounting
├── config/             # env + HTTP status constants
├── controllers/        # request/response handling (health, user)
├── lib/                # shared libraries (empty, yours to fill)
├── middlewares/        # errorHandler (zod-aware)
├── routes/             # route definitions (health, user)
├── script/             # one-off scripts, e.g. seeding
├── services/           # business logic + in-memory data
├── types/              # shared TypeScript types
├── utils/              # AppError, getEnv
└── validators/         # zod schemas
```

## Environment variables

Copy `.env.example` to `.env` (done for you on scaffold). Variables without a
default throw at startup — add required ones in `src/config/env.config.ts`.
