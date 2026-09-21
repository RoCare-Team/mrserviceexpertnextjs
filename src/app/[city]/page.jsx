import CityPage from "@/app/components/pages/city/City";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound, redirect } from "next/navigation";
import {
  getAllCities,
  getAllCategories,
  getPageByUrl,
} from "@/lib/cityData";

// State capitals linked from every category page as /{city}/{category}
const CAPITAL_CITIES = [
  { city_name: "Amaravati", city_url: "amaravati" },
  { city_name: "Itanagar", city_url: "itanagar" },
  { city_name: "Dispur", city_url: "dispur" },
  { city_name: "Patna", city_url: "patna" },
  { city_name: "Raipur", city_url: "raipur" },
  { city_name: "Panaji", city_url: "panaji" },
  { city_name: "Gandhinagar", city_url: "gandhinagar" },
  { city_name: "Chandigarh", city_url: "chandigarh" },
  { city_name: "Shimla", city_url: "shimla" },
  { city_name: "Ranchi", city_url: "ranchi" },
  { city_name: "Bengaluru", city_url: "bengaluru" },
  { city_name: "Thiruvananthapuram", city_url: "thiruvananthapuram" },
  { city_name: "Bhopal", city_url: "bhopal" },
  { city_name: "Mumbai", city_url: "mumbai" },
  { city_name: "Imphal", city_url: "imphal" },
  { city_name: "Shillong", city_url: "shillong" },
  { city_name: "Aizawl", city_url: "aizawl" },
  { city_name: "Kohima", city_url: "kohima" },
  { city_name: "Bhubaneswar", city_url: "bhubaneswar" },
  { city_name: "Jaipur", city_url: "jaipur" },
  { city_name: "Gangtok", city_url: "gangtok" },
  { city_name: "Chennai", city_url: "chennai" },
  { city_name: "Hyderabad", city_url: "hyderabad" },
  { city_name: "Agartala", city_url: "agartala" },
  { city_name: "Lucknow", city_url: "lucknow" },
  { city_name: "Dehradun", city_url: "dehradun" },
  { city_name: "Kolkata", city_url: "kolkata" },
];

export async function generateStaticParams() {
  try {
    const [cities, categories] = await Promise.all([
      getAllCities(),
      getAllCategories(),
    ]);

    const cityParams = (Array.isArray(cities) ? cities : [])
      .filter((c) => c.city_url)
      .map((c) => ({ city: c.city_url }));

    const categoryParams = (Array.isArray(categories) ? categories : [])
      .filter((c) => c.category_url)
      .map((c) => ({ city: c.category_url })); // same [city] dynamic segment

    return [...cityParams, ...categoryParams];
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const city = resolvedParams.city.toLowerCase();

  try {
    const data = await getPageByUrl(city);

    if (!data) {
      return {
        title: `no services in ${city}`,
        description: `no Find services in ${city}`,
        robots: "noindex, nofollow",
        keywords: `no services, ${city}`,
        alternates: {
          canonical: `https://www.mrserviceexpert.com/${city}`,
        },
      };
    }

    const cityDetail = data?.city_detail;
    const categorydetail = data?.categorydetail;

    return {
      title:
        cityDetail?.meta_title ||
        categorydetail?.meta_title ||
        `Services in ${city}`,
      description:
        cityDetail?.meta_description ||
        categorydetail?.meta_description ||
        `Find services in ${city}`,
      keywords:
        cityDetail?.meta_keywords ||
        categorydetail?.meta_keywords ||
        `services, ${city}`,
      robots: "index, follow",
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}`,
      },
    };
  } catch (error) {
    // DB/network failure — RETHROW so the build retries this page instead of
    // shipping a prerendered noindex page for a real city (SEO poison).
    console.error("generateMetadata error:", error);
    throw error;
  }
};

export default async function Page({ params }) {
  const resolvedParams = await params;
  const originalCity = resolvedParams.city;
  const lowercaseCity = originalCity.toLowerCase();

  // Redirect if URL has uppercase
  if (originalCity !== lowercaseCity) {
    redirect(`/${lowercaseCity}`);
  }

  // No try/catch: a DB/connection failure must THROW, not fall through to
  // notFound() — during `next build` a swallowed error here prerenders the
  // city as a permanent 404. Throwing makes Next retry the page (3 attempts)
  // and fail the build loudly if the DB is really down.
  const data = await getPageByUrl(lowercaseCity);

  // Genuinely unknown slug → real 404.
  if (!data) {
    return notFound();
  }

  if (data.recent_cities && Array.isArray(data.recent_cities)) {
    data.recent_cities = data.recent_cities.map((city) => ({
      id: city.id,
      city_id: city.city_id,
      parent_city: city.parent_city,
      url: city.url,
      city_name: city.city_name,
      city_url: city.city_url,
    }));
  }

  // City handles BOTH layouts internally via cityData.status, so always pass
  // the resolved object as `cityData` whether it's a city or a category.
  return (
    <>
      <CityPage cityData={data} />

      {/* recent_cities only has entries for city pages, so this self-hides for categories */}
      {data.recent_cities?.length > 0 && (
        <div className="bg-white px-8 py-6">
          <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
            <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
              <span>Popular Cities Near Me</span>
              <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">
                ▼
              </span>
            </summary>

            <div className="mt-4 flex flex-wrap gap-2">
              {data.recent_cities.map((city) => (
                <div className="brandsServices" key={city.id}>
                  <a href={`/${city.city_url}`} title={`${city.city_name}  services`}>
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
      )}

      {data.type === "category" && (
        <div className="bg-white px-8 py-6">
          <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
            <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
              <span>Popular Cities</span>
              <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">
                ▼
              </span>
            </summary>

            <div className="mt-4 flex flex-wrap gap-2">
              {CAPITAL_CITIES.map((city) => (
                <div className="brandsServices" key={city.city_url}>
                  <a
                    href={`/${city.city_url}/${data.category_url}`}
                    title={`${data.category_name} services in ${city.city_name}`}
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
      )}
    </>
  );
}