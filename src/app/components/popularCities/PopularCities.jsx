import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { POPULAR_CITIES } from "@/lib/popularCities";

/**
 * The "Popular Cities" dropdown, shared by the homepage, the /{category}
 * landing pages, and any page whose own state-derived city list came back
 * empty (near-me is alone in state "India", so its pages have nothing to show
 * without this fallback).
 *
 * Passing a category links each city to /{city}/{categoryUrl}; leaving it out
 * links to /{city}. excludeCity drops the page's own city so it does not link
 * to itself.
 */
export default function PopularCities({
  categoryUrl = "",
  categoryName = "",
  excludeCity = "",
}) {
  const skip = excludeCity.toLowerCase();
  const cities = skip
    ? POPULAR_CITIES.filter((c) => c.city_url !== skip)
    : POPULAR_CITIES;

  if (!cities.length) return null;

  const label = categoryName ? `${categoryName} services` : "home appliance services";

  return (
    <div className="bg-white px-8 py-6">
      <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
        <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
          <span>Popular Cities</span>
          <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">
            ▼
          </span>
        </summary>

        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <div className="brandsServices" key={city.city_url}>
              <a
                href={categoryUrl ? `/${city.city_url}/${categoryUrl}` : `/${city.city_url}`}
                title={`${city.city_name} ${label}`}
              >
                <li className=" text-gray-500 list-none">
                  <FontAwesomeIcon icon={faLocation} /> {city.city_name},
                  <span></span>
                </li>
              </a>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
