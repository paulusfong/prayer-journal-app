import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./data/journal.sqlite";
const authToken =
  process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? undefined;

if (url.startsWith("file:")) {
  const file = url.replace(/^file:/, "");
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
}

const client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle({ client, schema });
export type DB = typeof db;
