import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./data/journal.sqlite";

if (url.startsWith("file:")) {
  const file = url.replace(/^file:/, "");
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
}

const client = createClient({ url });

export const db = drizzle({ client, schema });
export type DB = typeof db;
