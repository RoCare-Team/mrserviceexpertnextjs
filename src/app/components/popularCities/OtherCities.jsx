import { getOtherCityLinks } from "@/lib/otherCityLinks";
import { LinkCloud } from "@/app/components/public/ui";

/**
 * "Homepage Cities" block on the homepage, under Popular Cities.
 *
 * Unlike PopularCities (a fixed list in the code) these links are managed from
 * /admin/other_cities, so this is an async server component that reads them at
 * render time. It renders nothing when no active links exist.
 */
export default async function OtherCities() {
  const links = await getOtherCityLinks();
  if (!links.length) return null;

  return <LinkCloud id="other-cities" title="More cities we serve" items={links.map((l) => ({ href: l.url, label: l.title, title: l.title }))} />;
}
