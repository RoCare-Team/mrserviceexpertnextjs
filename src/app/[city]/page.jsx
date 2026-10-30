import CityPage from "@/app/components/pages/city/City";
import { notFound, redirect } from "next/navigation";
import { getAllCities, getAllCategories, getPageByUrl } from "@/lib/cityData";
import PopularCities from "@/app/components/popularCities/PopularCities";
import { Container, Section, LinkCloud } from "@/app/components/public/ui";

export async function generateStaticParams() {
  try {
    const [cities, categories] = await Promise.all([getAllCities(), getAllCategories()]);

    const cityParams = (Array.isArray(cities) ? cities : []).filter((c) => c.city_url).map((c) => ({ city: c.city_url }));

    const categoryParams = (Array.isArray(categories) ? categories : []).filter((c) => c.category_url).map((c) => ({ city: c.category_url })); // same [city] dynamic segment

    return [...cityParams, ...categoryParams];
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const city = resolvedParams.city.toLowerCase();

  try {
    const data = await getPageByUrl(city);

    if (!data) {
      return {
        title: `no services in ${city}`,
        description: `no Find services in ${city}`,
        robots: "noindex, nofollow",
        keywords: `no services, ${city}`,
        alternates: {
          canonical: `https://www.mrserviceexpert.com/${city}`,
        },
      };
    }

    const cityDetail = data?.city_detail;
    const categorydetail = data?.categorydetail;

    return {
      title: cityDetail?.meta_title || categorydetail?.meta_title || `Services in ${city}`,
      description: cityDetail?.meta_description || categorydetail?.meta_description || `Find services in ${city}`,
      keywords: cityDetail?.meta_keywords || categorydetail?.meta_keywords || `services, ${city}`,
      robots: "index, follow",
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}`,
      },
    };
  } catch (error) {
    // DB/network failure — RETHROW so the build retries this page instead of
    // shipping a prerendered noindex page for a real city (SEO poison).
    console.error("generateMetadata error:", error);
    throw error;
  }
};

export default async function Page({ params }) {
  const resolvedParams = await params;
  const originalCity = resolvedParams.city;
  const lowercaseCity = originalCity.toLowerCase();

  // Redirect if URL has uppercase
  if (originalCity !== lowercaseCity) {
    redirect(`/${lowercaseCity}`);
  }

  // No try/catch: a DB/connection failure must THROW, not fall through to
  // notFound() — during `next build` a swallowed error here prerenders the
  // city as a permanent 404. Throwing makes Next retry the page (3 attempts)
  // and fail the build loudly if the DB is really down.
  const data = await getPageByUrl(lowercaseCity);

  // Genuinely unknown slug → real 404.
  if (!data) {
    return notFound();
  }

  if (data.recent_cities && Array.isArray(data.recent_cities)) {
    data.recent_cities = data.recent_cities.map((city) => ({
      id: city.id,
      city_id: city.city_id,
      parent_city: city.parent_city,
      url: city.url,
      city_name: city.city_name,
      city_url: city.city_url,
    }));
  }

  const nearby = (data.recent_cities || []).map((c) => ({ href: `/${c.city_url}`, label: c.city_name, title: `${c.city_name} services` }));

  // City handles BOTH layouts internally via cityData.status, so always pass
  // the resolved object as `cityData` whether it's a city or a category.
  return (
    <>
      <CityPage city={lowercaseCity} cityData={data} />

      <Container>
        <Section className="!pt-0 flex flex-col gap-4">
          {/* recent_cities only has entries for city pages, so this self-hides for categories */}
          {nearby.length > 0 && (
            <LinkCloud id="nearby" title="Popular cities near you" subtitle={`Other cities in ${data.recent_cities?.[0]?.parent_city || "the state"} we serve`} items={nearby} />
          )}

          {data.type === "category" && <PopularCities categoryUrl={data.category_url} categoryName={data.category_name} />}

          {/* A city alone in its state (near-me, state "India") has no
              recent_cities, which would leave the page with no city links at all.
              Fall back to the shared Popular Cities list in that case. */}
          {data.type === "city" && !nearby.length && <PopularCities excludeCity={lowercaseCity} />}
        </Section>
      </Container>
    </>
  );
}
