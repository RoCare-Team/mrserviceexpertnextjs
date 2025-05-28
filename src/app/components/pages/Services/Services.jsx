"use client"
import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import PhoneVerification from "../../PhoneVerification/PhoneVerification";
import { toast } from "react-toastify";
import Link from "next/link";
import { useParams } from "next/navigation";

// Updated serviceCategories to match the Tabs component
// const serviceCategories = [

//     // RO Water Purifier, Air Conditioner, Washing Machine, then Other Services (Geyser, Microwave, Refrigerator, LED TV )
//     // { id: "ro-service", name: "RO Service", showImage: true },
//     { id: "ac", name: "Air Conditioner", showImage: true },
//     { id: "washing-machine", name: "Washing Machine", showImage: true },
//     { id: "water-purifier", name: "Water Purifier", showImage: true },
//     { id: "gyeser", name: "Gyeser", showImage: true },
//     { id: "refrigerator", name: 'Refrigerator', showImage: true },
//     { id: "microwav-repair", name: "Microwave", showImage: true },
//     { id: "vaccum-cleaner", name: "Vaccum Cleaner", showImage: true },
//     { id: "led-tv-repair", name: "Led", showImage: true }
// ];

const serviceCategories = [
    { id: "water-purifier", name: "RO Water Purifier", showImage: true }, 
    { id: "ac", name: "Air Conditioner", showImage: true },
    { id: "washing-machine", name: "Washing Machine", showImage: true },
    { id: "gyeser", name: "Geyser", showImage: true }, 
    { id: "microwav-repair", name: "Microwave", showImage: true },
    { id: "refrigerator", name: 'Refrigerator', showImage: true },
    { id: "led-tv-repair", name: "LED TV", showImage: true }, 
    { id: "vaccum-cleaner", name: "Vacuum Cleaner", showImage: true }, 
];

const Services = () => {

    const [showModal, setShowModal] = useState(false);
    const { city } = useParams();

    // const [city_name,setCity]
    const services = [

        {
            id: 1,
            name: " Ro Water Purifier",
            category: "water-purifier",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/ro repair service.webp",
            link: 'ro-water-purifier',
            briefInfo: [
                "Cleaning of Machine and Filters",
                "Complete Water Purifier Checkup",
                "Price include visit & diagnosis charges",
                "Filter / Spare Parts Rate applicable as per rate card",
                "Annual maintenance plan for your RO covering routine services, filters and membrane.",
                "Include (service, repair, filter, membrane, electric part)",
                "Service Within 24 Hour"
            ]
        },
        {
            id: 2,
            name: "Vaccum Cleaner",
            category: "vaccum-cleaner",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/vaccum cleaner repair service.webp",
            link: 'vacuum-cleaner-repair',
            briefInfo: [
                "Vacuum Cleaner Repair & Maintenance",
                "Vacuum Cleaner Diagnostic Service",
                "Vacuum Cleaning Machine Servicing",
                "Service Within 24 Hour"
            ]
        },
        {
            id: 3,
            name: "Air Conditioner",
            category: "ac",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/ac repair and service.webp",
            link: 'ac',
            briefInfo: [
                "Pre-service checks",
                "Complete AC check-up, including cooling gas level check",
                "Indoor unit cleaning",
                "Foam & jet spray cleaning of filters, coils, fins & tray. AC is covered to prevent spillage.",
                "Outdoor unit cleaning",
                "The outer unit is dismantled & cleaned with a jet spray (if easily accessible)",
                "Warranty activation",
                "AC gets 10 days warranty automatically after service",
                "Service Within 24 Hour"
            ]
        },
        {
            id: 4,
            name: "Gyeser",
            category: "gyeser",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/geyser repair service.webp",
            link: 'geyser-repair',
            briefInfo: [
                "Visitation fee will be adjusted in the final repair quote",
                "Geyser check-up",
                "Exterior & interior cleaning with descaling of the geyser",
                "We do not service gas geysers",
                "Geyser Installation",
                "Geyser unInstallation",
                "Service Within 24 Hour",
            ]
        },
        {
            id: 5,
            name: "Washing Machine",
            category: "washing-machine",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/washing machine repair & service.webp",
            link: 'washing-machine-repair',
            briefInfo: [
                "Automatic top load machine check-up",
                "Visitation fee will be adjusted in the final repair quote",
                "automatic top load machine check-up",
                "Semi-automatic machine check-up",
                "Installation & uninstallation",
                "Service Within 24 Hour"
            ]
        },
        {
            id: 6,
            name: "Refrigerator",
            category: "refrigerator",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/refrigerator repair service.webp",
            link: 'refrigerator-repair',
            briefInfo: [
                "Single door refrigerator check-up",
                "Double door refrigerator check-up (inverter)",
                "Double door refrigerator check-up (non-inverter)",
                "Side-by-side door refrigerator check-up",
                "Visitation fee will be adjusted in the final repair quote",
                "Service Within 24 Hour"
            ]
        },
        {
            id: 7,
            name: "Kitchen Chimney",
            category: "kitchen-chimney",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/kitchen chimney installaiton.webp",
            link: 'kitchen-chimney-repair',
            briefInfo: "Routine maintenance to ensure optimal performance of your RO system. This includes cleaning filters, checking for leaks, and assessing water quality."
        }
        ,
        {
            id: 8,
            name: "Microwave",
            category: "microwav-repair",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/microwave installation.webp",
            link: 'microwav-repair',
            briefInfo: [
                "Not heating",
                "Not working",
                "Buttons not working",
                "Noise issue",
                "Service Within 24 Hour"
            ]
        }, {
            id: 9,
            name: "Led",
            category: "led-tv-repair",
            reviews: 52,
            rating: 4.77,
            image: "/assets/serviceTabIcons/led tv reapair.webp",
            link: 'led-tv-repair',
            briefInfo: [
                "Television Service Evaluation",
                "TV Performance Check",
                "TV Repair Check",
                "Smart TV Maintenance",
                "TV installation",
                "TV uninstallation",
                "Service Within 24 Hour"
            ]
        }
    ];


    return (
        <div className="services-list">

            {serviceCategories.map(({ id, title, showImage }) => {
                const filteredServices = services.filter((s) => s.category === id);


                if (filteredServices.length === 0) return null;

                return (
                    <div key={id} id={id} className="common-service-style ">
                        {/* <h1>{title}</h1> */}
                        {filteredServices.map((service) => {
                            return (
                                <div className="servicePortionDetails flex-col" key={service.id}>
                                    <div className="flex serviceWiseContainer">
                                        <div className="serviceDetails">

                                            <h3 className="serviceVarities"><b>{service.name}</b></h3>
                                            <div>
                                                <span className="serviceReview">
                                                    <FontAwesomeIcon icon={faStar} /> {service.rating} ({service.reviews}k reviews)
                                                </span>
                                                <div className="dashedLine"></div>
                                            </div>
                                        </div>
                                        <div className="serviceImgContainer">
                                            {showImage && service.image && (
                                                <div className="serviceDetailsImg mb-0.5">
                                                    <img src={service.image} alt={service.name} height={72} width={72} />
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
                                    <ul className="briefInfo2 list-disc ml-5">
                                        {Array.isArray(service.briefInfo) ? (
                                            service.briefInfo.map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))
                                        ) : (
                                            <li>{service.briefInfo}</li>
                                        )}
                                    </ul>

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