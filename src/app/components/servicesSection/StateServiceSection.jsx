import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoInstallation from '../../assets/images/serviceBrands/RoInstallation.png';
import Havels from '../../assets/images/serviceBrands/Havels.jpeg';
import AMC from '../../assets/images/AMC.jpg';
import AirPurifier from '../../assets/images/servicesImages/air cooler.png';
import Kent from '../../assets/images/serviceBrands/WaterPurifier.png';
import Refrigerator from '../../assets/images/servicesImages/refrigerator.png';
import Ac from '../../assets/images/servicesImages/ac.png';
import Geyeser from '../../assets/images/serviceBrands/geyser icon 70x70.png';
import MicroWave from '../../assets/images/servicesImages/microWave.png';
import kitchen_chimney from '../../assets/images/servicesImages/kitchen chimney.png';
import led from '../../assets/images/servicesImages/led.png';
import WashingMachine from '../../assets/images/servicesImages/washing machine.png';
// import Vaccum from '../../assets/images/serviceBrands/VaccumCleaner.jpeg';

// import Vaccum from '../../../assets/images/servicesImages/Vaccum cleaner.webp';
import Vaccum from '../../assets/images/servicesImages/vacuum cleaner.png';
import Tooltip from '@mui/material/Tooltip';
import { Info } from "@mui/icons-material";
// import Advanced from '../../assets/images/serviceBrands/Advanced.png';


function StateServiceSection() {
    const navigate = useNavigate();
    const [infoTip, setInfoTip] = useState(false);

    const handleInfoTipOpen = () => {
        setInfoTip(true);
    }

    const handleInfoTipclose = () => {
        setInfoTip(false);
    }
    const Services = [
        { id: 1, name: 'Ro Service', image: RoInstallation, info: 'Complete maintenance to keep your purifier running smoothly' },
        // { id: 2, name: 'Ro Repair', image: Havels, info: 'Quick fixes for leaks, filter issues, and performance problems' },
        // { id: 3, name: 'Ro Installation', image: PureIT, info: 'Professional setup for new water purifiers.' },
        // { id: 4, name: 'Ro Uninstallation', image: Kent, info: 'Safe removal of old or damaged RO systems' },
        // { id: 5, name: 'Amc Plans', image: AMC, info: 'Annual maintenance for hassle-free water purity.' },
        { id: 9, name: 'Washing Machine', image: WashingMachine, Info: '' },
        { id: 6, name: 'Refrigerator', image: Refrigerator, info: 'Keep your food fresh and beverages cool with our energy-efficient refrigerators, designed with advanced cooling technology and spacious interiors.' },
        { id: 7, name: 'Air Conditioners', image: Ac, info: 'Stay cool during the hottest days with our powerful and silent air conditioners. Fast cooling, energy-saving, and built for long-lasting comfort.' },
        { id: 8, name: 'Geyser', image: Geyeser, info: 'Enjoy instant hot water with our high-performance geysers. Designed for safety, durability, and efficient heating to keep your winters warm and cozy.' },
        { id: 10, name: 'Microwave', image: MicroWave, Info: '' },
        { id: 11, name: 'Led ', image: led, Info: '' },
        { id: 12, name: 'kitchen Chimney', image: kitchen_chimney, Info: '' },
        { id: 13, name: 'Air Purifier', image: AirPurifier, Info: '' },
        { id: 14, name: 'Vaccum Cleaner', image: Vaccum, Info: '' }


    ]
    // const handleServiceClick = (serviceName) => {
    //     // Convert service name to a category ID that matches your ServicesList categories
    //     let categoryId = '';

    //     if (serviceName === 'Ro Service') {
    //         categoryId = 'ro-service';
    //     } 
    //     // else if (serviceName === 'Ro Installation') {
    //     //     categoryId = 'ro-installation';
    //     // }
    //     // else if (serviceName === 'Ro Uninstallation') {
    //     //     categoryId = 'ro-installation';
    //     // }

    //     // else if (serviceName === 'Amc Plans') {
    //     //     categoryId = 'Ro-Amc';
    //     // }




    //      else {
    //         // Create a slug from the service name for other services
    //       if(!WashingMachine){
    //         categoryId = serviceName.toLowerCase().replace(/\s+/g, '-');

    //         console.log('hello');

    //       }

    //       else if(serviceName === 'Washing Machine')
    //         {
    //            categoryId = '';

    //            console.log('hello2');
    //            // categoryId=serviceName;
    //            navigate('/service/Washing-service');

    //         }
    //     }

    //     // Navigate to services page with the category ID as a parameter
    //     navigate(`/service/ro-service?category=${categoryId}`);
    // };

    const handleServiceClick = (serviceName) => {
        let categoryId = '';

        if (serviceName === 'Ro Service') {
            categoryId = 'ro-service';
            navigate(`/service/ro-service?category=${categoryId}`);
        }
        // Add other RO-related service checks here if needed
        else if (serviceName === 'Washing Machine') {
            // Go to Washing Machine service page
            console.log('Navigating to Washing Service');
            navigate('/service/Washing-service');
        }
        else {
            // Default case for other services, use slugified name
            categoryId = serviceName.toLowerCase().replace(/\s+/g, '-');
            console.log(`Navigating to generic service: ${categoryId}`);
            navigate(`/service/${categoryId}?category=${categoryId}`);
        }
    };

    return (
        <div className="">
            <h3 className="serviceHeadings">We've Got Mumbai Covered – Explore Our Services!</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5  servicesHero">
                {Services.map((Service) => (
                    <div key={Service.id} className="flex items-center flex-col serviceSectionn relative" onClick={() => handleServiceClick(Service.name)}>
                        <div className="imgSection">
                            <img
                                src={Service.image}
                                alt={Service.name}
                                className="serviceImg w-28 h-28"
                            />
                        </div>

                        <p className="text-2xs text-wrap mb-1 serviceSectionName"><b>{Service.name}</b></p>

                        {/* <div className=""><button className="bookNowBtn">Book Now</button></div> */}
                        {/* <span className="text-center text-gray-400 infoSpan">{Service.info}</span> */}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default StateServiceSection;