// app/[city]/[cat]/page.tsx
import CityPage from "@/app/components/pages/city/City";

export async function generateMetadata({ params }) {
  const { city } = params;
  return {
    title: `Service in ${city}  | Your Brand`,
    description: `Find the best services in ${city}. Book now!`,
  };
}

export default function Page({ params }) {
  const { city } = params;
  return <CityPage city={city} />;
}
