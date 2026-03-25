import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, createAuthMiddleware } from "better-auth/plugins";
import { db } from "../db/db";
import { env } from "@/env";

async function sendResetPasswordEmailLazy(
  params: { user: { email: string | null }; url: string; token?: string },
  request: unknown
) {
  const mod = await import("@/lib/email/send-email");
  return mod.sendResetPasswordEmail(params, request);
}

async function sendVerificationEmailLazy(
  params: { user: { email: string | null }; url: string; token?: string },
  request: unknown
) {
  const mod = await import("@/lib/email/send-email");
  return mod.sendVerificationEmail(params, request);
}


function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  return providers;
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  // Allow empty placeholders locally; auth still works with dev secret.
  secret: env.BETTER_AUTH_SECRET || "dev-secret-dev-secret-dev-secret-dev-secret-123",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendResetPasswordEmailLazy({ user, url, token }, request);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendVerificationEmailLazy({ user, url, token }, request);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    additionalFields: {
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => { }),
  },
  account: {},
  plugins: [
    admin(),
    nextCookies(),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          console.log("session create", session);
        },
      },
    },
    user: {
      update: {
        before: async (session) => {
          console.log("session update before", session, session);
        },
        after: async (session) => {
          console.log("session update after", session);
        },
      },
    },
  },
  socialProviders: buildSocialProviders(),
});
