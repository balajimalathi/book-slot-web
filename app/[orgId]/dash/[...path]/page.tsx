import { redirect } from "next/navigation";

export default async function OrgDashCatchAllPage({
  params,
}: {
  params: { orgId: string; path: string[] };
}) {
  // Temporary: we only implemented the org-scoped dash root UI.
  // Funnel all other dash subpaths back to the root dashboard.
  redirect(`/${params.orgId}/dash`);
}

