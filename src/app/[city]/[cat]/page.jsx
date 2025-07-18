// app/[city]/[cat]/page.tsx
import ServicePage from "@/app/components/pages/Services/ServicePage";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound } from 'next/navigation';

// export async function generateMetadata({ params }) {
//   const { city, cat } = params;
//   return {
//     title: `Service in ${city} - ${cat} | Your Brand`,
//     description: `Find the best ${cat} services in ${city}. Book now!`,
//   };
// }

export async function generateMetadata({ params }) {
  const { city, cat } = await params;

  const response = await fetch('https://mannubhai.in/web_api/get_page_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, cat }),
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
    // making the cities  and category_services empty as right now getting different description which is not good for seo purposes
    data.cities = [];
    data.category_services = [];

    if (data.related_cities && Array.isArray(data.related_cities)) {
      data.related_cities = data.related_cities.map(city => ({
        id: city.id,
        city_id: city.city_id,
        parent_city: city.parent_city,
        url: city.url,
        city_name: city.city_name,
        city_url: city.city_url,
      }));
    }

    // console.log(data);

    // const filteredServices = data?.services?.filter(service =>
    //   service.category_name?.toLowerCase().replace(/\s+/g, '-') === cat?.toLowerCase()
    // );
    // data.services = filteredServices;
{/*  */}
    return <>
    <ServicePage pagedata={data} city={city} cat={cat} />
    {data.related_cities?.length > 0 && (
  <div className="bg-white px-8 py-6">
    <details className="group bg-gray-50 rounded-lg shadow p-4 open:shadow-md transition">
      <summary className="text-sm md:text-xl font-bold cursor-pointer list-none flex justify-between items-center">
        <span>Popular Cities Near Me</span>
        <span className="text-lg group-open:rotate-180 transition-transform duration-300 text-purple-300">▼</span>
      </summary>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.related_cities.map((city) => (
          <div className="brandsServices" key={city.id}>
            <a
              href={`/${city.city_url}/${cat}`}
              title={`${city.city_name} ${cat} services`}
            >
              <li className=" text-gray-500 list-none">
                <FontAwesomeIcon icon={faLocation}/> {city.city_name},
                <span></span>
              </li>
            </a>
          </div>
        ))}
      </div>
    </details>

    
  </div>

  
)}

{  city==="bangalore"&&cat=="ro-water-purifier" && (
  <div className="common-spacing">
    
 <div className="px-4 py-3">
      <h2 className="text-[17px] font-semibold mb-1">
        Bangalore’s Top Rated RO Service Provider – Mr Service Expert
      </h2>
      <details className="text-gray-700">
        <summary className="cursor-pointer text-blue-600 font-medium">
          Read More
        </summary>
        <p className="mt-1">
          Searching for the best RO service in Bangalore? Do you want a friendly and professional service that looks after the health and safety of your family by delivering safe and pure water?
          We welcome you on board Mr Service Expert and we assure you of being your trusted assistant for water purifier servicing in Bangalore. Whether it is an enquiry for “RO service near me,” “RO repair near me,” or best AMC service for the water purifier, our specialists are always available to give prompt and economical services at your convenience.
        </p>
      </details>
    </div>

    <div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Why Choose Mr Service Expert in Bangalore
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      <p>
        For the well-being of your family, one needs to pay extra attention while selecting an RO service provider. Here is what makes Mr Service Expert stand out in Bangalore and why he is the go-to person for water purifiers for his serviced clients.
      </p>

      <div>
        <h3 className="font-semibold">Experienced and Certified Technicians</h3>
        <ul className="list-disc list-inside">
          <li>Our team comprises vetted professionals who are skilled, trained, and have undergone background checks.</li>
          <li>Technicians are capable of handling different brands and types of water purifiers.</li>
          <li>Regular instruction and refresher courses ensure they stay updated with modern tools and techniques.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Fast Response and Doorstep Service in Bangalore</h3>
        <ul className="list-disc list-inside">
          <li>We respond quickly to service requests across Bangalore.</li>
          <li>We ensure each customer gets precise and timely attention.</li>
          <li>Clean drinking water is essential, and we aim to eliminate any service delays.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">No Hidden Charges and Transparent Pricing</h3>
        <ul className="list-disc list-inside">
          <li>Our pricing is upfront and fair for all services like repair, installation, uninstallation, and AMC.</li>
          <li>No additional or undisclosed charges are ever added.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Complaints Regarding Mr Service Expert – RO Service in Bangalore</h3>
        <ul className="list-disc list-inside">
          <li>We use branded spare parts to ensure durability and efficiency.</li>
          <li>This gives customers peace of mind and long-term reliability.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Customer-Centric Approach</h3>
        <ul className="list-disc list-inside">
          <li>Every solution is tailored to the individual needs of the customer.</li>
          <li>We ensure affordability without compromising service quality.</li>
        </ul>
      </div>
    </div>
  </details>
</div>

<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Your Top Choice for RO Service – Benefits of Selecting Mr Service Expert
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      
      <div>
        <h3 className="font-semibold">Assured Water Purity</h3>
        <ul className="list-disc list-inside">
          <li>We ensure complete protection from heavy metals, microorganisms, and harmful contaminants.</li>
          <li>Regular servicing supports this claim and maintains water quality.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Enhanced Appliance Longevity</h3>
        <ul className="list-disc list-inside">
          <li>Timely repair and proactive maintenance prevent major breakdowns.</li>
          <li>Saves long-term costs on expensive repairs.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Improved Energy and Water Efficiency</h3>
        <ul className="list-disc list-inside">
          <li>Clean filters help the RO use less electricity and reduce water wastage.</li>
          <li>Overall, better efficiency and lower utility bills.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Easy Service Booking</h3>
        <ul className="list-disc list-inside">
          <li>Services can be booked online, through phone calls, or simply by searching RO service near me.</li>
          <li>Always available and within reach.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Comprehensive AMC Plans</h3>
        <ul className="list-disc list-inside">
          <li>Annual Maintenance Contracts cover maintenance, emergency repairs, and filter replacements.</li>
          <li>Offers seamless service and prevents sudden failures.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">All Leading Brands Covered</h3>
        <ul className="list-disc list-inside">
          <li>We service top brands like Kent, Aquaguard, AO Smith, Pureit, Livpure, and many others.</li>
          <li>Brand-agnostic service ensures quality work across all types of RO systems.</li>
        </ul>
      </div>

    </div>
  </details>
</div>


<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Mr Service Expert RO Services in Bangalore
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      <p>
        With us, every customer is unique, and we provide customized service packages to match each need.
      </p>

      <div>
        <h3 className="font-semibold">RO Installation and Uninstallation Service Bangalore</h3>
        <ul className="list-disc list-inside">
          <li>For relocations or system upgrades, our technicians offer hassle-free installation and removal across all brands.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Routine RO Service and Maintenance</h3>
        <ul className="list-disc list-inside">
          <li>Filter and component cleaning</li>
          <li>Tank sanitization</li>
          <li>Leak detection</li>
          <li>Flow rate checks</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">RO Water Purifier Repair Service</h3>
        <ul className="list-disc list-inside">
          <li>Facing low water flow, leakage, bad taste, or error messages?</li>
          <li>Our local technicians reach your home within hours for urgent repairs.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Filter and Membrane Replacement</h3>
        <ul className="list-disc list-inside">
          <li>We use genuine filters and membranes only to maintain top performance of your RO system.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Annual Maintenance Contracts (AMC)</h3>
        <ul className="list-disc list-inside">
          <li>Customizable packages with scheduled check-ups and replacements.</li>
          <li>Includes priority support and keeps the system in optimal condition.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Testing Water Quality</h3>
        <ul className="list-disc list-inside">
          <li>Not sure if your water is safe?</li>
          <li>Our experts test water quality and recommend suitable purification solutions for homes and businesses.</li>
        </ul>
      </div>
    </div>
  </details>
</div>

<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    What Bangalore Residents Need to Know About Regular RO Servicing
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      <p>
        Water supply in Bangalore may be contaminated with heavy metals, chemicals, and harmful microbes. Without regular servicing, your RO system can become a health hazard.
      </p>

      <div>
        <h3 className="font-semibold">Avoid Waterborne Diseases</h3>
        <ul className="list-disc list-inside">
          <li>Dirty filters cause bacteria and virus growth.</li>
          <li>This can affect children’s health and cause nutritional issues.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Restore Water Taste and Smell</h3>
        <ul className="list-disc list-inside">
          <li>Old filters can spoil taste and add odor.</li>
          <li>Regular cleaning restores freshness and ensures clean-tasting water.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Minimize Complete Failures</h3>
        <ul className="list-disc list-inside">
          <li>Small issues, if ignored, can lead to major breakdowns.</li>
          <li>Routine servicing detects problems early and avoids costly repairs.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Enhance Efficiency</h3>
        <ul className="list-disc list-inside">
          <li>Well-maintained systems use less electricity and save water.</li>
          <li>This reduces your monthly utility bills.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Protect Your Warranty</h3>
        <ul className="list-disc list-inside">
          <li>Professional servicing helps maintain manufacturer warranty coverage.</li>
          <li>Your investment remains safe.</li>
        </ul>
      </div>
    </div>
  </details>
</div>


<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Mr Service Expert Provides RO Water Purifier Repair Service for All Brands
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      <p>
        No matter what brand you use, Mr Service Expert is the trusted service partner in Bangalore.
      </p>

      <div>
        <h3 className="font-semibold">Brands We Service</h3>
        <ul className="list-disc list-inside">
          <li>Kent</li>
          <li>Aquaguard</li>
          <li>AO Smith</li>
          <li>Eureka Forbes</li>
          <li>Pureit</li>
          <li>Livpure</li>
          <li>Blue Star</li>
          <li>LG</li>
          <li>Doctor Fresh</li>
          <li>And many more</li>
        </ul>
      </div>

      <p>
        All our professionals are trained to handle multiple brands, ensuring top-quality service every time.
      </p>
    </div>
  </details>
</div>

<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    How to Book RO Service Near You in Bangalore
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">
      <p>
        Booking a service with Mr Service Expert is easy and fast.
      </p>

      <div>
        <h3 className="font-semibold">Call or Book Online</h3>
        <ul className="list-disc list-inside">
          <li>Contact our helpline or fill out the online booking form.</li>
          <li>We respond promptly to every request.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Instant Confirmation</h3>
        <ul className="list-disc list-inside">
          <li>Once booked, you get confirmation and a technician is assigned.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Doorstep Service at Scheduled Time</h3>
        <ul className="list-disc list-inside">
          <li>Our technician arrives on time and carries out full inspection and service.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Payment and Feedback</h3>
        <ul className="list-disc list-inside">
          <li>Pay via cash or online payment options.</li>
          <li>Share your feedback to help us improve.</li>
        </ul>
      </div>
    </div>
  </details>
</div>

<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Why Mr Service Expert is Bangalore’s Most Trusted RO Service Provider
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1 space-y-4">

      <div>
        <h3 className="font-semibold">High Customer Ratings</h3>
        <ul className="list-disc list-inside">
          <li>Consistent 4.9+ rating for professionalism, punctuality, and fair pricing.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Wide Service Network</h3>
        <ul className="list-disc list-inside">
          <li>We cover all localities and areas in Bangalore.</li>
          <li>Fast and reliable servicing guaranteed.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Selfless Service Policy</h3>
        <ul className="list-disc list-inside">
          <li>We respect your time and take your feedback seriously.</li>
          <li>Continuous improvement is our goal.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Affordable AMC and Repair Plans</h3>
        <ul className="list-disc list-inside">
          <li>Service packages available for every budget.</li>
          <li>No compromise on quality or performance.</li>
        </ul>
      </div>

    </div>
  </details>
</div>

<div className="px-4 py-3">
  <h2 className="text-[17px] font-semibold mb-1">
    Mr Service Expert – Your Household Name for RO Services in Bangalore
  </h2>
  <details className="text-gray-700">
    <summary className="cursor-pointer text-blue-600 font-medium">
      Read More
    </summary>
    <div className="mt-1">
      <p>
        Mr Service Expert is your household name for all RO services in Bangalore. From regular maintenance and emergency repairs to cost-effective AMC plans, we ensure clean, pure water and peace of mind for every customer.
      </p>
      <p className="mt-1">
        With us, you no longer need to worry about “RO repair near me” or “RO service near me.” Book your service today and experience hassle-free, expert care.
      </p>
    </div>
  </details>
</div>

  </div>
)

  
}

    

    </> ;
  } catch (error) {
    // console.error('Error fetching city page:', error);
    notFound(); // if API fails or wrong city, go to 404
  }

}