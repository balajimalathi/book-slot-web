import { BlackoutsSettingsClient } from "./_components/blackouts-settings-client";

export default function OrgSettingsBlackoutsPage({
  params,
}: {
  params: { orgId: string };
}) {
  return <BlackoutsSettingsClient orgId={params.orgId} />;
}
