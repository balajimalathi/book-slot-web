import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/auth/logout-button-icon";
import { Announcement, AnnouncementTag, AnnouncementTitle } from "@/components/kibo-ui/announcement";
import { ArrowUpRightIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {session.user.email}
            </span>
          </p>
        </div>
        <div>
          <LogoutButton />
        </div>
      </div>

      <Announcement>
        <AnnouncementTag>Latest update</AnnouncementTag>
        <AnnouncementTitle>
          New feature added
          <ArrowUpRightIcon className="shrink-0 text-muted-foreground" size={16} />
        </AnnouncementTitle>
      </Announcement>

      <div className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-base font-medium">Available API</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the following endpoints to manage sessions and API keys.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>`GET /api/sessions` — list sessions</li>
          <li>`POST /api/sessions/revoke-all` — revoke all but current</li>
          <li>`DELETE /api/sessions/:id` — revoke a session</li>
          <li>`GET /api/api-keys` — list API keys</li>
          <li>`POST /api/api-keys` — create API key</li>
          <li>`DELETE /api/api-keys/:id` — revoke API key</li>
        </ul>
      </div>
    </>
  );
}

