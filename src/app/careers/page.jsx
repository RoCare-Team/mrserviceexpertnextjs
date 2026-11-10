import { notFound } from "next/navigation";
import { Rocket, HeartHandshake, TrendingUp, ShieldCheck } from "lucide-react";
import { Breadcrumbs, Container, SITE } from "@/app/components/public/ui";
import { getSettings } from "@/lib/careers/settings";
import { listOpenJobs, filterOptions, publicFilters } from "@/lib/careers/jobs";
import CareersBrowser from "./_components/CareersBrowser";
import "./careers.css";

export const dynamic = "force-dynamic"; // published / expired jobs show up immediately

export async function generateMetadata() {
  const s = await getSettings().catch(() => null);
  if (s && !s.careers_page_visible) return { title: "Careers | Mr. Service Expert", robots: "noindex, nofollow" };
  const title = `${s?.careers_page_title || "Careers at Mr. Service Expert"} | Jobs & Openings`;
  const description = (s?.careers_page_intro || "Explore current job openings at Mr. Service Expert and apply online.").replace(/\s+/g, " ").slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/careers` },
    robots: "index, follow",
    openGraph: { type: "website", title, description, url: `${SITE}/careers` },
  };
}

const PERKS = [
  { icon: Rocket, title: "Grow fast", text: "Learn on the job in a fast-growing home services brand." },
  { icon: HeartHandshake, title: "People first", text: "A supportive team that values customers and colleagues." },
  { icon: TrendingUp, title: "Performance rewarded", text: "Clear goals with incentives for great work." },
  { icon: ShieldCheck, title: "Stable & trusted", text: "Serving thousands of households across India." },
];

export default async function CareersPage({ searchParams }) {
  const settings = await getSettings();
  if (!settings.careers_page_visible) notFound();

  const sp = await searchParams;
  const filters = publicFilters(sp || {});
  let initial = { rows: [], total: 0, hasMore: false };
  let options = { departments: [], cities: [] };
  try {
    [initial, options] = await Promise.all([listOpenJobs(filters, { page: 1, limit: 9 }), filterOptions()]);
  } catch (err) {
    // Tables not migrated yet → the page still renders "No Current Openings".
    if (err?.code !== "ER_NO_SUCH_TABLE") throw err;
  }

  return (
    <main className="bg-[var(--bg)] pb-16">
      <section className="border-b border-[var(--line)] bg-white">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "Careers" }]} className="mb-5" />
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">We&apos;re hiring</p>
          <h1 className="max-w-3xl text-[28px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[38px]">
            {settings.careers_page_title}
          </h1>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-[16px] leading-relaxed text-[var(--body-text)]">{settings.careers_page_intro}</p>
          <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <b className="block text-[15px] text-[var(--ink)]">{title}</b>
                  <span className="text-[13px] text-[var(--muted)]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="pt-8">
        <h2 className="mb-4 text-[22px] font-bold tracking-tight text-[var(--ink)] sm:text-[26px]">Current openings</h2>
        <CareersBrowser
          initial={initial}
          initialFilters={filters}
          options={options}
          initialJob={/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(sp?.job || "")) ? sp.job : ""}
        />
      </Container>
    </main>
  );
}
