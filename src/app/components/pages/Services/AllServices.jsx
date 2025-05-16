// import React from 'react';
"use client"
import { useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from "react";


const serviceL = [
  //   { id: "ro-service", name: "RO Service", image: RoService },
  { id: "ac", service_name: "Air Conditioner", image: "/assets/serviceTabIcons/ac uninstalltion.webp", link: "ac" },
  { id: "washing-machine", service_name: "Washing Machine", image: "/assets/serviceTabIcons/washing machine installation.webp", link: "washing-machine-repair" },
  { id: "water-purifier", service_name: "Ro Water Purifier", image: "/assets/serviceTabIcons/ro installation.webp", link: "" },
  { id: "gyeser", service_name: "Gyeser", image: "/assets/serviceTabIcons/geyser uninstallation.webp", link: "geyser-repair" },
  { id: "refrigerator", service_name: 'Refrigerator', image: "/assets/serviceTabIcons/refrigerator installation.webp", link: "refrigerator-repair" },
  { id: "led-tv-repair", service_name: "Led", image: "/assets/serviceTabIcons/led tv reapair.webp", link: "led-tv-repair" },
  { id: "microwav-repair", service_name: "Microwave", image: "/assets/serviceTabIcons/microwave installation.webp", link: "microwav-repair" },
  { id: "vaccum-cleaner", service_name: "Vaccum Cleaner", image: "/assets/serviceTabIcons/vaccum cleaner repair service.webp", link: "vacuum-cleaner-repair" }

];

const AllServices = (cater) => {
  const { city, brand, cat } = useParams();
  const [serviceList, setserviceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToSection = (id) => {
    console.log(document.getElementById(id));

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  };

  const cate = cater.cater;

  useEffect(() => {
    let lead_type = null;
    setIsLoading(true);

    //   const cat=category;

    if (cat === "washing-machine-repair" || city === "washing-machine-repair" || cate === "washing-machine-repair") {
      lead_type = 4;
    } else if (cat === "ac" || city === "ac" || cate === "ac") {
      lead_type = 2;
    } else if (cat === "ro-water-purifier" || city === "ro-water-purifier" || cate === "ro-water-purifier") {
      lead_type = 1;
    } else if (cat === "microwav-repair" || city === "microwav-repair" || cate === "microwav-repair") {
      lead_type = 9;
    } else if (cat === "vacuum-cleaner-repair" || city === "vacuum-cleaner-repair" || cate === "vacuum-cleaner-repair") {
      lead_type = 11;
    } else if (cat === "geyser-repair" || city === "geyser-repair" || cate === "geyser-repair") {
      lead_type = 5;
    } else if (cat === "kitchen-chimney-repair" || city === "kitchen-chimney-repair" || cate === "kitchen-chimney-repair") {
      lead_type = 10;
    } else if (cat === "refrigerator-repair" || city === "refrigerator-repair" || cate === "refrigerator-repair") {
      lead_type = 6;
    } else if (cat === "led-tv-repair" || city === "led-tv-repair" || cate === "led-tv-repair") {
      lead_type = 8;
    } else if (cat === "air-purifier-repair" || city === "air-purifier-repair" || cate === "air-purifier-repair") {
      lead_type = 18;
    } else if (cat === "kitchen-cleaning-service" || city === "kitchen-cleaning-service" || cate === "kitchen-cleaning-service") {
      lead_type = 32;
    } else if (cat === "sofa-cleaning-service" || city === "sofa-cleaning-service" || cate === "sofa-cleaning-service") {
      lead_type = 29;
    } else if (cat === "pest-control" || city === "pest-control" || cate === "pest-control") {
      lead_type = 33;
    } else if (cat === "tank-cleaning" || city === "tank-cleaning" || cate === "tank-cleaning") {
      lead_type = 34;
    } else if (cat === "mason-service" || city === "mason-service" || cate === "mason-service") {
      lead_type = 39;
    } else if (cat === "house-painting" || city === "house-painting" || cate === "house-painting") {
      lead_type = 35;
    } else if (cat === "bathroom-cleaning-service" || city === "bathroom-cleaning-service" || cate === "bathroom-cleaning-service") {
      lead_type = 30;
    } else if (cat === "home-deep-cleaning-service" || city === "home-deep-cleaning-service" || cate === "home-deep-cleaning-service") {
      lead_type = 31;
    }



    const cid = localStorage.getItem('customer_id');

    fetch('https://waterpurifierservicecenter.in/customer/ro_customer/all_services.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cid: cid, lead_type: lead_type })

    })
      .then(res => res.json())
      .then(data => {
        // console.log(data.error);

        if (data.error == 'false') {
          const grouped = {};
          data.service_details.forEach(item => {
            let baseName = item.service_name;
            if (/^AMC Plan/i.test(baseName)) {
              baseName = "AMC";
            } else {
              // Remove anything inside parentheses
              baseName = baseName.replace(/\s*\(.*?\)/g, '').trim();
            }
            if (!grouped[baseName]) {
              grouped[baseName] = {
                id: item.id,
                service_name: baseName,
                image: item.image
              };
            }
          });

          const result = Object.values(grouped);
          const unique = [...new Set(result)];
          setserviceList(unique);

        } else {
          setserviceList(serviceL)
        }


        setIsLoading(false)

      }, [])


  }, [cat])

  //   const handleTabService = serviceList;
  // const names = handleTabService.map(service => 
  //   service.service_name.split(" ").slice(0, 2).join(" ") + "....."
  // );

  // console.log(names);




  return (
    <div className="w-full max-w-4xl mx-auto  ">
      <div className="bg-white rounded-lg shadow-md p-4 sticky top-10 servicePortion gap-4 ">
        <div className='flex gap-6 serviceHeading'>
          <h3 className=" font-semibold mb-0 text-center">Select a Service</h3>
          <span className='serviceHorizontal'></span>
        </div>
        {isLoading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center h-20 bg-gray-100 rounded-lg animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-full mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4">
            {serviceList.map((service) => (
              //  <Link href={`/${service.id}`} >
              <button
                title={service.service_name}
                key={service.id}
                onClick={() => scrollToSection(service.id)}
                className="flex flex-col items-center justify-center  tabCards sm:w-xs bg-gray-100 rounded-lg hover:bg-white transition-all shadow-md hover:shadow-lg border border-gray-300 hover:ring-2 hover:ring-purple-300 p-1"
              >

                <div>
                  <img
                    src={service.image}
                    alt={service.service_name}
                    className="w-11 h-auto object-contain mb-2"
                    width={44}
                    height="auto"
                    title={service.service_name}
                  />
                </div>
                {/* first convert the strings to arrays using splits then length to make it ... if more than 2  */}

                {/* Desktop version: Truncated */}
                <span className="hidden md:inline text-xs font-medium text-gray-700 text-center text-wrap">
                  {service?.service_name?.split(" ").length > 2
                    ? service.service_name.split(" ").slice(0, 2).join(" ") + "....."
                    : service.service_name}
                </span>

                {/* Mobile version: Full name */}
                <span className="inline md:hidden text-xs font-medium text-gray-700 text-center text-wrap">
                  {service.service_name}
                </span>
              </button>

            ))}
          </div>
        )}
      </div>

    </div>

  );
};

export default AllServices;