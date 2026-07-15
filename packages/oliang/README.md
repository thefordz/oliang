# oliang

Tiny error-handling core for Express + TypeScript apps ☕

> Looking to start a new project? Use the scaffolder instead:
>
> ```bash
> npm create oliang
> ```

## Install

```bash
npm install oliang
```

## Usage

```ts
import express from "express";
import { errorHandler, NotFoundException, HTTPSTATUS } from "oliang";

const app = express();

app.get("/health", (_req, res) => {
  res.status(HTTPSTATUS.OK).json({ status: "ok" });
});

app.get("/users/:id", (req, _res) => {
  throw new NotFoundException(`User ${req.params.id} not found`);
});

app.use(errorHandler);
```

## Exports

- `AppError` — base error class carrying `statusCode` and `errorCode`
- `InternalServerException`, `NotFoundException`, `BadRequestException`, `UnauthorizedException` — ready-made subclasses
- `ErrorCodes` / `ErrorCodeType` — error code constants
- `errorHandler` — Express error middleware that maps `AppError` to JSON responses
- `HTTPSTATUS` / `HttpStatusCodeType` — HTTP status constants
- `getEnv` — env reader that throws at startup when a required variable is missing
