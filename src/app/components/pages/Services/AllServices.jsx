import React from 'react';
import Link from 'next/link';



const serviceList = [
//   { id: "ro-service", name: "RO Service", image: RoService },
  { id: "ac", name: "Air Conditioner", image: "/assets/images/ro-service/ro repair.webp",link:"ac"},
  {id:"washing-machine",name:"Washing Machine",image:"/assets/images/ro-service/ro repair.webp",link:"washing-machine-repair"},
  { id: "water-purifier", name: "Water Purifier", image: "/assets/images/serviceBrands/RoInstallation.png",link:"" },
  { id: "gyeser", name: "Gyeser", image: "/assets/images/serviceBrands/geyser icon 70x70.png",link:"geyser-repair" },
  { id: "refrigerator", name: 'Refrigerator', image: "/assets/images/servicesImages/refrigerator.png",link:"refrigerator-repair" },
  { id: "led", name: "Led", image: "/assets/images/servicesImages/led.png",link:"led-tv-repair" },
 { id: "microwav-repair", name: "Microwave", image: "/assets/images/servicesImages/microWave.png",link:"microwav-repair" },
  {id:"vaccum-cleaner",name:"Vaccum Cleaner",image: "/assets/images/servicesImages/vacuum cleaner.png",link:"vacuum-cleaner-repair"}

];

const AllServices = () => {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-4xl mx-auto  ">
      <div className="bg-white rounded-lg shadow-md p-4 sticky top-10 servicePortion gap-4 ">
        <div className='flex gap-6 serviceHeading'>
          <h4 className=" font-semibold mb-0 text-center">Select a Service</h4>
          <span className='serviceHorizontal'></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4">
          {serviceList.map((service) => (
             <Link href={`/${service.link}`} key={service.id}>
            <button
              
              onClick={() => scrollToSection(service.id)}
              className="flex flex-col items-center justify-center  tabCards sm:w-xs bg-gray-100 rounded-lg hover:bg-white transition-all shadow-md hover:shadow-lg border border-gray-300 hover:ring-2 hover:ring-purple-300 p-1"
            >
             
            <img
                src={service.image}
                alt={service.name}
                className="w-11 h-auto object-contain mb-2"
              />
              <span className="text-xs font-medium text-gray-700 text-center text-wrap">{service.name}</span>
           
            </button>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AllServices;