// app/[city]/[cat]/page.tsx
import ServicePage from "@/app/components/pages/Services/brands";
import { notFound } from 'next/navigation';


// const API= https://mannubhai.in/web_api;
// await fetch(GET_BRAND_PAGE)
// singelton pattern const GET_BRAND_PAGE=`API/${get_drand_page_data.php}`;

export async function generateMetadata({ params }) {
  const slugs= await params

  if (!slugs.params || slugs.params.length !== 3) {
    return {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist.',
      robots: 'noindex, nofollow',
    };
  }
    const [city, brand, cat] =  slugs.params || [];

  const response = await fetch('https://mannubhai.in/web_api/get_drand_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city,brand,cat }),
    cache: 'no-store',
  });

  const data = await response.json();
// console.log(data);

  return {
    title: data?.content?.meta_title || `Service in ${city} | Your Brand`,
    description: data?.content?.meta_description || `Find the best services in ${city}. Book now!`,
    keywords: data?.content?.meta_keywords || `services in ${city}, ${city} services`,
    alternates: {
      canonical: `https://www.mrserviceexpert.com/${city}/${brand}/${cat}`,
    },
    robots: 'index, follow',
  };
}

export default async function Page({ params }) {
//   const { city,brand, cat } = params;
// const [city, brand, cat] = params.params || [];


const { params: pathParams } =  await params;

  if (!pathParams || pathParams.length !== 3) {
    // using this logic as we will make it return to 404 page whenever 
    return notFound();
  }

  const [city, brand, cat] = pathParams;

 
  
   try {
      const response = await fetch('https://mannubhai.in/web_api/get_drand_page_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city,brand, cat }),
        cache: 'no-store',
      });
  
      const data = await response.json();
  // console.log(data);
  
      if (data.error) {
        notFound(); // <-- This will show the Next.js built-in 404 page
      }
  
      return <ServicePage city={city} brand={brand} pagedata={data} cat={cat} />;
    } catch (error) {
      console.error('Error fetching city page:', error);
      notFound(); // if API fails or wrong city, go to 404
    }

    }