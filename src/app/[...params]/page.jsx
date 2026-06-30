

import ServicePage from "@/app/components/pages/Services/brands";
import { notFound } from "next/navigation";
import { getBrandPageData } from "@/lib/brandPageData";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export async function generateMetadata({ params }) {
  const resolved = await params;
  const pathParams = resolved.params;

  if (!pathParams || pathParams.length !== 3) {
    return {
      title: "Page Not Found",
      description: "The page you are looking for does not exist.",
      robots: "noindex, nofollow",
    };
  }

  const [city, brand, cat] = pathParams;

  try {
    const data = await getBrandPageData(city, brand, cat);

    // Page not found → don't let crawlers index it.
    if (!data) {
      return {
        title: `Service in ${city} | Your Brand`,
        description: `Find the best services in ${city}. Book now!`,
        robots: "noindex, nofollow",
      };
    }

    return {
      title: data?.content?.meta_title || `Service in ${city} | Your Brand`,
      description:
        data?.content?.meta_description ||
        `Find the best services in ${city}. Book now!`,
      keywords:
        data?.content?.meta_keywords ||
        `services in ${city}, ${city} services`,
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}/${brand}/${cat}`,
      },
      robots: "index, follow",
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: `Service in ${city} | Your Brand`,
      description: `Find the best services in ${city}. Book now!`,
      robots: "noindex, nofollow",
    };
  }
}

export default async function Page({ params }) {
  const resolved = await params;
  const pathParams = resolved.params;

  if (!pathParams || pathParams.length !== 3) {
    return notFound();
  }

  const [city, brand, cat] = pathParams;

  let data = null;
  try {
    data = await getBrandPageData(city, brand, cat);
  } catch (error) {
    // Only real DB/connection failures land here.
    console.error("Error fetching brand page:", error);
  }

  // notFound() throws — keep it outside the try/catch so it isn't swallowed.
  if (!data) {
    return notFound();
  }

  return <ServicePage city={city} brand={brand} pagedata={data} cat={cat} />;
}