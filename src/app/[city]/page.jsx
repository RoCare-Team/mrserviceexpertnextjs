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

  const response = await fetch('https://mannubhai.in/web_api/get_city_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
    cache: 'no-store',
  });

  const data = await response.json();

  return {
    title: data?.city_detail.meta_title || data?.categorydetail.meta_title ||`Service in ${city} | Your Brand`,
    description: data?.city_detail.meta_description ||data?.categorydetail.meta_description ||`Find the best services in ${city}. Book now!`,
    keywords: data?.city_detail.meta_keywords || data?.categorydetail.meta_keywords ||`services in ${city}, ${city} services`,
    robots: 'index, follow',
  };
}

export default function Page({ params }) {
  const { city } = params;
  return <CityPage city={city} />;
}
