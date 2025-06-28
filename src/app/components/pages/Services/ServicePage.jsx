'use client';

import React, { useState, useEffect } from "react";
import Tabs from "@/app/components/pages/Services/AllServices";
import ServicesList from "../../service/ServicesList";
import Cart from "../../cart/Cart";
import Assurance from "../../Assurance/Assurance";
import ServiceProcedure from "@/app/components/serviceProcedure/index"
import Image from "next/image";


export default function ServicePage({ pagedata, city, cat }) {
  const [openItem, setOpenItem] = useState(0)
  // const [pagedata, setData] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [addedServices, setAddedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartChanged, setCartChanged] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [imageLoader, setImageLoader] = useState(false);
  const ifAcSchema = cat === 'ac';
  const ifRoSChema= cat === 'ro-water-purifier';

 const ifBangaloreSchema= city === 'bangalore';
 const ifBangaloreRoSchema = city === 'bangalore' && cat === 'ro-water-purifier'; // Add this line
  


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


  // Debug logging
  // useEffect(() => {
  //   console.log("Current selectedServices:", selectedServices);
  //   console.log("Current totalAmount:", totalAmount);


  // }, [selectedServices, totalAmount]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  return (
    <>
      {ifAcSchema && typeof window === "undefined" && (
        <>
          {/* BreadcrumbList Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "name": `AC Service ${city} Breadcrumbs`,
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Voltas AC Service",
                    item: `https://www.mrserviceexpert.com/${city}/voltas/ac`,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Blue Star AC Service",
                    item: `https://www.mrserviceexpert.com/${city}/blue-star/ac`,
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: "Daikin AC Service",
                    item: `https://www.mrserviceexpert.com/${city}/daikin/ac`,
                  },
                  {
                    "@type": "ListItem",
                    position: 4,
                    name: "LG AC Service",
                    item: `https://www.mrserviceexpert.com/${city}/lg/ac`,
                  },
                ],
              }),
            }}
          />

          {/* Service Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                name: `AC Service ${city}`,
                serviceType: ["Air Conditioner Service", "AC Repair", "AC Installation"],
                url: `https://www.mrserviceexpert.com/${city}/ac`,
                areaServed: { "@type": "Place", name: city },
                description:
                  "Mr Service Expert provides professional air conditioner services. We specialize in AC repair, installation, and maintenance for both window and split units.",
              }),
            }}
          />

          {/* FAQ Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: `What are the AC service charges in ${city}?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text:
                        "AC service charges start from ₹299 depending on the type of service.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How can I book an AC service with Mr Service Expert?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: `You can book AC service through our website https://www.mrserviceexpert.com/${city}/ac or by calling customer support.`,
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Do you provide both AC service and installation?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text:
                        "Yes, we offer servicing, repair, and installation for window and split ACs.",
                    },
                  },
                ],
              }),
            }}
          />
          {/*organisation schema*/}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": "Mr Service Expert", "url": "https://www.mrserviceexpert.com", "logo": "https://www.mrserviceexpert.com/assets/images/serviceLogo.webp", "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.8, "reviewCount": 145078, "worstRating": 1 }, "contactPoint": { "@type": "ContactPoint", "telephone": "+91-9311587715", "contactType": "Customer Service", "areaServed": "IN", "availableLanguage": ["English", "Hindi"] }, "sameAs": ["https://www.facebook.com/mrserviceexpert", "https://www.linkedin.com/company/mr-service-expert/", "https://twitter.com/mrserviceexper4/"], "address": { "@type": "PostalAddress", "streetAddress": "8th Floor, Head Office, JMD MEGAPOLIS, Sector 48", "addressLocality": "Gurgaon", "addressRegion": "Haryana", "postalCode": "122018", "addressCountry": "IN" }, "description": "Mr Service Expert is a trusted name in home appliance repair across India. We provide reliable RO Water purifiers Repair &, AC repair & services, refrigerators service, washing machines service, geysers service, and more" })
            }}
          />

        </>
      )}

 {ifRoSChema &&  typeof window === "undefined" && (
  <>
 <script
  id="ro-breadcrumb-schema"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "name": `RO Water Purifier Service ${city} Breadcrumbs`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Kent RO Service",
          "item": `https://www.mrserviceexpert.com/${city}/kent/ro-water-purifier`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Pureit RO Service",
          "item": `https://www.mrserviceexpert.com/${city}/pureit/ro-water-purifier`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Aquafresh RO Service",
          "item": `https://www.mrserviceexpert.com/${city}/aquafresh/ro-water-purifier`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Livpure RO Service",
          "item": `https://www.mrserviceexpert.com/${city}/livpure/ro-water-purifier`
        }
      ]
    })
  }}
