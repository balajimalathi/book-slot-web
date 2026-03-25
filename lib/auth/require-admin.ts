import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  return { session };
}
