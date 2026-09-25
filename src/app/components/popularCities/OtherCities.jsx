import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getOtherCityLinks } from "@/lib/otherCityLinks";

/**
 * "Homepage Cities" dropdown on the homepage, sitting under Popular Cities.
 *
 * Unlike PopularCities (a fixed list in the code) these links are managed from
 * /admin/other_cities, so this is an async server component that reads them at
 * render time. It renders nothing when no active links exist, which keeps the
 * homepage unchanged until someone actually adds one.
 */
export default async function OtherCities() {
  const links = await getOtherCityLinks();
  if (!links.length) return null;

  return (
    <div className="bg-white px-8 py-6">
      <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
        <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
          <span>Homepage Cities</span>
          <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">
            ▼
          </span>
        </summary>

        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <div className="brandsServices" key={link.id}>
              <a href={link.url} title={link.title}>
                <li className=" text-gray-500 list-none">
                  <FontAwesomeIcon icon={faLocation} /> {link.title},
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
