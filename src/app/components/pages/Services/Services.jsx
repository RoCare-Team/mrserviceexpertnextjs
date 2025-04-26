import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import PhoneVerification from "../../PhoneVerification/PhoneVerification";
import { toast } from "react-toastify";
import Link from "next/link";
import { useParams } from "next/navigation";






// Updated serviceCategories to match the Tabs component
const serviceCategories = [
    { id: "ro-service", name: "RO Service", showImage: true },
    { id: "ac", name: "Air Conditioner", showImage: true },
    { id: "washing-machine", name: "Washing Machine", showImage: true },
    { id: "water-purifier", name: "Water Purifier", showImage: true },
    { id: "gyeser", name: "Gyeser", showImage: true },
    { id: "refrigerator", name: 'Refrigerator', showImage: true },
    { id: "microwav-repair", name: "Microwave", showImage: true },
    { id: "vaccum-cleaner", name: "Vaccum Cleaner", showImage: true }
];



const Services = () => {

    const [showModal, setShowModal] = useState(false);
  
    const {city}=useParams();
    // const [city_name,setCity]

    const services = [
        
        {
            id: 1,
            name: "Water Purifier",
            
            category: "water-purifier",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'ro-water-purifier',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 2,
            name: "Vaccum Cleaner",
            
            category: "vaccum-cleaner",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'vacuum-cleaner-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 3,
            name: "Air Conditioner",
            
            category: "ac",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'ac',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 4,
            name: "Gyeser",
            
            category: "gyeser",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'geyser-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 5,
            name: "Washing Machine",
            
            category: "washing-machine",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'washing-machine-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 6,
            name: "Refrigator",
            
            category: "refrigerator",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'refrigerator-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        },
        {
            id: 7,
            name: "Kitchen Chimney",
            category: "kitchen-chimney",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'kitchen-chimney-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        }
        ,
        {
            id: 8,
            name: "Microwave",
            category: "microwav-repair",
            reviews: 57,
            rating: 4.8,
            image: "/assets/images/serviceListImages/ro service.webp",
            link: 'microwav-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        }
    ];


    return (
        <div className="services-list">

            {serviceCategories.map(({ id, title, showImage }) => {
                const filteredServices = services.filter((s) => s.category === id);

               
                if (filteredServices.length === 0) return null;

                return (
                    <div key={id} id={id} className="common-service-style ">
                        <h2>{title}</h2>
                        {filteredServices.map((service) => {
                           

                            return (
                                <div className="servicePortionDetails flex-col" key={service.id}>
                                    <div className="flex serviceWiseContainer">
                                        <div className="serviceDetails">

                                            <h3 className="serviceVarities">{service.name}</h3>
                                            <div>
                                                <span className="serviceReview">
                                                    <FontAwesomeIcon icon={faStar} /> {service.rating} ({service.reviews} reviews)
                                                </span>
                                                <div className="dashedLine"></div>
                                                
                                            </div>
                                        </div>
                                        <div className="serviceImgContainer">
                                            {showImage && service.image && (
                                                <div className="serviceDetailsImg mb-0.5">
                                                    <img src={service.image} alt={service.name} />
                                                </div>
                                            )}
                                            <div className=" ">
                                                <Link href={`/${city}/${service.link}`}>
                                                    <button className="bg-violet-300 px-2 py-1.5">
                                                        View
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <li className="briefInfo2">
                                        {service.briefInfo || `High-quality ${service.name} services for a hassle-free experience.`}
                                    </li>
                                </div>
                            );
                        })}
                        <hr className="my-2 border-gray-300" />
                    </div>
                );
            })}
            <PhoneVerification setShowModal={setShowModal} showModal={showModal} />

        </div>
    );
};

export default Services;