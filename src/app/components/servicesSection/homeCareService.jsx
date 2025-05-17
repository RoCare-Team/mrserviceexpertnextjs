'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";


function HomeCareService() {
    const [showAllServices, setShowAllServices] = useState(false);
    const urlPath = usePathname();
//    console.log(urlPath+'current');
    
    const Services = [
        { id: 1, name: 'Kitchen Cleaning', image: "/assets/HomeCare/KITCHEN-CLEANING.webp", info: 'Complete maintenance to keep your purifier running smoothly', link: "kitchen-cleaning-service" },
        { id: 9, name: 'Home Deep Cleaning', image: "/assets/HomeCare/HOME-DEEP-CLEANING.webp", info: '', link: "home-deep-cleaning-service" },
        { id: 6, name: 'House Painting', image: "/assets/HomeCare/PAINTER.webp", info: 'Keep your food fresh and beverages cool with our energy-efficient refrigerators, designed with advanced cooling technology and spacious interiors.', link: "house-painting" },
        { id: 7, name: 'Bathroom Cleaning', image: "/assets/HomeCare/BATHROOM-CLEANING.webp", info: 'Stay cool during the hottest days with our powerful and silent air conditioners. Fast cooling, energy-saving, and built for long-lasting comfort.', link: "bathroom-cleaning-service" },
        { id: 8, name: 'Sofa Cleaning', image: "/assets/HomeCare/SOFA-CLEANING.webp", info: 'Enjoy instant hot water with our high-performance geysers. Designed for safety, durability, and efficient heating to keep your winters warm and cozy.', link: "sofa-cleaning-service" },
        { id: 10, name: 'Tank Cleaning', image: "/assets/HomeCare/TANK-CLEANING.webp", info: '', link: "tank-cleaning" },
        { id: 11, name: 'Mason Service', image: "/assets/HomeCare/masons.webp", info: '', link: "mason-service" },
        { id: 12, name: 'Pest Control', image: "/assets/HomeCare/PEST-CONTROL.webp", info: '', link: "pest-control" },
    ];

    // const is_city_url = urlPath;
    // console.log(is_city_url);
    // Toggle function to show/hide all services
    const toggleAllServices = (e) => {
        e.preventDefault();
        setShowAllServices(!showAllServices);
    };

    return (
        <div className="">
            <h3 className="serviceHeadings ">Home Care Services</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 servicesHero">
                {Services.map((Service) => {
                    // const href = is_city_url ? `${urlPath}/${Service.link}` : `/${Service.link}`;
                    const basePath = urlPath === "/" ? "" : urlPath;
    const href = `${basePath}/${Service.link}`;
                    return (
                        <div
                            key={Service.id}
                            className={`flex items-center flex-col serviceSectionn relative ${!showAllServices && Service.id > 10 ? 'hidden sm:flex' : ''
                                }`}
                        >
                            <Link href={href} className="text-black">
                                <div className="imgSection">
                                    <img
                                        src={Service.image}
                                        alt={`${Service.name} services`}
                                        title={`${Service.name} services`}
                                        className="serviceImg w-28 h-28"
                                        height="auto"
                                        width={128}
                                    />
                                </div>
                                <p className="text-2xs text-wrap mb-1 text-center serviceSectionName text-black">
                                    <b>{Service.name}</b>
                                </p>
                            </Link>
                        </div>
                    );
                })}

            </div>
            <div className="text-center mt-4 mb-4 block sm:hidden">
                <button
                    className="text-white  view-btn-style font-medium px-4 py-2 border border-purple-300  bg-purple-700 "
                    onClick={toggleAllServices}
                >
                    {showAllServices ? "Show Less Services" : "View All Services"}
                </button>
            </div>
        </div>
    );
}

export default HomeCareService;