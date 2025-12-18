import CityPage from "@/app/components/pages/city/City";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound } from "next/navigation";
import { redirect } from 'next/navigation';


export async function generateStaticParams() {
  try {
    const response = await fetch("https://mannubhai.in/web_api/get_city_page_data.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ city: "all" }), // ✅ or maybe "India" or ""
      cache: "force-cache",
    });

    const cities = await response.json();

    if (!Array.isArray(cities)) {
      console.error("API response is not an array:", cities);
      return [];
    }

    // console.log("Static params:", cities);

    return cities.filter(city => city.city_url).map((city) => ({
        city: city.city_url,
      }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}


export const generateMetadata = async ({ params }) => {
  // const { city } = await params;

  const resolvedParams = await params;
  // const originalCity = resolvedParams.city;
  // const lowercaseCity = originalCity.toLowerCase();
  let city = resolvedParams.city.toLowerCase();
  
  // // Redirect if URL has uppercase
  // if (originalCity !== lowercaseCity) {
  //   redirect(`/${lowercaseCity}`);
  // }

  try {
    const response = await fetch('https://mannubhai.in/web_api/get_city_page_data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({city}),
      // cache: 'no-store',
    });

    const data = await response.json();
    // console.log(JSON.stringify(data)+'addsdsd');
    // const dipper=JSON.stringify(data);

    // console.log(json.parse(dipper)+'fdsfasdfasdg');


    const cityDetail = data?.city_detail;
    const categorydetail = data?.categorydetail;
    // console.log(JSON.stringify(cityDetail)+'yahan tu mare jayege');


    return {

      title: cityDetail?.meta_title || categorydetail?.meta_title || `Services in ${city}`,
      description: cityDetail?.meta_description || categorydetail?.meta_description || `Find services in ${city}`,
      keywords: cityDetail?.meta_keywords || categorydetail?.meta_keywords || `services, ${city}`,
      robots: 'index, follow',
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}`,
      },
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: `Services in ${city}`,
      description: `Find services in ${city}`,
    };
  }
};

export default async function Page({ params }) {
  // const { city } = await params;
    const resolvedParams = await params;
  const originalCity = resolvedParams.city;
  const lowercaseCity = originalCity.toLowerCase();
  
  // Redirect if URL has uppercase
  if (originalCity !== lowercaseCity) {
    redirect(`/${lowercaseCity}`);
  }
 let data;
  try {
    const response = await fetch("https://mannubhai.in/web_api/get_city_page_data.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({city: lowercaseCity}),
      // cache: "no-store",
    });

     data = await response.json();

    // console.log(JSON.stringify(data));
     if (data.error) {

    // console.log(data);

    return notFound();
  }

   if (data.recent_cities && Array.isArray(data.recent_cities)) {
    data.recent_cities = data.recent_cities.map(city => ({
      id: city.id,
      city_id: city.city_id,
      parent_city: city.parent_city,
      url: city.url,
      city_name: city.city_name,
      city_url: city.city_url,
    }));
  }

  }
  catch (error) {
    console.error("Error fetching city page:", error);
    return notFound();
  }

  // console.log(data);
 

 
  // console.log(data);


  {/* <CityPage cityData ={data} /> */ }
  return <>
    <CityPage cityData={data} />
    {data.recent_cities?.length > 0 && (
      <div className="bg-white px-8 py-6">
        <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
          <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
            <span>Popular Cities Near Me</span>
            <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">▼</span>
          </summary>

          <div className="mt-4 flex flex-wrap gap-2">
            {data.recent_cities.map((city) => (
              <div className="brandsServices" key={city.id}>
                <a
                  href={`/${city.city_url}`}
                  title={`${city.city_name}  services`}
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

}