/>

<script
  id="ro-service-schema"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `RO Service ${city}`,
      "serviceType": ["RO Service", "RO Repair", "RO Installation"],
      "url": `https://www.mrserviceexpert.com/${city}/ro-water-purifier`,
      "areaServed": {
        "@type": "Place",
        "name": `${city}`
      },
      "description": `Mr Service Expert offers professional RO water purifier services in ${city}, including installation, repair, and maintenance. We service all major RO brands with fast, reliable, and affordable doorstep support.`
    })
  }}
/>

<script
  id="ro-faq-schema"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `What are the RO water purifier service charges in ${city}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Mainly RO service charges in ${city} start at ₹299 and may vary depending on the type of service—installation, repair, or filter replacement.`
          }
        },
        {
          "@type": "Question",
          "name": "How can I book RO water purifier service with Mr Service Expert?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Booking is very easy. Just call us at +91 9311587715 or visit our website to book your service. We’ll confirm your appointment and send a technician to your doorstep in ${city}.`
          }
        },
        {
          "@type": "Question",
          "name": `Do you provide both RO installation and repair services in ${city}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Yes, Mr Service Expert offers complete RO solutions, including installation, repair, maintenance, and filter replacements for all major brands.`
          }
        },
        {
          "@type": "Question",
          "name": `Where can I find reliable RO service near me in ${city}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `If you're in ${city}, Mr Service Expert is a trusted name for doorstep RO service with trained technicians and transparent pricing.`
          }
        },
        {
          "@type": "Question",
          "name": `Why choose Mr Service Expert over other RO service providers in ${city}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Mr Service Expert stands out for its skilled and experienced technicians, transparent pricing starting at ₹299, and quick, reliable doorstep service.`
          }
        }
      ]
    })
  }}
/>

   {/*organisation schema*/}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({"@context":"https://schema.org","@type":"Organization","name":"Mr Service Expert","url":"https://www.mrserviceexpert.com","logo":"https://www.mrserviceexpert.com/assets/images/serviceLogo.webp","aggregateRating":{"@type":"AggregateRating","ratingValue":4.8,"reviewCount":173078,"worstRating":1},"contactPoint":{"@type":"ContactPoint","telephone":"+91-9311587715","contactType":"Customer Service","areaServed":"IN","availableLanguage":["English","Hindi"]},"sameAs":["https://www.facebook.com/mrserviceexpert","https://www.linkedin.com/company/mr-service-expert/","https://twitter.com/mrserviceexper4/"],"address":{"@type":"PostalAddress","streetAddress":"8th Floor, Head Office, JMD MEGAPOLIS, Sector 48","addressLocality":"Gurgaon","addressRegion":"Haryana","postalCode":"122018","addressCountry":"IN"},"description":"Mr Service Expert is a trusted name in home appliance repair across India. We provide reliable RO Water purifiers Repair &, AC repair & services, refrigerators service, washing machines service, geysers service, and more"})
            }}
          />
  </>
 )}

