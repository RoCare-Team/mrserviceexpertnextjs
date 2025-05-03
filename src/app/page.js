'use client';

import React from 'react'

import RepairView from '../app/components/repairs/repairView';
import ServiceSection from '../app/components/servicesSection/servicesSection';


function home() {
    return (
        <div className='common-spacing'>
       
            {/*=================hero section================================== */}
            <div className="hero-section flex items-center  justify-around">

                <div className="leftHeroPortion w-7/12 py-2.5 flex items-center justify-end">
                    <img src="/assets/images/BannerImg.webp" alt="Our Services" width={600} height='auto' title='Our Services' />
                </div>

                <div className="rightHeroDetails w-5/12 flex flex-col items-start justify-between  pl-2 pr-2">
                    <div>
                        <h1 className='heroHeading'><b>Fast, Trusted Home Appliance service -  Mr. Service Expert</b></h1>
                        <span><a href="tel:+91 9311587744" title='For calling contact +91 9311587744'><button className='book-btn-style' aria-label="Open menu">Call Now</button></a> for reliable home appliance care that protects what matters most  </span>
                        <p className='text-xl'>Ensuring your familys comfort and convenience with expert installation and repair services</p>
                        <div className="benifits">
                           <ul>
                           <li>✓<strong>Advanced RO system maintenance</strong></li>
                            <li>✓<strong>Same-day emergency repairs</strong></li>
                            <li>✓<strong>Professional technicians at your doorstep</strong></li>
                           </ul>
                            {/* <button className='book-btn-style'> Book Now</button> */}
                        </div>
                    </div>

                    {/* <div className='heroContact'>
                         <span><a href="tel:+91 9311587744" title='For calling contact +91 9311587744'><button className='book-btn-style' aria-label="Open menu">Call Now</button></a> for reliable home appliance care that protects what matters most  </span> 
                    </div> */}
                </div>
            </div>

            <div className=' serviceBannerSection'>
                <img src="assets/images/home-appliaces.webp" alt='home-appliances' className='serviceBanner'  title='home-appliances' height="auto" width={1314} />
            </div>

            <ServiceSection />
            

            <div>
                {/* <h3>Explore Our Services</h3> */}
                <div className="pt-2 pb-2" style={{
                    display: 'none'
                }}>
                    {/* <Slider /> */}
                </div>

                <div>
                    <RepairView />
                </div>
            </div>

            <div className="chooseUs p-4">

                <div className='flex justify-center items-start'>
                    <h3 className='text-center chooseStar  '>Why Choose Us</h3>
                    <span><img src="assets/images/star.webp" alt="choose us" className='w-10' title='choose us'  width="40px" height="auto" /></span>
                </div>

                <div className="chooseSplits">
                    <div className=' text-center'>
                       <div className="benfits-card">
                       <span className="CountNumber">20,000+</span>
                       <p>Retail Stores – Trusted Nationwide</p>
                       </div>
                    </div>

                    <div className=' text-center'>
                    <div className="benfits-card">
                        <span className="CountNumber">300+</span>
                        <p>Brands Covered – Comprehensive Service</p>
                        </div>
                    </div>

                    <div className=' text-center'>
                    <div className="benfits-card">
                        <span className="CountNumber">8 Million+</span>
                        <p>Happy Customers – Your Satisfaction, Our Priority</p>
                        </div>
                    </div>

                </div>

            </div>



        </div>
    )
}

export default home