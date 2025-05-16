import CityPage from "@/app/components/pages/city/City";
import { notFound } from "next/navigation";

export const generateMetadata = async ({ params }) => {
  const { city } = params;

  try {
    const response = await fetch('https://mannubhai.in/web_api/get_city_page_data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city }),
      cache: 'no-store',
    });

    const data = await response.json();
    // console.log(JSON.stringify(data)+'addsdsd');
    // const dipper=JSON.stringify(data);

    // console.log(json.parse(dipper)+'fdsfasdfasdg');
    
    
    const cityDetail = data?.city_detail;
    const categorydetail=data?.categorydetail;
    // console.log(JSON.stringify(cityDetail)+'yahan tu mare jayege');
    

    return {
    
      title: cityDetail?.meta_title || categorydetail?.meta_title || `Services in ${city}`,
      description: cityDetail?.meta_description || categorydetail?.meta_description || `Find services in ${city}`,
      keywords: cityDetail?.meta_keywords ||categorydetail?.meta_keywords || `services, ${city}`,
      robots: 'index, follow',
      alternates: {
        canonical: `https://www.mrserviceexpert.com/${city}`,
      },
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: `Services in ${city}`,
      description: `Find services in ${city}`,
    };
  }
};

export default async function Page({ params }) {
  const { city } = params;

  try {
    const response = await fetch("https://mannubhai.in/web_api/get_city_page_data.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city }),
      cache: "no-store",
    });

    const data = await response.json();

    if (data.error) {
      return notFound();
    }
console.log(data);

    return <CityPage cityData ={data} />;
  } catch (error) {
    console.error("Error fetching city page:", error);
    return notFound();
  }
}
