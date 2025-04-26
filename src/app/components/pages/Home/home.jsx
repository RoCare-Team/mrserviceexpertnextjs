import React from 'react'
import ServiceBar from '../../service/ServiceBar';
import Slider from '../../imgSlider/index';
import RepairView from '../../repairs/repairView';
import ServiceSection from '../../servicesSection/servicesSection';
import Star from '../../../assets/images/star.png';
import BannerImage from '../../../assets/images/BannerImg2.jpg';
import serviceBanner from '../../../assets/images/home-appliaces.webp';


function home() {
    return (
        <div className='common-spacing'>


            {/*=================hero section================================== */}
            <div className="hero-section flex items-center  justify-around">
                <div className="leftHeroPortion w-7/12 py-2.5 flex items-center justify-end">
                    <img src={BannerImage} alt="" />
                </div>
                <div className="rightHeroDetails w-5/12 flex flex-col items-start justify-between  pl-2 pr-2">
                    <div>
                        <h3 className='heroHeading'>Fast, Reliable Home Appliance Service – Right at Your Doorstep</h3>
                        <p className='text-xl'>Ensuring your family's comfort and convenience with expert installation and repair services</p>
                        <div className="benifits">
                            <li>✓<strong>Advanced RO system maintenance</strong></li>
                            <li>✓<strong>Same-day emergency repairs</strong></li>
                            <li>✓<strong>Professional technicians at your doorstep</strong></li>
                            {/* <li>✓ <strong>Geyser Installation & Troubleshooting</strong></li>
                            <li>✓ <strong>Microwave Oven Repairs</strong></li>
                            <li>✓ <strong>LED TV Setup & Servicing</strong></li> */}
                        </div>
                    </div>

                    <div className='heroContact'>
                        <span>Call us now at <a href="tel:+91 9268887770"><b>9268887770</b></a>  for reliable home appliance care that protects what matters most</span>
                    </div>
                </div>
            </div>

            {/*=========================bar=====section============================================= */}
            {/* <div>
                <ServiceBar
                    headText="Reliable Home Appliance Services at Your Doorstep!"
                    servicePara="From RO purifiers to refrigerators, washing machines, air conditioners, and more — get expert installation, maintenance, and repair services by trained professionals. Enjoy hassle-free, same-day support and keep your home running smoothly with our trusted appliance care solutions."
                />

            </div> */}

            <div className=' serviceBannerSection'>
                <img src={serviceBanner} alt='Service Banner' className='serviceBanner'  />
            </div>

            <ServiceSection />

            <div>
                {/* <h3>Explore Our Services</h3> */}
                <div className="pt-2 pb-2" style={{
                    display: 'none'
                }}>
                    <Slider />
                </div>

                <div>
                    <RepairView />
                </div>
            </div>

            <div className="chooseUs p-4">

                <div className='flex justify-center items-start'>
                    <h3 className='text-center chooseStar  '>Why Choose Us</h3>
                    <span><img src={Star} alt="" className='w-10' /></span>
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