'use client';

import React, { useState } from "react";
import Link from "next/link";


function ServiceSection() {
   
    const [showAllServices, setShowAllServices] = useState(false);

    const Services = [
        { id: 1, name: 'Ro Service', image: "/assets/images/serviceBrands/RoInstallation.png", info: 'Complete maintenance to keep your purifier running smoothly',link:"ro-water-purifier" },
        { id: 9, name: 'Washing Machine', image: "/assets/images/servicesImages/washing machine.png", info: '',link:"washing-machine-repair" },
        { id: 6, name: 'Refrigerator', image: "/assets/images/servicesImages/refrigerator.png", info: 'Keep your food fresh and beverages cool with our energy-efficient refrigerators, designed with advanced cooling technology and spacious interiors.',link:"refrigerator-repair" },
        { id: 7, name: 'Air Conditioners', image: "/assets/images/servicesImages/ac.png", info: 'Stay cool during the hottest days with our powerful and silent air conditioners. Fast cooling, energy-saving, and built for long-lasting comfort.',link:"ac" },
        { id: 8, name: 'Geyser', image: "/assets/images/serviceBrands/geyser icon 70x70.png", info: 'Enjoy instant hot water with our high-performance geysers. Designed for safety, durability, and efficient heating to keep your winters warm and cozy.',link:"geyser-repair" },
        { id: 10, name: 'Microwave', image: "/assets/images/servicesImages/microWave.png", info: '',link:"microwav-repair" },
        { id: 11, name: 'Led', image: "/assets/images/servicesImages/led.png", info: '',link:"ac" },
        { id: 12, name: 'kitchen Chimney', image: "/assets/images/servicesImages/kitchen chimney.png", info: '',link:"kitchen-chimney-repair" },
        { id: 13, name: 'Air Purifier', image: "/assets/images/servicesImages/air cooler.png", info: '',link:"" },
        { id: 14, name: 'Vaccum Cleaner', image: "/assets/images/servicesImages/vacuum cleaner.png", info: '',link:"" }
    ];


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
                       
                    >
                       
                       <Link href={`/${Service.link}`} className="text-black">  <div className="imgSection">
                            <img
                                src={Service.image}
                                alt={Service.name}
                                className="serviceImg w-28 h-28"
                            />
                        </div>
                           <p className="text-2xs text-wrap mb-1 text-center serviceSectionName text-black"><b>{Service.name}</b></p></Link> 
                       
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