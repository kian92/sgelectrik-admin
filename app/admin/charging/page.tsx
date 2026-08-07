import ChargingAdminClient from "./ChargingAdminClient";

export default function Page({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    network?: string;
    area?: string;
  };
}) {
  const page = Number(searchParams.page || 1);

  return (
    <ChargingAdminClient
      initialPage={page}
      initialSearch={searchParams.search || ""}
      initialNetwork={searchParams.network || "All"}
      initialArea={searchParams.area || "All"}
    />
  );
}
