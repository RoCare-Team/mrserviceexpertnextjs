'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";


function ServiceSection() {
    const navigate=useRouter();
    const [showAllServices, setShowAllServices] = useState(false);

    const Services = [
        { id: 1, name: 'Ro Service', image: "assets/images/serviceBrands/RoInstallation.png", info: 'Complete maintenance to keep your purifier running smoothly' },
        { id: 9, name: 'Washing Machine', image: "assets/images/servicesImages/washing machine.png", info: '' },
        { id: 6, name: 'Refrigerator', image: "assets/images/servicesImages/refrigerator.png", info: 'Keep your food fresh and beverages cool with our energy-efficient refrigerators, designed with advanced cooling technology and spacious interiors.' },
        { id: 7, name: 'Air Conditioners', image: "assets/images/servicesImages/ac.png", info: 'Stay cool during the hottest days with our powerful and silent air conditioners. Fast cooling, energy-saving, and built for long-lasting comfort.' },
        { id: 8, name: 'Geyser', image: "assets/images/serviceBrands/geyser icon 70x70.png", info: 'Enjoy instant hot water with our high-performance geysers. Designed for safety, durability, and efficient heating to keep your winters warm and cozy.' },
        { id: 10, name: 'Microwave', image: "assets/images/servicesImages/microWave.png", info: '' },
        { id: 11, name: 'Led', image: "assets/images/servicesImages/led.png", info: '' },
        { id: 12, name: 'kitchen Chimney', image: "assets/images/servicesImages/kitchen chimney.png", info: '' },
        { id: 13, name: 'Air Purifier', image: "assets/images/servicesImages/air cooler.png", info: '' },
        { id: 14, name: 'Vaccum Cleaner', image: "assets/images/servicesImages/vacuum cleaner.png", info: '' }
    ];

    const handleServiceClick = (serviceName) => {
        let categoryId = '';

        if (serviceName === 'Ro Service') {
            categoryId = 'ro-service';
            navigate.push(`/service/ro-service?category=${categoryId}`);
        }
        else if (serviceName === 'Washing Machine') {
            console.log('Navigating to Washing Service');
            navigate.push('/service/Washing-service');
        }
        else {
            categoryId = serviceName.toLowerCase().replace(/\s+/g, '-');
            console.log(`Navigating to generic service: ${categoryId}`);
            navigate.push(`/service/${categoryId}?category=${categoryId}`);
        }
    };

    // Toggle function to show/hide all services
    const toggleAllServices = (e) => {
        e.preventDefault();
        setShowAllServices(!showAllServices);
    };

    return (
        <div className="">
            <h3 className="serviceHeadings">Explore Our Services</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 servicesHero">
                {Services.map((Service) => (
                    <div
                        key={Service.id}
                        className={`flex items-center flex-col serviceSectionn relative ${
                            !showAllServices && Service.id > 10 ? 'hidden sm:flex' : ''
                        }`}
                        onClick={() => handleServiceClick(Service.name)}
                    >
                        <div className="imgSection">
                            <img
                                src={Service.image}
                                alt={Service.name}
                                className="serviceImg w-28 h-28"
                            />
                        </div>
                        <p className="text-2xs text-wrap mb-1 serviceSectionName"><b>{Service.name}</b></p>
                    </div>
                ))}
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

export default ServiceSection;