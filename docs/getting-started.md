# Getting started

## Create a new app

```bash
npm create oliang
# or with a name up front:
npm create oliang my-app
# or:
npx create-oliang my-app
```

The CLI asks three questions:

1. **Language** — TypeScript or JavaScript
2. **Starter** — **Blank** (full folder structure, core wired up, feature
   folders empty) or **Example** (adds a users CRUD at `/api/users` showing
   route → controller (typed zod parse) → service)
3. **HTTP test files** — include the `http/` folder with `.http` request
   files for kulala.nvim (Neovim), VS Code REST Client, or the JetBrains
   HTTP client (default: yes)

then copies the matching template, writes `.env` from `.env.example`, and
offers to run `npm install` for you.

To skip the prompts, pass flags:

```bash
npm create oliang my-app -- --ts --blank
npm create oliang my-app -- --js --example
npm create oliang my-app -- --ts --example --no-http
```

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
