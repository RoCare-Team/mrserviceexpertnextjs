import { resolvePageIds, getListingPage } from "@/lib/partners/listing";
import { CRM_LEAD_TYPES } from "@/lib/partners/crmMap";

/**
 * Approved partners for a service page, fetched once and shared by the
 * sticky sidebar (PartnerSidebar) and the full grid (PartnerListingSection).
 * Returns null when there are none or the partner tables are not set up, so
 * callers simply render nothing. A listing failure never breaks the page.
 */
export async function getPagePartners({ cityUrl, categoryUrl, brandUrl = null, brandName = null, cityName, categoryName, baseCategoryName = null }) {
  let ids = null;
  let first = null;
  try {
    ids = await resolvePageIds({ cityUrl, categoryUrl, brandUrl });
    if (ids) first = await getListingPage(ids);
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE") console.error("[pagePartners]", err?.message);
    return null;
  }
  if (!first?.total) return null;

  // "Book now" is pre-filled with this page's category / brand / city.
  const bookingContext = CRM_LEAD_TYPES[categoryUrl]
    ? {
        categories: [{ url: categoryUrl, name: baseCategoryName || categoryName }],
        defaultCategory: categoryUrl,
        brandName: brandName || null,
        cityName,
      }
    : null;

  return { ids, first, bookingContext, cityName, categoryName };
}
