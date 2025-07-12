// app/[city]/[cat]/page.tsx
import ServicePage from "@/app/components/pages/Services/ServicePage";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound } from 'next/navigation';

// export async function generateMetadata({ params }) {
//   const { city, cat } = params;
//   return {
//     title: `Service in ${city} - ${cat} | Your Brand`,
//     description: `Find the best ${cat} services in ${city}. Book now!`,
//   };
// }

export async function generateMetadata({ params }) {
  const { city, cat } = await params;

  const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, cat }),
    cache: 'no-store',
  });

  const data = await response.json();
  // console.log(data);

  return {
    title: data?.content?.meta_title || `Service in ${city} | Your Brand`,
    description: data?.content?.meta_description || `Find the best services in ${city}. Book now!`,
    keywords: data?.content?.meta_keywords || `services in ${city}, ${city} services`,
    alternates: {
      canonical: `https://www.mrserviceexpert.com/${city}/${cat}`,
    },
    robots: 'index, follow',
  };
}

export default async function Page({ params }) {
  const { city, cat } = await params;

  try {
    const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, cat }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (data.error) {
      notFound();
    }

    // console.log(JSON.stringify(data?.category)+'category and service data');

    // Filter only matching category
    const matchedCategory = data?.category?.filter(catItem =>
      catItem.category_name?.toLowerCase().replace(/\s+/g, '-') === cat?.toLowerCase()
    );

    // if (!matchedCategory || matchedCategory.length === 0) {
    //   notFound(); // If no matching category found
    // }

    data.category = matchedCategory;
    // console.log(JSON.stringify(matchedCategory) + ' filtered category and service data');
    // making the cities  and category_services empty as right now getting different description which is not good for seo purposes
    data.cities = [];
    data.category_services = [];

    if (data.related_cities && Array.isArray(data.related_cities)) {
      data.related_cities = data.related_cities.map(city => ({
        id: city.id,
        city_id: city.city_id,
        parent_city: city.parent_city,
        url: city.url,
        city_name: city.city_name,
        city_url: city.city_url,
      }));
    }

    // console.log(data);

    // const filteredServices = data?.services?.filter(service =>
    //   service.category_name?.toLowerCase().replace(/\s+/g, '-') === cat?.toLowerCase()
    // );
    // data.services = filteredServices;
{/*  */}
    return <>
    <ServicePage pagedata={data} city={city} cat={cat} />
    {data.related_cities?.length > 0 && (
  <div className="bg-white px-8 py-6">
    <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
      <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
        <span>Popular Cities Near Me</span>
        <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">▼</span>
      </summary>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.related_cities.map((city) => (
          <div className="brandsServices" key={city.id}>
            <a
              href={`/${city.city_url}/${cat}`}
              title={`${city.city_name} ${cat} services`}
            >
              <li className=" text-gray-500 list-none">
                <FontAwesomeIcon icon={faLocation}/> {city.city_name},
                <span></span>
              </li>
            </a>
          </div>
        ))}
      </div>
    </details>
  </div>
)}

    </> ;
  } catch (error) {
    // console.error('Error fetching city page:', error);
    notFound(); // if API fails or wrong city, go to 404
  }

}