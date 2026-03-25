import { notFound } from "next/navigation";

import { requireOrgAdmin } from "@/lib/auth/require-org-admin";

import { ProfileSettingsClient } from "./_components/profile-settings-client";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const gate = await requireOrgAdmin(orgId);
  if (!gate.ok) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your name, email, timezone, and profile photo for this
          organization workspace.
        </p>
      </div>
      <ProfileSettingsClient />
    </div>
  );
}
