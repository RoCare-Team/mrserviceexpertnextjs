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
  const { city , cat } =  await params;

  const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city,cat }),
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
      

// const filteredServices = data?.services?.filter(service =>
//   service.category_name?.toLowerCase().replace(/\s+/g, '-') === cat?.toLowerCase()
// );
// data.services = filteredServices;
  
      return <ServicePage  pagedata={data} city={city} cat={cat}  />;
    } catch (error) {
      // console.error('Error fetching city page:', error);
      notFound(); // if API fails or wrong city, go to 404
    }

    }