import { NextResponse } from "next/server";
import { randomBytes, createHash, randomUUID } from "crypto";
import { getSessionOrApiKeyUser } from "@/lib/auth/api-key-auth";
import { db } from "@/lib/db/db";
import { apiKey as apiKeyTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const KEY_PREFIX = "sk_";
const KEY_SECRET_BYTES = 32;
const KEY_PREFIX_LENGTH = 8;

function hashKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export async function GET() {
  const ctx = await getSessionOrApiKeyUser();
  if (!ctx || ctx.source !== "session") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeyTable.id,
      name: apiKeyTable.name,
      keyPrefix: apiKeyTable.keyPrefix,
      createdAt: apiKeyTable.createdAt,
      lastUsedAt: apiKeyTable.lastUsedAt,
      revokedAt: apiKeyTable.revokedAt,
    })
    .from(apiKeyTable)
    .where(eq(apiKeyTable.userId, ctx.user.id));

  return NextResponse.json({
    apiKeys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      revokedAt: k.revokedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const ctx = await getSessionOrApiKeyUser();
  if (!ctx || ctx.source !== "session") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const secret = randomBytes(KEY_SECRET_BYTES).toString("hex");
  const fullKey = KEY_PREFIX + secret;
  const prefix = fullKey.slice(0, KEY_PREFIX_LENGTH);
  const keyHash = hashKey(fullKey);

  const id = randomUUID();
  const now = new Date();
  await db.insert(apiKeyTable).values({
    id,
    userId: ctx.user.id,
    name: typeof body.name === "string" ? body.name : null,
    keyPrefix: prefix,
    keyHash,
    createdAt: now,
  });

  return NextResponse.json({
    apiKey: fullKey,
    id,
    name: body.name ?? null,
    prefix,
  });
}
