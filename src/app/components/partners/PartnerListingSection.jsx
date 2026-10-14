import Link from "next/link";
import PartnerCard from "./PartnerCard";
import PartnerLoadMore from "./PartnerLoadMore";
import { resolvePageIds, getListingPage } from "@/lib/partners/listing";

/**
 * Server component: approved partners for an existing service page.
 * Resolves canonical ids from the page's own URL slugs (city_tb.city_url,
 * category_tb.category_url, brand_tb.brand_url) and queries server-side.
 * Renders nothing when there are no partners, so existing pages look the
 * same until someone is approved for that area. A listing failure never
 * breaks the page.
 */
export default async function PartnerListingSection({ cityUrl, categoryUrl, brandUrl = null, cityName, categoryName }) {
  let ids = null;
  let first = null;
  try {
    ids = await resolvePageIds({ cityUrl, categoryUrl, brandUrl });
    if (ids) first = await getListingPage(ids);
  } catch (err) {
    // ER_NO_SUCH_TABLE = partner migration not applied yet; stay silent.
    if (err?.code !== "ER_NO_SUCH_TABLE") console.error("[PartnerListingSection]", err?.message);
    return null;
  }
  if (!first?.total) return null;

  return (
    <section aria-labelledby="partners-h" className="common-spacing">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-5 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <h2 id="partners-h" className="text-2xl font-bold text-[var(--ink)]">
              {categoryName} Service Partners in {cityName}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Independent businesses approved by Mr. Service Expert that serve {cityName}.
            </p>
          </div>
          <Link href="/join-as-partner" className="text-sm font-semibold text-purple-700 underline">
            Are you a technician? Join as a partner
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {first.items.map((p) => (
            <li key={p.slug}>
              <PartnerCard partner={p} />
            </li>
          ))}
          {first.hasMore && <PartnerLoadMore query={ids} startPage={2} />}
        </ul>
      </div>
    </section>
  );
}
