import { redirect } from "next/navigation";

export default async function OrgSettingsIndexPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  redirect(`/${orgId}/settings/profile`);
}
