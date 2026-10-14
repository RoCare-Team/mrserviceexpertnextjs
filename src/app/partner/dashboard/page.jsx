import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleAlert, ExternalLink, FileText, MapPin } from "lucide-react";
import { getPartnerId } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";
import { DOC_TYPES } from "@/lib/partners/validation";
import { TrustBadges, CategoryIcon, cardCls, btnPrimary } from "@/app/components/partners/ui";
import DashboardActions from "@/app/components/partners/DashboardActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner Dashboard | Mr. Service Expert",
  robots: "noindex, nofollow",
};

const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-amber-50 text-amber-800",
  info_requested: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  suspended: "bg-red-50 text-red-700",
};

const STATUS_HELP = {
  draft: "Your application isn't submitted yet. Finish the remaining steps and submit it for review.",
  pending: "Thanks! Our team is reviewing your application. Your profile stays hidden until it is approved.",
  info_requested: "We need a few more details. Update your application and submit it again.",
  rejected: "Your application was not approved. You can correct the details below and submit again.",
  approved: "You're approved.",
  suspended: "Your profile is suspended and hidden from the website. Please contact support.",
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default async function PartnerDashboardPage() {
  const id = await getPartnerId();
  if (!id) redirect("/partner/login");
  const app = await getApplication(id);
  if (!app) redirect("/partner/login");

  const editable = ["draft", "rejected", "info_requested"].includes(app.status);
  const live = app.status === "approved" && app.is_listed && app.slug;

  return (
    <main className="bg-[var(--bg)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--ink)] sm:text-3xl">Hi, {app.full_name || "Partner"}</h1>
            <p className="text-sm text-[var(--muted)]">Application {app.ref} · +91 {app.mobile}</p>
          </div>
          <DashboardActions status={app.status} editable={editable} />
        </div>

        <section className={cardCls}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[app.status]}`}>{app.status_label}</span>
            {app.status === "approved" && (
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${app.is_listed ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                {app.is_listed ? "Publicly listed" : "Not listed publicly yet"}
              </span>
            )}
            <span className="ml-auto text-sm text-[var(--muted)]">Submitted {fmt(app.submitted_at)}</span>
          </div>
          <p className="mt-3 text-[var(--body-text)]">{STATUS_HELP[app.status]}</p>
          {app.review_reason && ["rejected", "info_requested", "suspended"].includes(app.status) && (
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <CircleAlert className="h-5 w-5 shrink-0" />
              <p className="whitespace-pre-line"><b>Reviewer note:</b> {app.review_reason}</p>
            </div>
          )}
          {live && (
            <p className="mt-3 text-sm">
              Your public profile:{" "}
              <Link href={`/partners/${app.slug}`} className="inline-flex items-center gap-1 font-semibold text-purple-700 underline">
                mrserviceexpert.com/partners/{app.slug} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </p>
          )}
          {editable && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[var(--muted)]">Profile completion</span>
                <b>{app.completion.percent}%</b>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-purple-100">
                <div className="h-full bg-purple-600" style={{ width: `${app.completion.percent}%` }} />
              </div>
              {Object.values(app.completion.missing).length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-[var(--muted)]">
                  {Object.values(app.completion.missing).map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
              <Link href="/join-as-partner" className={`${btnPrimary} mt-4`}>
                {app.completion.ready ? "Review & submit" : "Continue application"}
              </Link>
            </div>
          )}
        </section>

        <section className={cardCls}>
          <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Verification</h2>
          <TrustBadges verification={{ ...app.verification, approved: app.status === "approved" }} />
          <p className="mt-2 text-xs text-[var(--muted)]">
            Badges show exactly what our team has checked. ID and GST badges appear after we review your documents.
          </p>
          <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
            {app.documents.length === 0 && <li className="py-2 text-[var(--muted)]">No documents uploaded.</li>}
            {app.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2 py-2">
                <FileText className="h-4 w-4 text-purple-500" /> {DOC_TYPES[d.doc_type]}
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">{d.review_status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardCls}>
          <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Services & brands</h2>
          {app.categories.length === 0 && <p className="text-sm text-[var(--muted)]">Nothing selected yet.</p>}
          <ul className="space-y-3">
            {app.categories.map((c) => (
              <li key={c.id} className="text-sm">
                <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                  <CategoryIcon url={c.url} className="h-4 w-4 text-purple-600" /> {c.name}
                </p>
                <p className="text-[var(--body-text)]">{(app.services[c.id] || []).map((s) => s.name).join(", ") || "—"}</p>
                <p className="text-[var(--muted)]">
                  Brands: {(app.brands[c.id] || []).map((b) => (b.custom ? `${b.name} (${b.custom_status})` : b.name)).join(", ") || "—"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardCls}>
          <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Service coverage</h2>
          {app.areas.length === 0 && <p className="text-sm text-[var(--muted)]">No service areas added yet.</p>}
          <ul className="flex flex-wrap gap-2">
            {app.areas.map((a) => (
              <li key={a.id} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-800">
                <MapPin className="h-3.5 w-3.5" />
                {a.locality_id ? `${a.locality_name}, ${a.city_name}` : `${a.city_name} (entire city)`}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
