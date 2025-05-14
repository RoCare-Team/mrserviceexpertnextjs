// app/[city]/[cat]/page.tsx
import ServicePage from "@/app/components/pages/Services/ServicePage";
import { notFound } from 'next/navigation';

// export async function generateMetadata({ params }) {
//   const { city, cat } = params;
//   return {
//     title: `Service in ${city} - ${cat} | Your Brand`,
//     description: `Find the best ${cat} services in ${city}. Book now!`,
//   };
// }

export async function generateMetadata({ params }) {
  const { city , cat } = params;

  const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city,cat }),
    cache: 'no-store',
  });

  const data = await response.json();
console.log(data);

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
  const { city, cat } = params;
  
   try {
      const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, cat }),
        cache: 'no-store',
      });
  
      const data = await response.json();
  
      if (data.error) {
        notFound(); // <-- This will show the Next.js built-in 404 page
      }
  
      return <ServicePage  pagedata={data} city={city} cat={cat}  />;
    } catch (error) {
      console.error('Error fetching city page:', error);
      notFound(); // if API fails or wrong city, go to 404
    }

    }