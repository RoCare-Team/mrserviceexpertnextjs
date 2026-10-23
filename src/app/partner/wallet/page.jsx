import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The wallet now lives in the dashboard; keep old links working. */
export default async function PartnerWalletPage({ searchParams }) {
  const { payment } = await searchParams;
  const ok = ["success", "failed", "pending"].includes(payment);
  redirect(`/partner/dashboard?tab=wallet${ok ? `&payment=${payment}` : ""}`);
}
