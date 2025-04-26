import React, { useState } from "react";
import ExtraOptions from "../modals/extraOptions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Ac from '../../assets/images/serviceBrands/WaterPurifier.png';
import WaterPurifier from '../../assets/images/serviceBrands/WaterPurifier.png';
import AMC from '../../assets/images/amc.webp';
import RoMainitance from '../../assets/images/serviceListImages/ro service.webp';
import PreFilter from '../../assets/images/serviceListImages/pre filter setup.webp';
import RoRepair from '../../assets/images/serviceListImages/ro repair.webp';
import RoInst from '../../assets/images/serviceListImages/ro installation.webp';
import ProblemModal2 from "../modals/ProblemModal2";
import PhoneVerification from "../PhoneVerification/PhoneVerification";
import WashingRepair from '../../assets/images/serviceBrands/washingRepair.webp';
import WashingMachine from '../../assets/images/ro-service/WASHING-MACHINE-DiYsXZ0d.png';
import washingInstallation from '../../assets/images/serviceBrands/washingInstallation.webp';
import washingUninstallation from '../../assets/images/serviceBrands/washingUnistallation.webp';
import { toast, ToastContainer } from "react-toastify";


const services = [
    // Washing Machine Routine Service
    {
      id: 21,
      name: "Washing Machine Routine Service",
      price: 499,
      category: "washing-machine-service",
      reviews: 48,
      rating: 4.6,
      image: WashingMachine, // Replace with your actual image import
      briefInfo: "Thorough cleaning of the drum, filters, and exterior. Includes checking the water inlet/outlet, and ensuring smooth operation of spin and wash cycles."
    },
  
    // Washing Machine Repair
    {
      id: 22,
      name: "Washing Machine Repair Service",
      price: 299,
      category: "washing-machine-repair",
      reviews: 39,
      rating: 4.4,
      image:  WashingRepair, // Replace with your actual image import
      briefInfo: "Fixing issues like water leakage, drum not spinning, strange noises, or display malfunctions. Pricing may vary based on part replacements and service complexity."
    },
  
    // Washing Machine Installation
    {
      id: 23,
      name: "Washing Machine Installation",
      price: 649,
      category: "washing-machine-installation",
      reviews: 52,
      rating: 4.7,
      image: washingInstallation, // Replace with your actual image import
      briefInfo: "Professional setup of front-load or top-load washing machines including plumbing, alignment, electrical setup, and functionality test."
    },
  
    // Washing Machine Uninstallation
    {
      id: 24,
      name: "Washing Machine Uninstallation",
      price: 399,
      category: "washing-machine-uninstallation",
      reviews: 31,
      rating: 4.2,
      image: washingUninstallation, // Replace with your actual image import
      briefInfo: "Safe disconnection of the washing machine from water and power supply. Includes draining residual water and preparing the unit for relocation."
    },
  ];
  



// Updated serviceCategories to match the Tabs component
const serviceCategories = [
//   { id: "ro-service", title: "RO Service", showImage: true },
//   { id: "ro-repair", title: "Ro Repair", showImage: true },
//   { id: "ro-installation", title: "RO Installation", showImage: true },
//   { id: "ro-unistallation", title: "RO Uninstallation", showImage: true },
//   { id: "Ro-Amc", title: "RO AMC Plans", showImage: true },

  { id: "washing-machine-service", name: "Routine Service", showImage: true  },
   { id: "washing-machine-repair", name: "Repair Service", showImage: true },
 { id: "washing-machine-installation", name: "Installation", showImage: true  },
    { id: "washing-machine-uninstallation", name: "Uninstallation", showImage: true  },
];

// console.log(cartdata);

const WashingServiceList = ({ onAddToCart, addedServices = [], state }) => {
  // Define which categories should use the modal
  const modalCategories = ['ac', 'refrigerator', 'chimney', 'washing-machine', 'water-purifier'];
  const [showModal, setShowModal] = useState(false);

//   const type = localStorage.setItem('type', 'add');
//   const handleAddToCart = async (service) => {
//     if (!addedServices.includes(service.id)) {

//       const service_id = service.id;
//       const quantity = 1;
//       console.log(quantity);
      
//       const type = localStorage.getItem('type');
//       const cid = localStorage.getItem('customer_id');
//       console.log(cid);
//       if (cid != null) {
//         toast.success('Hope You Enjoy Our Services 🎉');
//         const payload = { service_id, quantity, cid, type };
//         const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {

//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });

//         const data = await res.json();
//         localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails, data.total_cart_price, data.cart_id));
//         console.log(data);
//       } else {
//         setShowModal(true);
//         // toast.error('Login before addding any service');

//         // setTimeout(() => {
//         //   setShowModal(true);
//         // }, 1500)

//       }

//     }
//   };

  return (
    <div className="services-list">
      <ToastContainer />
      {serviceCategories.map(({ id, title, showImage }) => {
        const filteredServices = services.filter((s) => s.category === id);

        // Only display categories that have services
        if (filteredServices.length === 0) return null;

        return (
          <div key={id} id={id} className="common-service-style ">
            <h2>{title}</h2>
            {filteredServices.map((service) => {
              const isAdded = addedServices.includes(service.id);
              // Fix: Define useModal variable here
              const useModal = modalCategories.includes(service.category);

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
                        <div className="prices flex gap-2.5">
                          <span>
                            ₹{service?.price}
                          </span>
                          <span className="actualPrice">₹{service?.price + 100}</span>
                        </div>
                      </div>
                    </div>
                    <div className="serviceImgContainer">
                      {showImage && service.image && (
                        <div className="serviceDetailsImg mb-0.5">
                          <img src={service.image} alt={service.name} />
                        </div>
                      )}
                      <div className=" ">
                        {useModal ? (
                          <ProblemModal2 onAddToCart={onAddToCart} service={service} isAdded={isAdded} />
                        ) : (
                          <button
                            className={`add-to-cart-btn ${isAdded ? "bg-violet-300 px-2 py-1.5 cursor-not-allowed" : "IncrementDcrementBtn2"} rounded`}
                            onClick={() => handleAddToCart(service)}
                            disabled={isAdded}
                          >
                            {isAdded ? "Added" : "Add"}
                          </button>
                        )}
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

export default WashingServiceList;