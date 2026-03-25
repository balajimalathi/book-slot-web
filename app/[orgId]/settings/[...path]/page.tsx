import { redirect } from "next/navigation";

export default async function OrgSettingsCatchAllPage({
  params,
}: {
  params: { orgId: string; path: string[] };
}) {
  redirect(`/${params.orgId}/settings/profile`);
}

