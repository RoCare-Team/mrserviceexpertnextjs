import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElectImg from '../../assets/images/electronic.svg';
import DeliveryMan from '../../assets/images/deliveryMan.svg'
import leftArrow from '../../assets/images/leftArrow.svg';
import rightArrow from '../../assets/images/rightArrow.svg';
import Pureit from '../../assets/images/All Logos/unilever pure.webp';
import RkAqua from '../../assets/images/BrandLogos/rkAqua.jpg';
import TataSwach from '../../assets/images/All Logos/tata swach.webp';
import Philips from '../../assets/images/All Logos/philips logo.webp';
import Mi from '../../assets/images/All Logos/mi.webp';
import RoInstallation  from '../../assets/images/serviceBrands/RoInstallation.png';
import WaterPurifier from '../../assets/images/serviceBrands/WaterPurifier.png';
import AMC from '../../assets/images/AMC.jpg';
import BlueMount from '../../assets/images/All Logos/bluemount.webp';


const services = [
  { id: 1, name: 'Blue Mount ', image: BlueMount },
  { id: 2, name: 'Aqua Fresh', image: RkAqua },
  { id: 3, name:'water purifier',image:WaterPurifier},
  { id: 4, name: 'RO Services', image: RoInstallation },
  { id: 5, name: 'Pure Kite Services', image: Pureit },
  { id: 6, name: 'RO Installation Services', image: RoInstallation},
  { id: 7,name: 'RO AMC Plans Services', image: AMC },
  { id: 8, name: 'ZeroB Ro', image:DeliveryMan },
  { id: 9, name: 'Tata Swach', image: TataSwach },
  { id: 10, name: 'Kent RO', image: DeliveryMan },
  { id: 11, name: 'RK Aquafresh Services', image: ElectImg },
  { id: 12, name: 'RO AMC Plans Services', image: DeliveryMan},
  { id: 13, name: 'Nasaka Service', image: ElectImg },
  { id: 14, name: 'Pureit Services', image: Pureit },
  { id: 15, name: 'Mi', image: Mi },
  {id:16,name:'Philips',image:Philips},
];

function ServiceSlider() {
  const navigate =useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = 8; // Number of items to show at once
  
  // Calculate the last possible starting index
  const lastIndex = services.length - itemsToShow;
  
  const handlePrev = () => {
    setCurrentIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : 0
    );
  };
  
  const handleNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex < lastIndex ? prevIndex + 1 : lastIndex
    );
  };

 
  const handleServiceClick = (serviceName) => {
    // Convert service name to a category ID that matches your ServicesList categories
    let categoryId = '';
    
    if (serviceName === 'RO Services') {
      categoryId = 'ro-service';
    } else if (serviceName === 'RO Installation Services') {
      categoryId = 'ro-installation';
    } else if (serviceName === 'RO AMC Plans Services') {
      categoryId = 'Ro-Amc';
    } else {
      // Create a slug from the service name for other services
      categoryId = serviceName.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Navigate to services page with the category ID as a parameter
    navigate(`/service?category=${categoryId}`);
  };
  
  // Get the visible services based on current index
  const visibleServices = services.slice(
    currentIndex, 
    currentIndex + itemsToShow
  );

  return (
    <div className="imgSlider relative flex items-center">
      <button 
        onClick={handlePrev} 
        className="cursor-pointer mr-4"
        disabled={currentIndex === 0}
      >
        <img 
          src={leftArrow} 
          alt="Previous" 
          className={currentIndex === 0 ? "opacity-50" : ""}
        />
      </button>
      
      <div className="flex overflow-hidden gap-10">
        {visibleServices.map((service) => (
          <div className="imgBox text-center " key={service.id}
          onClick={() => handleServiceClick(service.name)}
          >
            <div className="imgSection">
              <img 
                src={service.image} 
                alt={service.name} 
                className="serviceImg w-30 h-30" 
              />
            </div>
            <h6 className="">{service.name}</h6>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleNext} 
        className="cursor-pointer ml-4"
        disabled={currentIndex === lastIndex}
      >
        <img 
          src={rightArrow} 
          alt="Next" 
          className={currentIndex === lastIndex ? "opacity-50" : ""}
        />
      </button>
    </div>
  );
}

export default ServiceSlider;