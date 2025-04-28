// app/[city]/[cat]/page.tsx
import CityPage from "@/app/components/pages/city/City";

// export async function generateMetadata({ params }) {
//   const { city } = params;
//   return {
//     title: `Service in ${city}  | Your Brand`,
//     description: `Find the best services in ${city}. Book now!`,
//   };
// }

export async function generateMetadata({ params }) {
  const { city } = params;

  try {
    const response = await fetch('https://mannubhai.in/web_api/get_city_page_data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city }),
      cache: 'no-store',
    });

    const data = await response.json();

    const cityDetail = data?.city_detail;
    const categoryDetail = data?.categorydetail;

    return {
      title: cityDetail?.meta_title || categoryDetail?.meta_title || `Service in ${city} | Your Brand`,
      description: cityDetail?.meta_description || categoryDetail?.meta_description || `Find the best services in ${city}. Book now!`,
      keywords: cityDetail?.meta_keywords || categoryDetail?.meta_keywords || `services in ${city}, ${city} services`,
      robots: 'index, follow',
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}`,
      },
    };

  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `Service in ${city} | Your Brand`,
      description: `Find the best services in ${city}. Book now!`,
      keywords: `services in ${city}, ${city} services`,
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}/${cat}`,
      },
      robots: 'index, follow',
    };
  }
}

export default function Page({ params }) {
  const { city } = params;
  return <CityPage city={city} />;
}
