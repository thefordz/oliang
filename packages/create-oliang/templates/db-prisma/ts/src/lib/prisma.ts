import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Env } from "../config/env.config.js";

// PostgreSQL by default. Each database uses a different adapter with a
// different argument shape — full per-database recipes (SQLite/MySQL/MSSQL):
// https://github.com/thefordz/oliang/blob/main/docs/getting-started.md
const adapter = new PrismaPg({ connectionString: Env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
