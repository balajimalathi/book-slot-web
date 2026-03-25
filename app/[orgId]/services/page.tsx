import { ServicesSettingsClient } from "./_components/services-settings-client";

export default function ServicesPage({
  params,
}: {
  params: { orgId: string };
}) {
  return <ServicesSettingsClient orgId={params.orgId} />;
}
