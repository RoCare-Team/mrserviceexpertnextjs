'use client';

import React, { useState, useEffect } from "react";
import Tabs from "@/app/components/pages/Services/AllServices";
import ServicesList from "@/app/components/service/ServicesList";
import Cart from "@/app/components/cart/Cart";
import Assurance from "@/app/components/Assurance/Assurance";
import ServiceProcedure from "@/app/components/serviceProcedure/index"


export default function ServicePage({ city, brand, cat,pagedata }) {
  const [openItem, setOpenItem] = useState(0)
  // const [pagedata, setData] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [addedServices, setAddedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [brandLoader, setBrandLoader] = useState(false);
    const [cartChanged, setCartChanged] = useState(false);
    const [cartLoaded, setCartLoaded] = useState(false);

 
 const handleCartLoading = () => {
    setCartLoaded(prevState => prevState + 1);
    setCartChanged(prev => !prev);
  };


  useEffect(() => {
    const loadCartFromLocalStorage = () => {
      try {
        const savedCartItems = localStorage.getItem('service_name');
        const savedCartTotal = localStorage.getItem('total_price');


        if (savedCartItems && savedCartTotal) {
          const parsedItems = JSON.parse(savedCartItems);
          const parsedTotal = parseFloat(savedCartTotal);

          // console.log("ServicePage loading cart from localStorage:", parsedItems);

          setSelectedServices(parsedItems);
          setTotalAmount(parsedTotal);

          // Update addedServices array with ids from loaded cart items
          const serviceIds = parsedItems.map(item => item.id);
          setAddedServices(serviceIds);
          setCartLoaded(true);
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    };

    loadCartFromLocalStorage();
  }, []);

  
  const handleAddToCart = (service) => {
    // Update selectedServices state
    setSelectedServices((prev) => {
      // Check if service already exists
      const existingService = prev.find(s => s.id === service.id);

      if (existingService) {
        // If exists, increment quantity
        return prev.map(s =>
          s.id === service.id
            ? { ...s, quantity: (s.quantity || 1) + 1 }
            : s
        );
      } else {
        // If new, add with quantity 1
        return [...prev, { ...service, quantity: 1 }];
      }
    });

    // Also update addedServices state if not already included
    if (!addedServices.includes(service.id)) {
      setAddedServices([...addedServices, service.id]);
    }
  };

  const handleRemoveFromCart = (serviceId) => {
    // Update selectedServices state
    setSelectedServices((prev) => {
      const updatedServices = prev.filter((s) => s.id !== serviceId);
      return updatedServices;
    });

    // Also update addedServices state
    setAddedServices((prev) => prev.filter(id => id !== serviceId));
  };

  const handleDecrementService = (serviceId) => {
    setSelectedServices((prev) => {
      const updatedServices = prev
        .map(s =>
          s.id === serviceId
            ? {
              ...s,
              quantity: Math.max(0, (s.quantity || 1) - 1)
            }
            : s
        )
        // Remove the service completely if quantity becomes 0
        .filter(s => s.quantity > 0);

      // If service is completely removed, also update addedServices
      if (!updatedServices.some(s => s.id === serviceId)) {
        setAddedServices(prev => prev.filter(id => id !== serviceId));
      }

      return updatedServices;
    });
  };

  const handleIncrementService = (serviceId) => {
    setSelectedServices((prev) => {
      const updatedServices = prev.map(s =>
        s.id === serviceId
          ? { ...s, quantity: Math.min(5, (s.quantity || 1) + 1) }
          : s
      );

      return updatedServices;
    });
  };

  // Calculate total and update localStorage whenever selectedServices changes
  useEffect(() => {
    if (selectedServices.length > 0) {
      const total = selectedServices.reduce(
        (acc, curr) => acc + (curr.price * (curr.quantity || 1)),
        0
      );

      setTotalAmount(total);

      // Update localStorage with the latest cart state
      // localStorage.setItem('cartItems', JSON.stringify(selectedServices));
      // localStorage.setItem('cartTotal', total.toString());
    } else {
      // setTotalAmount(0);
      // localStorage.removeItem('cartItems');
      // localStorage.removeItem('cartTotal');
    }
  }, [selectedServices]);

  // console.log(setData);

  // Debug logging
  useEffect(() => {
    console.log("Current selectedServices:", selectedServices);
    console.log("Current totalAmount:", totalAmount);


  }, [selectedServices, totalAmount]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  return (
    <div className=" ">
      <div className="services-page common-spacing">
        <div className="left-side lg:w-1/4 flex-col mb-1.5">
          <div className="sticky top-20">
           <h1 className=" cityHeadings"><b>{pagedata?.brandname} {pagedata?.categoryname} Services in {pagedata?.cityname}</b></h1>
            <Tabs cater={cat} />
          </div>
        </div>
        <div className="right-side lg:w-3/4">
          <div className="rightSidePortion justify-center">
            <div className="lg:w-1/2">
             <h3 className="ml-2.5 mt-1.5 text-[20px]"> {pagedata.cityname}'s Top Picks: Most Loved Services by Our Customers!</h3>
              
              <div className="mb-3.5 flex items-center justify-center  relative">
                {!brandLoader && (
                  <div className="absolute w-full">
                    <img src={`/assets/cityBanner/Front Banner.webp`} alt='service img' width={475} height={345} style={{
                    borderRadius: '17px', width: '100%'
                  }} />
                  </div>
                )}

                <img src={`/assets/categorybanner/${pagedata.banner}`} alt='service img' width={475} height={345} onLoad={() => setBrandLoader(true)} style={{
                  borderRadius: '17px', width: '100%', opacity: brandLoader ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                }} />


              </div>

              <ServicesList
                // onAddToCart={handleAddToCart}
                // addedServices={addedServices}
                // cate={cat}
                  handleCartLoading={handleCartLoading}
                addedServices={addedServices}
                cate={cat}
                state={cartChanged}
              />
            </div>
            <div className="lg:w-5/12 cartContainer">
              <div className="cart-body-section">
                <Cart
                  // selectedServices={selectedServices}
                  // total={totalAmount}
                  // onRemove={handleRemoveFromCart}
                  // onIncrement={handleIncrementService}
                  // onDecrement={handleDecrementService}
                // onCartLoad={handleCartLoad}
                 cartLoaded={cartLoaded}
                  cartLoadedToggle={handleCartLoading}
                />
                <Assurance />
                <ServiceProcedure />

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=" bg-white common-spacing">
        <h2 className="text-4xl font-bold faqHeading mb-6">Frequently Asked Questions</h2>

        <div className="flex flex-wrap">
          <div className='lg:w-1/2  py-3.5 px-7'>
            <img src="/assets/images/newFaqCon.webp" alt='Faq Image Icon' width={629} height="auto" title="Faq ro Services" className=' w-full ' />
          </div>
          <div className="space-y-4 lg:w-1/2">

            <div className={`border rounded-xl overflow-hidden transition-all duration-300 `}>
              <button
                onClick={() => setOpenItem(openItem === 1 ? null : 1)}
                className={`w-full p-4 text-left flex justify-between items-center `}
              >
                <span className="font-medium text-gray-800">{pagedata?.content?.faqquestion1 || "Do you provide AC repair for all brands in Delhi?"}
                </span>
                <svg
                  className={`w-5 h-5 text-purple-600 transform transition-transform `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItem == 1 && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">
                    {pagedata?.content?.faqanswer1 || " Yes, we repair all major AC brands including LG, Samsung, Voltas, Daikin, Blue Star, and more."}
                  </p>
                </div>
              )}
            </div>
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 `}>
              <button
                onClick={() => setOpenItem(openItem === 2 ? null : 2)}
                className={`w-full p-4 text-left flex justify-between items-center `}
              >
                <span className="font-medium text-gray-800">{pagedata?.content?.faqquestion2 || "Is gas refilling available for split and window ACs?"}
                </span>
                <svg
                  className={`w-5 h-5 text-purple-600 transform transition-transform `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItem == 2 && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">
                    {pagedata?.content?.faqanswer2 || " Yes, we offer AC gas refilling, servicing, and installation for both split and window ACs."}
                  </p>
                </div>
              )}
            </div>
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 `}>
              <button
                onClick={() => setOpenItem(openItem === 3 ? null : 3)}
                className={`w-full p-4 text-left flex justify-between items-center `}
              >
                <span className="font-medium text-gray-800">{pagedata?.content?.faqquestion3 || " What types of washing machines do you repair?"}
                </span>
                <svg
                  className={`w-5 h-5 text-purple-600 transform transition-transform `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItem == 3 && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">
                    {pagedata?.content?.faqanswer3 || " We repair front load, top load, semi-automatic, and fully automatic washing machines."}
                  </p>
                </div>
              )}
            </div>
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 `}>
              <button
                onClick={() => setOpenItem(openItem === 4 ? null : 4)}
                className={`w-full p-4 text-left flex justify-between items-center `}
              >
                <span className="font-medium text-gray-800">{pagedata?.content?.faqquestion4 || " Do you use genuine spare parts?"}
                </span>
                <svg
                  className={`w-5 h-5 text-purple-600 transform transition-transform `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItem == 4 && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">
                    {pagedata?.content?.faqanswer4 || " Yes, we use 100% original and brand-certified parts for all washing machine repairs."}
                  </p>
                </div>
              )}
            </div>
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 `}>
              <button
                onClick={() => setOpenItem(openItem === 5 ? null : 5)}
                className={`w-full p-4 text-left flex justify-between items-center `}
              >
                <span className="font-medium text-gray-800">{pagedata?.content?.faqquestion5 || "How often should I get my RO serviced?"}
                </span>
                <svg
                  className={`w-5 h-5 text-purple-600 transform transition-transform `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItem == 5 && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">
                    {pagedata?.content?.faqanswer5 || " It’s recommended every 3–6 months to ensure water purity and machine efficiency."}
                  </p>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>
      <div className="common-spacing">
        <div className=" bg-white aboutStyle">
          <h3 className="catgoreyTitle">ABOUT {pagedata?.categoryname} ({pagedata.brandname})</h3>
          <div
            className="serviceContentStyle"
            dangerouslySetInnerHTML={{ __html: pagedata?.content?.page_content }}
          ></div>

          {/* <p className="catgoreyContent">{cityData?.categorydetail?.category_content}</p> */}
        </div>


      </div>
      <div className="bg-white common-spacing">
        <h3>Popular Brand in {pagedata.city_name}</h3>
        <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
          {pagedata.brands?.map((brand) => (
            <div className='brandsServices '>
              <a href={`../${brand.brand_url}/${cat}`}>
                <li className='brand-btn-style'>
                  {brand.brand_name}
                  <span></span>
                </li>
              </a>
            </div>
          ))}

          {/* {!visibleBrands && (
                                      <div>
                                          <button onClick={handleLoadMore} className='readMore'>Read More</button>
                                      </div>
                                  )} */}
        </div>
      </div>
    </div>
  );
}
