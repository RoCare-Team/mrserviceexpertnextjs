// app/[city]/[cat]/page.tsx
import ServicePage from "@/app/components/pages/Services/ServicePage";

export async function generateMetadata({ params }) {
  const { city, cat } = params;
  return {
    title: `Service in ${city} - ${cat} | Your Brand`,
    description: `Find the best ${cat} services in ${city}. Book now!`,
  };
}

export default function Page({ params }) {
  const { city, cat } = params;
  return <ServicePage city={city} cat={cat} />;
}
