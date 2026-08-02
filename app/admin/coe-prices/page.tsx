import { permanentRedirect } from "next/navigation";

export default function CoePricesAdminPage() {
  permanentRedirect("/admin/coe-prices/history");
}
