import WorkshopForm from "@/app/(common)/WorkshopForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Workshop",
  robots: { index: false, follow: false },
};

export default async function DealerNewWorkshopPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <WorkshopForm
      dealers={[]}
      isAdmin={false}
      sessionDealerId={session.user.id}
    />
  );
}
