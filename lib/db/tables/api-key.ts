import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const apiKey = pgTable("api_key", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name"),
  keyPrefix: text("key_prefix").notNull().unique(),
  keyHash: text("key_hash").notNull(),
  createdAt: timestamp("created_at").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
});
