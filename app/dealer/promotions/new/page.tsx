import PromotionForm from "@/app/(common)/PromotionForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Promotion",
  robots: { index: false, follow: false },
};

export default async function DealerNewPromotionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/backoffice-login");

  return (
    <PromotionForm
      dealers={[]}
      isAdmin={false}
      sessionDealerId={session.user.id}
    />
  );
}