{ifBangaloreRoSchema  && (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({"@context":"https://schema.org/","@type":"Product","name":"RO Service Bangalore","description":"Mr Service Expert offers professional water purifier service in Bangalore starting at ₹399. We provide complete solutions including RO servicing, water purifier repair service, RO installation, and filter change. Whether you're searching for RO service near me, RO repair near me, or reverse osmosis system maintenance, our expert technicians are just a call away. Get reliable and affordable RO and water purifier service from a trusted local provider.","image":"https://www.waterpurifierservicecenter.in/inet/img/service_img/data-ROUTINE%20SERVICE%20700X700.webp","brand":{"@type":"Brand","name":"Mr Service Expert"},"offers":{"@type":"Offer","priceCurrency":"INR","price":"399","itemCondition":"https://schema.org/NewCondition","availability":"https://schema.org/InStock","url":"https://www.mrserviceexpert.com/bangalore/ro-water-purifier"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.7","reviewCount":"7931"},"review":[{"@type":"Review","author":{"@type":"Person","name":"Ravi Mehra"},"reviewBody":"I booked water purifier service near me and was very satisfied. The technician from Mr Service Expert arrived on time, serviced my RO system professionally, and the charges were reasonable.","reviewRating":{"@type":"Rating","ratingValue":"5","bestRating":"5"}},{"@type":"Review","author":{"@type":"Person","name":"Sameer"},"reviewBody":"Needed RO repair service in Bangalore and contacted Mr Service Expert. They provided excellent support for my reverse osmosis system. Definitely recommended.","reviewRating":{"@type":"Rating","ratingValue":"5","bestRating":"5"}}]})
      }}
    />
  </>
)}
      <div className=" ">
        <div className="services-page common-spacing">
          <div className="left-side lg:w-1/4 flex-col mb-1.5">
            <div className="sticky top-20">
              <h1 className="cityHeadings font-bold">{`Get best ${pagedata.category_name?.replace("Service", "")} Service in ${pagedata.city_name}`}</h1>
              <div className=" mb-3.5  items-center justify-center mobileBanner relative  ">
                {!imageLoader && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/assets/cityBanner/Front Banner.webp"
                      alt="Loading"
                      width={475}
                      height={345}
                      // priority
                      // fetchPriority='high'
                      style={{
                        borderRadius: '17px',
                        width: '100%',
                      }}
                    />
                  </div>
                )}
                {/* <Image src={`/assets/categorybanner/${pagedata.banner}`} alt={`${pagedata.city_name}  Services`} priority fetchPriority="high"
                loading="eager" width={475} height={345}
                title={`${pagedata.city_name}  Services`}
                onLoad={() => setImageLoader(true)}
                style={{
                  borderRadius: '17px', width: '100%',
                  opacity: imageLoader ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                }}

              /> */}

                <img
                  src={`/assets/categorybanner/${pagedata.banner}`}
                  alt={`${pagedata.city_name} Services`}
                  width={475}
                  height={345}
                  loading="eager"
                  onLoad={() => setImageLoader(true)}
                  style={{
                    borderRadius: '17px',
                    width: '100%',
                    opacity: imageLoader ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                />


              </div>
              <Tabs />
            </div>
          </div>
          <div className="right-side lg:w-3/4 w-full">
            <div className="rightSidePortion justify-center">
              <div className="lg:w-1/2 w-full">
                <h2 className="ml-2.5 mt-1.5 headingTitle mb-1">{pagedata.city_name}'s Top Picks: Most Loved Services by Our Customers!</h2>
                <div className="desktopBanner mb-3.5 flex items-center justify-center relative  ">
                  {!imageLoader && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src="/assets/cityBanner/Front Banner.webp"
                        alt="Loading"
                        width={475}
                        height={345}
                        style={{
                          borderRadius: '17px',
                          width: '100%',
                        }}

                      />

                    </div>
                  )}
                  {/* <Image src={`/assets/categorybanner/${pagedata.banner}`} alt={`${pagedata.city_name}  Services`} priority fetchPriority="high"
                  loading="eager" width={475} height={345}
                  title={`${pagedata.city_name}  Services`}
                  onLoad={() => setImageLoader(true)}
                  style={{
                    borderRadius: '17px', width: '100%',
                    opacity: imageLoader ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                /> */}
                  <img
                    src={`/assets/categorybanner/${pagedata.banner}`}
                    alt={`${pagedata.city_name} Services`}
                    width={475}
                    height={345}
                    loading="eager"
                    onLoad={() => setImageLoader(true)}
                    style={{
                      borderRadius: '17px',
                      width: '100%',
                      opacity: imageLoader ? 1 : 0,
                      transition: 'opacity 0.5s ease-in-out',
                    }}
                  />

                </div>

                <ServicesList
                  // onAddToCart={handleAddToCart} 
                  // addedServices={addedServices}
                  handleCartLoading={handleCartLoading}
                  addedServices={addedServices}
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
                    cartLoaded={cartLoaded}
                    cartLoadedToggle={handleCartLoading}
                  // onCartLoad={handleCartLoad}
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
  

  {cat === "ro-water-purifier" && (
  <>
    {/* FAQ Item 6 */}
    <div className="border rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpenItem(openItem === 6 ? null : 6)}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-[15px]">
          What Are the Signs That My RO Water Purifier Needs Immediate Service in {city}?
        </span>
        <svg
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            openItem === 6 ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openItem === 6 && (
        <div className="p-4 bg-white border-t border-purple-100">
          <p className="text-gray-600 text-[15px]">
            Over time, your RO system may show signs such as an unusual taste or odor in the water, slow filtration, or leakage. If you are in {city} and are noticing any of these symptoms, it's time to book a professional RO service to ensure clean and safe drinking water.
          </p>
        </div>
      )}
    </div>

    {/* FAQ Item 7 */}
    <div className="border rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpenItem(openItem === 7 ? null : 7)}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-[15px]">
          Why and when should I get RO service in {city}?
        </span>
        <svg
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            openItem === 7 ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openItem === 7 && (
        <div className="p-4 bg-white border-t border-purple-100">
          <p className="text-gray-600 text-[15px]">
            In {city}, regular RO service is important due to high TDS levels, water hardness and seasonal contamination - especially during monsoons and summers. Getting your RO purifier serviced every 3 to 6 months helps maintain water quality, improve filtration performance, prevent bad taste or odour, and extend the life of the purifier. Timely maintenance also reduces the risk of health problems caused by unfiltered or impure water.
          </p>
        </div>
      )}
    </div>

    {/* FAQ Item 8 */}
    <div className="border rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpenItem(openItem === 8 ? null : 8)}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-[15px]">
          What Is the Cost of RO Service in {city}?
        </span>
        <svg
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            openItem === 8 ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openItem === 8 && (
        <div className="p-4 bg-white border-t border-purple-100">
          <p className="text-gray-600 text-[15px]">
            RO servicing in {city} starts at ₹399 with Mr. Service Expert. This includes a doorstep visit, inspection, and basic servicing by certified technicians. If any filters or parts need replacement, charges are communicated transparently before proceeding. We offer same-day service, cover all major RO brands, and ensure no hidden fees — trusted by thousands across {city} for reliable RO care, only at Mr. Service Expert.
          </p>
        </div>
      )}
    </div>

    {/* FAQ Item 9 */}
    <div className="border rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpenItem(openItem === 9 ? null : 9)}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-[15px]">
          Does Mr. Service Expert Provide RO Service for Kent, Aquaguard, and Livpure in {city}?
        </span>
        <svg
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            openItem === 9 ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openItem === 9 && (
        <div className="p-4 bg-white border-t border-purple-100">
          <p className="text-gray-600 text-[15px]">
            Yes, Mr. Service Expert offers certified RO service in {city} for all major brands including Kent, Aquaguard, Pureit, Livpure, AO Smith, and more—covering installation, repair, and AMC plans at your doorstep.
          </p>
        </div>
      )}
    </div>

    {/* FAQ Item 10 */}
    <div className="border rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpenItem(openItem === 10 ? null : 10)}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-[15px]">
          Can I Book RO Service in {city} Just by Calling?
        </span>
        <svg
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            openItem === 10 ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openItem === 10 && (
        <div className="p-4 bg-white border-t border-purple-100">
          <p className="text-gray-600 text-[15px]">
            Yes, booking RO service in {city} is simple and flexible with Mr. Service Expert. You can either call us directly at <strong>+91-9311587715</strong> or book instantly through our official website. Whichever way you choose, we guarantee a same-day visit by a certified RO technician, right at your doorstep—no delays, no hassle.
          </p>
        </div>
      )}
    </div>
  </>
)}

            </div>
          </div>
        </div>

        <div className="common-spacing">
          <div className=" bg-white aboutStyle">
            <h3 className="catgoreyTitle">About Mr. Service Expert {pagedata.city_name}</h3>
            <div dangerouslySetInnerHTML={{ __html: pagedata?.content?.page_content }} className="serviceContentStyle" />
          </div>
        </div>

        {pagedata?.related_cities?.length > 0 ? (<div className="bg-white px-8 py-2">
          <h3 className="text-2xl"><b>Popular Cities Near Me</b></h3>
          <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
            {pagedata.related_cities?.map((city) => (
              <div className='brandsServices ' key={city.id}>
                <a href={`/${city.city_url}/${cat}`} title={`${city.city_url}  ${cat}   services`}>
                  <li className='brand-btn-style'>
                    {city.city_name}
                    <span></span>
                  </li>
                </a>
              </div>
            ))}
          </div>
        </div>) : (<></>)}


        <div className="bg-white px-8 py-2">
          <h3 className="text-2xl"><b>Popular Brand in {pagedata.city_name}</b></h3>
          <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
            {pagedata.brands?.map((brand) => (
              <div className='brandsServices ' key={brand.id}>
                <a href={`${brand.brand_url}/${cat}`} title={`${brand.brand_url} ${cat} services`}>
                  <li className='brand-btn-style'>
                    {brand.brand_name}
                    <span></span>
                  </li>
                </a>
              </div>
            ))}

          </div>
        </div>

      </div></>
  );
}