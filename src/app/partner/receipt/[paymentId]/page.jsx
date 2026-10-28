import { notFound, redirect } from "next/navigation";
import { getPartner } from "@/lib/partners/auth";
import { getPartnerPayment } from "@/lib/partners/payments";
import { partnerRef } from "@/lib/partners/validation";
import PrintButton from "@/app/components/partners/dashboard/PrintButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payment Receipt | Mr. Service Expert",
  robots: "noindex, nofollow",
};

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

/** Printable receipt for a successful wallet recharge ("Save as PDF" from the print dialog). */
export default async function ReceiptPage({ params }) {
  const p = await getPartner();
  if (!p) redirect("/partner/login");
  const id = Number((await params).paymentId);
  const pay = Number.isInteger(id) && id > 0 ? await getPartnerPayment(p.id, id) : null;
  if (!pay || pay.status !== "success") notFound();

  const rows = [
    ["Receipt no.", `MSE-R${String(pay.id).padStart(6, "0")}`],
    ["Date", fmt(pay.completed_at || pay.created_at)],
    ["Partner", `${p.business_name || p.full_name} (${partnerRef(p.id)})`],
    ["Mobile", `+91 ${p.mobile}`],
    ["Description", "Partner wallet recharge (coins)"],
    ["Payment method", [pay.payment_mode, pay.card_or_vpa].filter(Boolean).join(" · ") || "—"],
    ["Transaction ID", pay.txnid],
    ["Easebuzz ID", pay.easebuzz_id || "—"],
    ["Bank reference", pay.bank_ref_num || "—"],
  ];

  return (
    <main className="bg-[var(--bg)] px-4 py-8 print:bg-white print:p-0">
      {/* Hide the site's header / footer when printing the receipt. */}
      <style>{`@media print { header, footer { display: none !important; } }`}</style>
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-purple-700">Mr. Service Expert</p>
            <p className="text-sm text-[var(--muted)]">mrserviceexpert.com</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--ink)]">Payment Receipt</p>
            <p className="text-xs font-semibold uppercase text-emerald-700">Paid</p>
            {pay.mode === "test" && <p className="text-xs font-semibold uppercase text-amber-700">Test transaction</p>}
          </div>
        </div>
        <dl className="mt-6 divide-y divide-[var(--line)] text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-[var(--muted)]">{k}</dt>
              <dd className="break-all text-right font-medium text-[var(--ink)]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-purple-50 px-4 py-3">
          <span className="font-semibold text-[var(--ink-soft)]">Amount paid</span>
          <span className="text-2xl font-bold text-[var(--ink)]">₹{Number(pay.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{Number(pay.amount).toLocaleString("en-IN")} coins credited to the partner wallet (1 coin = ₹1).</p>
        <p className="mt-6 text-xs text-[var(--muted)]">This is a computer-generated payment receipt and does not require a signature.</p>
        <div className="mt-6 print:hidden">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
