import { OrganizationCoreSettingsClient } from "./_components/organization-core-settings-client";

export default function OrgSettingsOrganizationPage({
  params,
}: {
  params: { orgId: string };
}) {
  return <OrganizationCoreSettingsClient orgId={params.orgId} />;
}
