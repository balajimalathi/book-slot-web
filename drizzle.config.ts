import { config } from "dotenv";
import { type Config } from "drizzle-kit";

// Load .env and .env.local so DATABASE_URL is available when running drizzle-kit CLI
// config({ path: ".env" });
config({ path: ".env.local" });

type ConfigWithoutDriver = Omit<Config, "driver">;
export default {
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  // @ts-ignore
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies ConfigWithoutDriver;
