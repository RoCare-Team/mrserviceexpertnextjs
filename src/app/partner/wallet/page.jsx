import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import db from "@/lib/db";
import { getPartnerId } from "@/lib/partners/auth";
import WalletPanel from "@/app/components/partners/WalletPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner Wallet | Mr. Service Expert",
  robots: "noindex, nofollow",
};

export default async function PartnerWalletPage({ searchParams }) {
  const id = await getPartnerId();
  if (!id) redirect("/partner/login");
  const [[p]] = await db.query("SELECT status FROM partners WHERE id = ? AND deleted_at IS NULL", [id]);
  if (!p) redirect("/partner/login");
  const { payment } = await searchParams;

  return (
    <main className="bg-[var(--bg)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/partner/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-purple-700 underline">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="mb-5 text-2xl font-bold text-[var(--ink)] sm:text-3xl">Wallet</h1>
        <WalletPanel paymentResult={["success", "failed", "pending"].includes(payment) ? payment : null} canRecharge={p.status === "approved"} />
      </div>
    </main>
  );
}
