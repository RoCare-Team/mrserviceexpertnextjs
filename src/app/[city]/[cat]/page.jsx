// app/[city]/[cat]/page.jsx
import ServicePage from "@/app/components/pages/Services/ServicePage";
import BangaloreRo from "@/app/components/pages/Services/BangaloreRo";
import { notFound, redirect } from "next/navigation";
import { getCityCategoryPageData } from "@/lib/cityCategoryPageData";
import { getPublicAiContent } from "@/lib/aiContent";
import StoreLocator from "@/app/components/StoreLocator/StoreLocator";
import { applianceMeta, isHomeAppliance } from "@/lib/homeCare";
import PartnerListingSection from "@/app/components/partners/PartnerListingSection";
import PartnerSidebar, { SIDEBAR_MAX } from "@/app/components/partners/PartnerSidebar";
import { getPagePartners } from "@/app/components/partners/pagePartners";
import { Container, Section } from "@/app/components/public/ui";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const city = resolvedParams.city.toLowerCase();
  const cat = resolvedParams.cat.toLowerCase();

  try {
    const data = await getCityCategoryPageData(city, cat);

    // Page not found → don't index.
    if (!data) {
      return {
        title: `Service in ${city} | Your Brand`,
        description: `Find the best services in ${city}. Book now!`,
        robots: "noindex, nofollow",
      };
    }

    // Home appliance pages use one fixed title/description pattern; every
    // other page (home care etc.) keeps the meta saved in the DB.
    const appliance = isHomeAppliance(cat) ? applianceMeta({ category: data.category_name, city: data.city_name }) : null;

    return {
      title: appliance?.title || data?.content?.meta_title || `Service in ${city} | Your Brand`,
      description: appliance?.description || data?.content?.meta_description || `Find the best services in ${city}. Book now!`,
      keywords: data?.content?.meta_keywords || `services in ${city}, ${city} services`,
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}/${cat}`,
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
  const resolvedParams = await params;
  const originalCity = resolvedParams.city;
  const originalCat = resolvedParams.cat;
  const city = originalCity.toLowerCase();
  const cat = resolvedParams.cat.toLowerCase();

  // Redirect if URL has uppercase
  if (originalCity !== city || originalCat !== cat) {
    redirect(`/${city}/${cat}`);
  }

  let data = null;
  try {
    data = await getCityCategoryPageData(city, cat);
  } catch (error) {
    // Only real DB/connection failures land here.
    console.error("Error fetching city/category page:", error);
  }

  // notFound() throws — keep it outside the try/catch so it isn't swallowed.
  if (!data) {
    return notFound();
  }

  // AI-generated copy for this exact URL. null when none has been generated,
  // so the page renders no AI block at all.
  const aiContent = await getPublicAiContent(`${city}/${cat}`);

  // Filter only matching category
  const matchedCategory = data?.category?.filter((catItem) => catItem.category_name?.toLowerCase().replace(/\s+/g, "-") === cat?.toLowerCase());
  data.category = matchedCategory;

  // making the cities and category_services empty as right now getting different
  // description which is not good for seo purposes
  data.cities = [];
  data.category_services = [];

  if (data.related_cities && Array.isArray(data.related_cities)) {
    data.related_cities = data.related_cities.map((c) => ({
      id: c.id,
      city_id: c.city_id,
      parent_city: c.parent_city,
      url: c.url,
      city_name: c.city_name,
      city_url: c.city_url,
    }));
  }

  // Approved partners for this city + category: fetched once, shown compactly
  // in the sticky column and — when there are more than fit there — as a full
  // grid further down the page.
  const partners = await getPagePartners({ cityUrl: city, categoryUrl: cat, cityName: data?.city_name, categoryName: data?.category_name });
  const showGrid = partners && partners.first.total > SIDEBAR_MAX;

  return (
    <ServicePage
      pagedata={data}
      city={city}
      cat={cat}
      aiContent={aiContent}
      partnerSidebar={<PartnerSidebar data={partners} />}
      partnerSection={showGrid ? <PartnerListingSection data={partners} /> : null}
    >
      {data?.stores?.length > 0 && (
        <Container>
          <Section className="!pt-0">
            <StoreLocator stores={data.stores} city={data?.city_name} category={data?.category_name} />
          </Section>
        </Container>
      )}

      {city === "bangalore" && cat === "ro-water-purifier" && <BangaloreRo />}
    </ServicePage>
  );
}
