import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export default async function OrgProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">
          {session?.user?.email ?? "Unknown"}
        </span>
      </p>
    </div>
  );
}

