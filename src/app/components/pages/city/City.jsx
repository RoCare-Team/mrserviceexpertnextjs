"use client"

import React, { useState, useEffect } from "react";
import Tabs from "@/app/components/pages/Services/AllServices";
import Assurance from "@/app/components/Assurance/Assurance";
import ServiceProcedure from '@/app/components/serviceProcedure/index';
import AllServicesList from "@/app/components/pages/Services/Services";
import ServicesList from "@/app/components/service/ServicesList";
import HomeCareService from "../../servicesSection/homeCareService";
import Cart from "../../cart/Cart";


const City = ({ city, cityData }) => {
    const [addedServices, setAddedServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [cartChanged, setCartChanged] = useState(false);
    const [cartLoaded, setCartLoaded] = useState(false);

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

    const handleCartLoading = () => {
        setCartLoaded(prevState => prevState + 1);
        setCartChanged(prev => !prev);
    };

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

    const rawHtml = cityData?.categorydetail?.category_content || "";
    const sanitizedHtml = rawHtml
        .replace(/<h1>/gi, '<h2>')
        .replace(/<\/h1>/gi, '</h2>');

    // console.log(categoryContent);


    // console.log("test" + JSON.stringify(cityData?.city_detail?.city_content));
    // const cleanContent = he.decode(cityData?.categorydetail?.category_content);

    if (cityData.status === "1")
        return (
            <>
                {/* <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSchemaForCity(cityData)) }}
        /> */}
                <div>
                    <div className="services-page common-spacing">

                        <div className="left-side lg:w-1/4 flex-col mb-1.5">
                            <div className="sticky top-20">
                                <h1 className="cityHeadings">Most Loved Services by Our Customers!</h1>
                                <div className=" mb-3 mobileBanner">
                                    <img src="/assets/cityBanner/Front Banner.webp" alt='All Services in india' title="All Services in india" width={475} height={345} style={{
                                        borderRadius: '17px', width: '100%'
                                    }} /></div>
                                <Tabs />
                            </div>
                        </div>
                        <div className="right-side lg:w-3/4">
                            <div className="rightSidePortion justify-center">
                                <div className="lg:w-1/2">
                                    <h2 className="ml-2.5 mt-1.5 text-3xl">Services All Over {cityData?.city_name}</h2>
                                    <div className="mb-3.5 flex items-center justify-center desktopBanner ">
                                        <img src="/assets/cityBanner/Front Banner.webp" alt='All Services in india' title={`Our Services in ${cityData?.city_name}`} width={475} height="auto" style={{
                                            borderRadius: '17px', width: '100%',
                                        }} />

                                    </div>
                                    <AllServicesList />
                                </div>
                                <div className="lg:w-5/12 cartContainer">
                                    <div className="cart-body-section">

                                        <Assurance />
                                        <ServiceProcedure />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="common-spacing">
                        {/* <ServiceSection/> */}
                        <HomeCareService />
                    </div>
                    <div className="common-spacing">
                        <div className=" bg-white aboutStyle">
                            <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT {cityData.city_name}</h3>

                            <div className="serviceContentStyle">
                                <h2>Best Home Appliance Repair Services in {cityData.city_name} – Mr. Service Expert</h2>
                                <p>Are your home appliances not working as they should? Welcome to Mr. Service Expert, the most trusted name for <a href={`https://www.mrserviceexpert.com/${cityData.city_name}`} target="_blank" rel="noopener noreferrer"><b>home appliance repair in {cityData.city_name}</b></a>. Whether it’s a <a href="https://www.mrserviceexpert.com/ro-water-purifier" target="_blank" rel="noopener noreferrer">RO water purifier</a>, air conditioner, washing machine, refrigerator, geyser, microwave oven, vacuum cleaner, or LED TV, we provide reliable and affordable repair services at your doorstep across {cityData.city_name}.</p>
                                <p>We specialize in servicing all major brands with certified technicians who ensure 100% customer satisfaction. Our quick response and same-day home appliance repair in {cityData.city_name} make us the first choice for thousands of customers.</p>
                                <h2>Mr. Service Expert Home Appliance Repair Services in {cityData.city_name}</h2>
                                <h3>RO Water Purifier Repair in {cityData.city_name}</h3>
                                <p>We offer doorstep RO water purifier repair services in {cityData.city_name} for all major brands. Whether it is filter replacement, motor repair, or complete installation, our trained technicians handle it all with precision and care.</p>
                                <p>At Mr. Service Expert, we specialize in expert repair and maintenance for top RO water purifier brands like Kent, Aquaguard, Livpure, Pureit, AO Smith, Havells, Blue Star, and Tata Swach. We ensure your RO system delivers clean, safe, and healthy drinking water by using genuine spare parts and following brand-compliant service procedures. Trust us for prompt service, transparent pricing, and long-term performance of your water purifier across {cityData.city_name}.</p>
                                <h3>AC Repair in {cityData.city_name}</h3>
                                <p>Stay cool and comfortable with fast, professional AC repair in {cityData.city_name} from Mr. Service Expert. We offer same-day air conditioner repair, installation, and maintenance for all types of AC units, including split and window models. Whether your AC is not cooling, leaking water, or making noise, our certified technicians are equipped to fix it efficiently at your doorstep.</p>
                                <p>We are a trusted name for servicing top AC brands such as Daikin, Voltas, Samsung, LG, Blue Star, Hitachi, Carrier, Godrej, Panasonic, and Whirlpool. From AC gas refilling and regular tune-ups to advanced diagnostics and part replacements, our team ensures a smooth and hassle-free experience. With expert service, genuine parts, and prompt support, Mr. Service Expert guarantees your AC stays in top condition—even during {cityData.city_name}’s harshest summers.</p>
                                <h3>Washing Machine Repair in {cityData.city_name}</h3>
                                <p>Facing leakage, noise, drainage issues, or drum malfunctions? At Mr. Service Expert, we provide professional washing machine repair in {cityData.city_name} for both automatic and semi-automatic models. Our expert technicians are trained to handle top-load and front-load washing machines from all leading brands, including LG, Samsung, IFB, Whirlpool, Bosch, Godrej, Panasonic, and Haier.</p>
                                <p>Whether your machine is not spinning, making strange noises, or facing drainage problems, we offer quick and reliable doorstep service to restore your appliance to full functionality. As one of the best washing machine services in {cityData.city_name}, we use genuine spare parts and experienced service engineers to ensure smooth performance and long-lasting repairs for all top-load and front-load washing machines across the city.</p>
                                <h3>Refrigerator Repair in {cityData.city_name}</h3>
                                <p>At Mr. Service Expert, our refrigerator repair experts in {cityData.city_name} are trained to handle a wide range of issues — from cooling problems and unusual noises to water leakage and complete compressor failure. We provide reliable and efficient refrigerator repair services in {cityData.city_name}, ensuring that your fridge runs smoothly and preserves your food safely.</p>
                                <p>Our certified technicians specialize in servicing all types of refrigerators, including single-door, double-door, and side-by-side models. We work with all major brands such as Samsung, LG, Whirlpool, Haier, Godrej, Panasonic, Bosch, and Videocon. Whether it’s gas refilling, thermostat replacement, or compressor troubleshooting, you can count on us for prompt, professional, and affordable repairs — all delivered at your doorstep.</p>
                                <h3>Geyser Repair in {cityData.city_name}</h3>
                                <p>Book geyser repair in {cityData.city_name} with Mr. Service Expert for safe, reliable, and affordable service. We handle all types and models of geysers, including instant and storage types, providing quick solutions to ensure your hot water supply remains uninterrupted.</p>
                                <p>Our skilled technicians specialize in repairing and maintaining popular geyser brands such as Bajaj, AO Smith, Havells, Racold, Crompton, Venus, and V-Guard. With fast response times and expert care, we deliver dependable service that keeps your geyser running efficiently and safely throughout the year.</p>
                                <h3>Microwave Oven Repair in {cityData.city_name}</h3>
                                <p>Don’t let a faulty microwave disrupt your kitchen routine. We offer expert microwave oven repair services in {cityData.city_name} for all major brands, including LG, Samsung, IFB, Whirlpool, Panasonic, Godrej, and Bajaj.</p>
                                <p>Whether you own a solo, grill, or convection microwave, our skilled technicians quickly diagnose and fix issues related to heating, power supply, or circuit malfunctions. We pride ourselves on delivering the best microwave service in {cityData.city_name} with prompt, efficient, and reliable repairs right at your doorstep.</p>
                                <h3>Vacuum Cleaner Repair in {cityData.city_name}</h3>
                                <p>Experiencing low suction, unusual noise, or motor failure? At Mr. Service Expert, we handle all types of vacuum cleaner repairs in {cityData.city_name}, including suction loss, motor damage, and filter clogging. Our certified technicians specialize in repairing top brands like Eureka Forbes, Dyson, Philips, Karcher, Panasonic, Inalsa, and American Micronic. We expertly diagnose and fix performance issues to restore your vacuum cleaner to like-new condition with fast, reliable, and affordable service right at your doorstep.</p>
                                <h3>LED & Smart TV Repair in {cityData.city_name}</h3>
                                <p>For issues like no display, flickering screens, sound problems, or power faults, Mr. Service Expert is your trusted choice for LED and Smart TV repair in {cityData.city_name}. We provide expert repair and maintenance services for all major brands, including Sony, Samsung, LG, Panasonic, MI (Xiaomi), OnePlus, TCL, Vu, Thomson, and Haier.</p>
                                <p>Whether you need screen replacement, audio-video troubleshooting, or any other brand-specific repair, our trained technicians deliver fast, reliable solutions right at your doorstep. As a top LED & Smart TV repair service in {cityData.city_name}, we ensure same-day service, genuine spare parts, and industry-leading support—so you can be confident your TV is in safe hands, no matter the brand or issue.</p>
                                <h2>Why Choose Mr. Service Expert in {cityData.city_name}?</h2>
                                <p>Mr. Service Expert is the go-to destination for reliable, fast, and affordable home appliance repair services in {cityData.city_name}. With a team of certified and experienced technicians, we bring professional repair solutions right to your doorstep with no more waiting or repeated follow-ups. Whether it's an RO purifier, air conditioner, washing machine, refrigerator, microwave, geyser, vacuum cleaner, or LED TV, we handle all appliance issues with precision and genuine spare parts.</p>
                                <p>What sets us apart is our same-day service, transparent pricing, and 100% service satisfaction guarantee. We proudly serve all major locations in {cityData.city_name}.</p>
                                <p>With Mr. Service Expert, you get the best home appliance repair in {cityData.city_name} from the comfort of your home.</p>
                                <h2>Benefits of Choosing Mr. Service Expert for Major Appliance Brands in {cityData.city_name}</h2>
                                <h3>Multi-Brand Expertise Under One Roof</h3>
                                <p>Whether it's Indian or international brands, we handle all with equal proficiency—ensuring you don’t need to call multiple service providers.</p>
                                <h3>Certified & Trained Technicians</h3>
                                <p>Our technicians are brand-certified and highly trained, equipped to handle even the most complex repairs while maintaining original service standards.</p>
                                <h3>Use of 100% Genuine Spare Parts</h3>
                                <p>We prioritize your appliance's longevity by using only authentic, brand-compliant spare parts during every repair or replacement.</p>
                                <h3>Quick Turnaround & On-Time Service</h3>
                                <p>We value your time. Our service teams ensure timely doorstep visits and fast issue resolution across all major brands and appliance categories.</p>
                                <h3>Pan-{cityData.city_name} Coverage</h3>
                                <p>From DLF Phase to Sector 56 or Sohna Road to Golf Course Extension, we provide seamless service coverage across {cityData.city_name} with no extra visit charges.</p>
                                <h3>Comprehensive Service Portfolio</h3>
                                <p>We cover ROs, ACs, refrigerators, washing machines, geysers, TVs, microwave ovens, vacuum cleaners, and more—making us your go-to appliance service partner.</p>
                                <h3>Customer-Centric Pricing & Transparent Billing</h3>
                                <p>Enjoy affordable, upfront pricing with no hidden costs. Every service is backed by clear estimates and post-service feedback support.</p>
                                <h3>Extended Warranty Support</h3>
                                <p>All services come with limited service warranties, giving you peace of mind after every repair or maintenance session.</p>
                                <h2>Book Now – Trusted Home Appliance Service in {cityData.city_name}</h2>
                                <p>Facing trouble with your AC, fridge, washing machine, RO, geyser, microwave, LED TV, or vacuum cleaner? Get quick, affordable appliance repair in {cityData.city_name} with just a call or online booking.</p>

                                <h2>Conclusion: Your Home Appliance Expert in {cityData.city_name}</h2>
                                <p>At Mr. Service Expert, we know how important your appliances are to your daily life. That’s why we offer fast, trusted, and affordable appliance repair in {cityData.city_name}. From AC repair to RO service, washing machine fixes to TV screen replacements, our team is here to restore convenience to your home with zero hassle.</p>
                                <p>We aim to be the No. 1 appliance repair service provider in {cityData.city_name}, delivering quality service backed by experience, affordability, and professionalism.</p>
                            </div>
                            {/* <div dangerouslySetInnerHTML={{ __html: cityData?.city_detail?.city_content }} className="serviceContentStyle" /> */}
                            {/* <p className="catgoreyContent">{cityData?.city_detail?.city_content}</p> */}
                        </div>
                    </div>
                    <div className="bg-white common-spacing">
                        <h3 className="catgoreyTitle">Popular City in India</h3>
                        <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                            {cityData.recent_cities?.map((city) => (
                                <div className='brandsServices ' key={city.id}>
                                    <a href={`${city.city_url}`} title={`${city.city_url}`}>
                                        <li className='brand-btn-style'>
                                            {city.city_name}
                                            <span></span>
                                        </li>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>

        );
    else
        return (
            <div>
                <div className="services-page common-spacing">
                    <div className="left-side lg:w-1/4 flex-col mb-1.5">
                        <div className="sticky top-20">
                            {/* ${pagedata.category_name?.replace("Service", "")} */}
                            <h1 className="cityHeadings"><b>Get Best {cityData?.categorydetail?.category_name?.replace("Service", "")} Service</b></h1>
                            <div className="mobileBanner mb-3   ">
                                {/* <img src={`/assets/categorybanner/${cityData.catbanner}`} alt={`${cityData?.categorydetail?.category_name}`} title={`${cityData?.categorydetail?.category_name}`} width={475} height={345} style={{
                                    borderRadius: '17px', width: '100%'
                                }} */}
                                {/* /assets/cityBanner/Front Banner.webp */}
                                <img src={`/assets/categorybanner/${cityData.catbanner}`} alt={`${cityData?.categorydetail?.category_name}`} title={`${cityData?.categorydetail?.category_name}`} width={475} height={345} style={{
                                    borderRadius: '17px', width: '100%'
                                }}
                                />
                            </div>
                            <Tabs cat={city} />
                        </div>
                    </div>
                    <div className="right-side lg:w-3/4">
                        <div className="rightSidePortion justify-center">
                            <div className="lg:w-1/2">
                                <h2 className="ml-2.5 mt-1.5 text-2xl mb-1">Most Loved Services by Our Customers!</h2>

                                <div className=" desktopBanner mb-3.5 flex items-center justify-center">
                                    <img src={`/assets/categorybanner/${cityData.catbanner}`} alt={`${cityData?.categorydetail?.category_name}`} title={`${cityData?.categorydetail?.category_name}`} width={475} height={345} style={{
                                        borderRadius: '17px', width: '100%'
                                    }}
                                    />
                                    {/* <img src={`https://www.waterpurifierservicecenter.in/inet/img/service_img/${cityData.catbanner}`} alt={`${cityData?.categorydetail?.category_name}`} title={`${cityData?.categorydetail?.category_name}`} width={475} height={345} style={{
                                        borderRadius: '17px', width: '100%'
                                    }}
                                    /> */}
                                </div>

                                {/* handleCartLoading={handleCartLoading} */}
                                {/* addedServices={addedServices} */}
                                {/* state={cartChanged} */}
                                <ServicesList category={city} status={cityData.status} state={cartChanged} addedServices={addedServices} handleCartLoading={handleCartLoading} />
                            </div>
                            <div className="lg:w-5/12 cartContainer">
                                <div className="cart-body-section">

                                    <Cart
                                        cartLoaded={cartLoaded}
                                        cartLoadedToggle={handleCartLoading}
                                    // selectedServices={selectedServices}
                                    // total={totalAmount}
                                    // onRemove={handleRemoveFromCart}
                                    // onIncrement={handleIncrementService}
                                    // onDecrement={handleDecrementService}
                                    //   cartLoaded={cartLoaded}
                                    //   cartLoadedToggle={handleCartLoading}
                                    // onCartLoad={handleCartLoad}
                                    />
                                    <Assurance />
                                    <ServiceProcedure />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="common-spacing bg-white">


                </div>
                <div className="common-spacing">
                    <div className=" bg-white aboutStyle">
                        <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT {cityData.city_name}</h3>
                        <div
                            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                            className="serviceContentStyle"
                        />
                        {/* <div dangerouslySetInnerHTML={{ __html: cityData?.categorydetail?.category_content }} className="serviceContentStyle" /> */}
                    </div>
                </div>
                {/* <div className="bg-white common-spacing">
                    <h3 className="catgoreyTitle">Popular Brands of {cityData?.categorydetail?.category_name}</h3>
                    <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                        {cityData.brands?.map((city) => (
                            // brands
                            <div className='brandsServices '>
                                <a href={`${city.brand_url}`}>
                                    <li className='brand-btn-style'>
                                        {city.brand_name}
                                        <span></span>
                                    </li>
                                </a>
                            </div>
                        ))}
                    </div>
                </div> */}


            </div>

        );

};

export default City;