import CityPage from "@/app/components/pages/city/City";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound, redirect } from "next/navigation";
import { getAllCities, getCityByUrl } from "@/lib/cityData";

export async function generateStaticParams() {
  try {
    const cities = await getAllCities();

    if (!Array.isArray(cities)) {
      console.error("getAllCities did not return an array:", cities);
      return [];
    }

    return cities
      .filter((city) => city.city_url)
      .map((city) => ({ city: city.city_url }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const city = resolvedParams.city.toLowerCase();

  try {
    const data = await getCityByUrl(city);

   
    if (!data) {
      return {
        title: `no services in ${city}`,
        description: `no Find services in ${city}`,
        robots: "noindex, nofollow",
        Keywords: `no services, ${city}`,
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
    
    console.error("generateMetadata error:", error);
    return {
      title: `no Services in ${city}`,
      description: `no Find services in ${city}`,
      robots: "noindex, nofollow",
    };
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

  let data = null;
  try {
    data = await getCityByUrl(lowercaseCity);
  } catch (error) {
    // Only real DB/connection failures land here now.
    console.error("Error fetching city page:", error);
  }

  // notFound() works by THROWING, so it must stay outside the try/catch above —
  // otherwise the catch swallows it and logs a misleading error.
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

  return (
    <>
      <CityPage cityData={data} />
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
    </>
  );
}