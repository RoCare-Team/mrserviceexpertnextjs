import React from 'react'
import ServiceBar from '../../service/ServiceBar';
import Slider from '../../imgSlider/index';
import RepairView from '../../repairs/repairView';
import ServiceSection from '../../servicesSection/servicesSection';
import Star from '../../../assets/images/star.png';
import BannerImage from '../../../assets/images/BannerImg2.jpg';
import StateServiceSection from '../../servicesSection/StateServiceSection';


function StateHome() {
    return (
        <div className='common-spacing'>


            {/*=================hero section================================== */}
            <div className="hero-section flex items-center  justify-center">
                <div className="leftHeroPortion col-7 py-2.5 flex items-center justify-end">
                    <a href="">  <img src={BannerImage} alt="" /></a>
                </div>
                <div className="rightHeroDetails col-5 flex flex-col items-start justify-between  pl-2 pr-2">
                    <div>
                        <h3 className='heroHeading'>Fast & Reliable Appliance Repairs – Delivered Straight to Your Door</h3>
                        <p className='text-xl'>Keeping your home running smoothly with expert installation and fast repair services.</p>
                        <div className="benifits">
                            <li>✓<strong>Expert RO system maintenance</strong></li>
                            <li>✓<strong>Emergency same-day repairs</strong></li>
                            <li>✓<strong>Skilled technicians at your doorstep</strong></li>
                            {/* <li>✓ <strong>Geyser Installation & Troubleshooting</strong></li>
                            <li>✓ <strong>Microwave Oven Repairs</strong></li>
                            <li>✓ <strong>LED TV Setup & Servicing</strong></li> */}
                        </div>
                    </div>

                    <div className='heroContact'>
                        <span>Call us now at <a href="tel:+91 9268887770" className='text-black'><button className='cta-btn'><b>9268887770</b></button></a>  for reliable home appliance care that protects what matters most</span>
                    </div>
                </div>
            </div>

            {/*=========================bar=====section============================================= */}
            <div>
                <ServiceBar
                    headText="Reliable Home Appliance Services at Your Doorstep!"
                    servicePara="From RO purifiers to refrigerators, washing machines, air conditioners, and more — get expert installation, maintenance, and repair services by trained professionals. Enjoy hassle-free, same-day support and keep your home running smoothly with our trusted appliance care solutions."
                />

            </div>

            <StateServiceSection />

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

            <div className="chooseUs p-2.5">

                <div className='flex justify-center items-start'>
                    <h3 className='text-center chooseStar  '>Why Choose Us</h3>
                    <span><img src={Star} alt="" className='w-10' /></span>
                </div>

                <div className="chooseSplits">
                    <div className='col-4 text-center'>
                        <span className="CountNumber">20,000+</span>
                        <p>Retail Stores  – Trusted Nationwide</p>
                    </div>

                    <div className='col-4 text-center'>
                        <span className="CountNumber">300+</span>
                        <p>Brands Covered  – Comprehensive Service</p>
                    </div>

                    <div className='col-4 text-center'>
                        <span className="CountNumber">8 Million+</span>
                        <p>Happy Customers  – Your Satisfaction, Our Priority</p>
                    </div>

                </div>

            </div>



        </div>
    )
}

export default StateHome