import ChargingAdminClient from "./ChargingAdminClient";

export default function Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page || 1);

  return <ChargingAdminClient initialPage={page} />;
}
