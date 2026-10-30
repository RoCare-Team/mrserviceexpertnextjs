import { POPULAR_CITIES } from "@/lib/popularCities";
import { LinkCloud } from "@/app/components/public/ui";

/**
 * The "Popular Cities" block, shared by the homepage, the /{category}
 * landing pages, and any page whose own state-derived city list came back
 * empty (near-me is alone in state "India", so its pages have nothing to show
 * without this fallback).
 *
 * Passing a category links each city to /{city}/{categoryUrl}; leaving it out
 * links to /{city}. excludeCity drops the page's own city so it does not link
 * to itself.
 */
export default function PopularCities({ categoryUrl = "", categoryName = "", excludeCity = "" }) {
  const skip = excludeCity.toLowerCase();
  const cities = skip ? POPULAR_CITIES.filter((c) => c.city_url !== skip) : POPULAR_CITIES;
  if (!cities.length) return null;

  const label = categoryName ? `${categoryName} services` : "home appliance services";
  return (
    <LinkCloud
      id="popular-cities"
      title={categoryName ? `${categoryName} in popular cities` : "Popular cities"}
      subtitle={`Doorstep ${label} across India`}
      items={cities.map((c) => ({
        href: categoryUrl ? `/${c.city_url}/${categoryUrl}` : `/${c.city_url}`,
        label: c.city_name,
        title: `${c.city_name} ${label}`,
      }))}
    />
  );
}
