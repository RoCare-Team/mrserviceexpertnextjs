

import ServicePage from "@/app/components/pages/Services/brands";
import { notFound } from "next/navigation";
import { getBrandPageData } from "@/lib/brandPageData";
import { getPublicAiContent } from "@/lib/aiContent";
import { applianceMeta, isHomeAppliance } from "@/lib/homeCare";

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

    // Home appliance brand pages use the fixed pattern with the brand before
    // the category; anything else keeps the meta saved in the DB.
    const appliance = isHomeAppliance(cat)
      ? applianceMeta({
          category: data.categoryname,
          city: data.city_name,
          brand: data.brandname,
        })
      : null;

    return {
      title:
        appliance?.title ||
        data?.content?.meta_title ||
        `Service in ${city} | Your Brand`,
      description:
        appliance?.description ||
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

  // AI-generated copy for this exact URL. null when none has been generated,
  // so the page renders no AI block at all.
  const aiContent = await getPublicAiContent(`${city}/${brand}/${cat}`);

  return (
    <ServicePage
      city={city}
      brand={brand}
      pagedata={data}
      cat={cat}
      aiContent={aiContent}
    />
  );
}
