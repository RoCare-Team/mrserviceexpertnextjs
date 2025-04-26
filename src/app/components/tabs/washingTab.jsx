import React from 'react';
import WashingRepair from '../../assets/images/serviceBrands/washingRepair.webp';
import WashingMachine from '../../assets/images/ro-service/WASHING-MACHINE-DiYsXZ0d.png';
import washingInstallation from '../../assets/images/serviceBrands/washingInstallation.webp';
import washingUninstallation from '../../assets/images/serviceBrands/washingUnistallation.webp';

import AMC from '../../assets/images/AMC.jpg';

const serviceList = [
  { id: "washing-machine-service", name: "Routine Service", image: WashingMachine },
  { id: "washing-machine-repair", name: "Repair Service", image: WashingRepair},
  { id: "washing-machine-installation", name: "Installation", image: washingInstallation},
  { id: "washing-machine-uninstallation", name: "Uninstallation", image: washingUninstallation },

  
//   { id: "washing-machine-service", name: "Routine Service", showImage: true  },
//    { id: "washing-machine-repair", name: "Repair Service", showImage: true },
//  { id: "washing-machine-installation", name: "Installation", showImage: true  },
//     { id: "washing-machine-uninstallation", name: "Uninstallation", showImage: true  },
//   { id: "Ro-Amc", name: 'RO AMC', image: AMC },
  // { id: "water-purifier", name: "Water Purifier", image: WaterPurifier },

];

const washingTab = () => {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-4xl mx-auto  ">
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-10 servicePortion gap-4 ">
        <div className='flex gap-6 serviceHeading'>
          <h4 className=" font-semibold mb-0 text-center">Select a Service</h4>
          <span className='serviceHorizontal'></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6">
          {serviceList.map((service) => (
            <button
              key={service.id}
              onClick={() => scrollToSection(service.id)}
              className="flex flex-col items-center justify-center  tabCards sm:w-xs bg-gray-100 rounded-lg hover:bg-white transition-all shadow-md hover:shadow-lg border border-gray-300 hover:ring-2 hover:ring-purple-300 p-2"
            >
              <img
                src={service.image}
                alt={service.name}
                className="w-11 h-11 object-contain mb-2"
              />
              <span className="text-xs font-medium text-gray-700 text-center text-wrap">{service.name}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default washingTab;
