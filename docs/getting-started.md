# Getting started

## Create a new app

```bash
npm create oliang
# or with a name up front:
npm create oliang my-app
# or:
npx create-oliang my-app
```

The CLI asks four questions:

1. **Language** — TypeScript or JavaScript
2. **Starter** — **Blank** (full folder structure, core wired up, feature
   folders empty) or **Example** (adds a users CRUD at `/api/users` showing
   route → controller (typed zod parse) → service)
3. **Database** — **None** (Example uses an in-memory store),
   **MongoDB** (mongoose), or **Prisma** (PostgreSQL by default)
4. **HTTP test files** — include the `http/` folder with `.http` request
   files for kulala.nvim (Neovim), VS Code REST Client, or the JetBrains
   HTTP client (default: yes)

then copies the matching template, writes `.env` from `.env.example`, and
offers to run `npm install` for you.

To skip the prompts, pass flags:

```bash
npm create oliang my-app -- --ts --blank --no-db
npm create oliang my-app -- --ts --example --prisma
npm create oliang my-app -- --js --example --mongodb
npm create oliang my-app -- --ts --example --no-http
```

## Using a database

**MongoDB** — the app calls `connectDBService()` before listening and exits
with a clear message when it can't connect. Start MongoDB locally (or use
Atlas) and set `DB_URL` in `.env`. Mongoose models live in `src/models/`.

**Prisma** — PostgreSQL out of the box. Start PostgreSQL, set `DATABASE_URL`
in `.env`, then:

```bash
npm run db:push   # sync prisma/schema.prisma to the database
npm run dev
```

The Prisma client is created in `src/lib/prisma` with the `@prisma/adapter-pg`
driver adapter (PostgreSQL). Prisma 7 requires a driver adapter that
**matches** the schema provider — a mismatched pair throws
`PrismaClientInitializationError` at startup. Each adapter is configured
slightly differently, so here is the full recipe per database.

### Switching Prisma to another database

Every switch changes the same three places:
`prisma/schema.prisma` (provider) · `src/lib/prisma` (adapter) · `.env`
(DATABASE_URL) — then re-run `npm run db:push`.

**SQLite** (no server needed — great for quick experiments)

```bash
npm uninstall @prisma/adapter-pg && npm install @prisma/adapter-better-sqlite3
```

```prisma
datasource db { provider = "sqlite" }
```

```ts
// src/lib/prisma — note: this adapter takes { url }, not a config object
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
const adapter = new PrismaBetterSqlite3({ url: Env.DATABASE_URL });
```

```bash
# .env — also add dev.db to .gitignore
DATABASE_URL="file:./dev.db"
```

**MySQL / MariaDB**

```bash
npm uninstall @prisma/adapter-pg && npm install @prisma/adapter-mariadb
```

```prisma
datasource db { provider = "mysql" }
```

```ts
// src/lib/prisma — accepts a connection string directly
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const adapter = new PrismaMariaDb(Env.DATABASE_URL);
```

```bash
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

**SQL Server**

```bash
npm uninstall @prisma/adapter-pg && npm install @prisma/adapter-mssql
```

```prisma
datasource db { provider = "sqlserver" }
```

```ts
// src/lib/prisma — accepts a connection string directly
import { PrismaMssql } from "@prisma/adapter-mssql";
const adapter = new PrismaMssql(Env.DATABASE_URL);
```

```bash
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=sa;password=...;trustServerCertificate=true"
```

**Summary**

| Database        | schema `provider` | adapter package                  | adapter argument                 |
| --------------- | ----------------- | -------------------------------- | -------------------------------- |
| PostgreSQL      | `postgresql`      | `@prisma/adapter-pg` (default)   | `{ connectionString: url }`      |
| SQLite          | `sqlite`          | `@prisma/adapter-better-sqlite3` | `{ url }`                        |
| MySQL / MariaDB | `mysql`           | `@prisma/adapter-mariadb`        | connection string                |
| SQL Server      | `sqlserver`       | `@prisma/adapter-mssql`          | connection string                |

> **MongoDB + Prisma is not supported** — Prisma 7 has no MongoDB driver
> adapter. For MongoDB, pick the **MongoDB (mongoose)** option in the CLI
> instead.

**Cloud PostgreSQL (Neon / Supabase / Railway):** append
`?sslmode=verify-full` to `DATABASE_URL`. Using `sslmode=require` works but
the `pg` driver prints a security warning about it.

## Test the API from your editor

With the `http/` folder included, open `http/health.http` (or
`http/users.http` in the Example starter) and send requests directly from
your editor. URLs come from `http/http-client.env.json`:

```json
{
  "dev": {
    "base_url": "http://localhost:3000",
    "base_api_url": "http://localhost:3000/api"
  }
}
```

## Run it

```bash
cd my-app
npm run dev
```

Open http://localhost:3000/health — you should see:

```json
{ "message": "server is healthy", "status": "ok" }
```

## Add a route

Follow the same pattern as `health`: a controller + a route file, mounted in
`src/index.ts`.

```ts
// src/controllers/listing.controller.ts
import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config.js";
import { NotFoundException } from "../utils/app-error.js";

export const getListingController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  // Throwing an AppError is enough — errorHandler turns it into JSON
  throw new NotFoundException(`Listing ${req.params.id} not found`);
};
```

```ts
// src/routes/listing.route.ts
import { Router } from "express";
import { getListingController } from "../controllers/listing.controller.js";

const listingRoutes = Router().get("/:id", getListingController);

export default listingRoutes;
```

```ts
// src/index.ts
import listingRoutes from "./routes/listing.route.js";

app.use("/api/listings", listingRoutes);
```

## Environment variables

`src/config/env.config.ts` is the single place that reads `process.env`.
Variables without a default throw at startup, so a misconfigured deploy fails
fast instead of crashing at request time:

```ts
export const Env = {
  PORT: getEnv("PORT", "3000"),   // optional, has default
  DB_URL: getEnv("DB_URL"),        // required, throws when missing
};
```

## Build for production

```bash
npm run build   # compiles to dist/
npm start       # node dist/index.js
```
