import { headers } from "next/headers";
import { createHash } from "crypto";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { apiKey as apiKeyTable, user as userTable } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const KEY_PREFIX_LENGTH = 8;

function hashKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export async function getSessionOrApiKeyUser(): Promise<
  { user: { id: string; name: string; email: string; image: string | null }; source: "session" | "api_key" } | null
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      },
      source: "session",
    };
  }

  const hdrs = await headers();
  const authHeader = hdrs.get("authorization");
  const apiKeyHeader = hdrs.get("x-api-key");
  const rawKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : apiKeyHeader?.trim();

  if (!rawKey) return null;

  const prefix = rawKey.slice(0, KEY_PREFIX_LENGTH);
  const [keyRow] = await db
    .select()
    .from(apiKeyTable)
    .where(
      and(eq(apiKeyTable.keyPrefix, prefix), isNull(apiKeyTable.revokedAt))
    )
    .limit(1);

  if (!keyRow) return null;

  const expectedHash = hashKey(rawKey);
  if (keyRow.keyHash !== expectedHash) return null;

  await db
    .update(apiKeyTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeyTable.id, keyRow.id));

  const [u] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
    })
    .from(userTable)
    .where(eq(userTable.id, keyRow.userId))
    .limit(1);

  if (!u) return null;

  return {
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image ?? null,
    },
    source: "api_key",
  };
}
