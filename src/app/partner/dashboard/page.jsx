import { redirect } from "next/navigation";
import { getPartnerId } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";
import PartnerDashboard from "@/app/components/partners/dashboard/PartnerDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner Dashboard | Mr. Service Expert",
  robots: "noindex, nofollow",
};

export default async function PartnerDashboardPage({ searchParams }) {
  const id = await getPartnerId();
  if (!id) redirect("/partner/login");
  const app = await getApplication(id);
  if (!app) redirect("/partner/login");
  const { tab, payment } = await searchParams;

  return (
    <PartnerDashboard
      initialApp={app}
      initialTab={typeof tab === "string" ? tab : "overview"}
      paymentResult={["success", "failed", "pending"].includes(payment) ? payment : null}
    />
  );
}
