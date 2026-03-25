import { AvailabilitySettingsClient } from "./_components/availability-settings-client";

export default function OrgSettingsAvailabilityPage({
  params,
}: {
  params: { orgId: string };
}) {
  return <AvailabilitySettingsClient orgId={params.orgId} />;
}
