import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import postgres from "postgres";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { env } from "@/env";

const isNeon =
  env.DATABASE_URL.includes("neon.tech") || /@ep-[a-z0-9-]+/i.test(env.DATABASE_URL);

// Many Neon connection strings you get from the Console point to a pooler/pgBouncer
// hostname (e.g. `*-pooler...`). The Neon serverless driver doesn't always handle
// those reliably, so for pooler URLs we fall back to `postgres-js`.
const shouldUseNeonServerless = isNeon && !/pooler/i.test(env.DATABASE_URL);

const db = (() => {
  if (shouldUseNeonServerless) {
    const sql = neon(env.DATABASE_URL);
    return neonDrizzle(sql as any, { schema });
  }

  const client = postgres(env.DATABASE_URL);
  return drizzle(client as any, { schema });
})();

export { db };

export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;
