'use client';

import React from 'react'

import RepairView from '../app/components/repairs/repairView';
import ServiceSection from '../app/components/servicesSection/servicesSection';
const reviewer = [
    {
        id: "1",
        reviewerName: "Rahul",
        reviewerLocation: "Delhi",
        reviewerRating: "4.5",
        reviewerContent: "It's a good Product from Mr Service Expert. Water Purifier price is good. Delive installation was prompt. The water quality is good. The device settings were explained very clearly and setup of the device was very quick and hassle free"

    }

]


function home() {
    return (
        <div className='common-spacing'>

            {/*=================hero section================================== */}
            <div className="hero-section flex items-center  justify-around">

                <div className="leftHeroPortion w-7/12 py-2.5 flex items-center justify-end">
                    {/* <img src="/assets/images/BannerImg.webp" alt="Our Services" width={600} height='auto' title='Our Services' /> */}
                    <img src="/assets/images/homeBanner.webp" alt="Our Services" width={600} height='auto' title='Our Services' />
                </div>

                <div className="rightHeroDetails w-5/12 flex flex-col items-start justify-between  pl-2 pr-2">
                    <div className='flex flex-col gap-4'>
                        <h1 className='heroHeading'><b>Fast, Trusted Home Appliance Service -  Mr. Service Expert</b></h1>
                        <span><a href="tel:+91 9311587744" title='For calling contact +91 9311587744'><button className='book-btn-style' aria-label="Open menu">Call Now</button></a></span>
                        <p className='text-xl hidden lg:block'>Ensuring your familys comfort and convenience with expert installation and repair services</p>
                        <div className="benifits hidden lg:block">
                            <ul>
                                <li>✓<strong>Advanced RO system maintenance</strong></li>
                                <li>✓<strong>Same-day emergency repairs</strong></li>
                                <li>✓<strong>Professional technicians at your doorstep</strong></li>
                            </ul>
                           
                        </div>
                    </div>

                    {/* <div className='heroContact'>
                         <span><a href="tel:+91 9311587744" title='For calling contact +91 9311587744'><button className='book-btn-style' aria-label="Open menu">Call Now</button></a> for reliable home appliance care that protects what matters most  </span> 
                    </div> */}
                </div>
            </div>

            {/* <div className=' serviceBannerSection'>
                <img src="assets/images/home-appliaces.webp" alt='home-appliances' className='serviceBanner'  title='home-appliances' height="auto" width={1314} />
            </div> */}

            <div className='my-8'>
                <ServiceSection />
            </div>


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
                    <h3 className='text-center chooseStar  '>Why Choose Mr. Service Expert Services</h3>
                    <span><img src="assets/images/star.webp" alt="choose us" className='w-10' title='choose us' width="40px" height="auto" /></span>
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
             <div className="common-spacing chooseUs mt-2">
        <div className=" bg-white aboutStyle">
          <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT </h3>
    
  <h1 className="text-primary mb-4">{"India's Trusted Home Appliance Service Brand"}</h1>

  <p>
    Mr Service Expert is one of India&#39;s most trusted names in home appliance repair and maintenance.
    We are committed to delivering high-quality service for all major home appliances right at your doorstep.
    With a network spread across every major Indian city, we aim to make appliance care simple, affordable and accessible for every home.
  </p>

  <p>
    We specialize in service and repair of RO water purifiers, air conditioners, refrigerators, washing machines,
    kitchen chimneys, geysers, microwaves and many other appliances. Whether it&#39;s a regular checkup or an emergency breakdown,
    our expert technicians are just a call away.
  </p>

  <h2 className="mt-5">Why choose Mr Service Expert</h2>
  <ul>
    <li><strong>Doorstep Service in 1500+ Cities:</strong> Fast, reliable home appliance repair services across India with prompt local technician assistance.</li>
    <li><strong>Trained and Verified Technicians:</strong> Professionally trained, background-verified experts skilled in repairing all major brands.</li>
    <li><strong>Quick Turnaround with Easy Booking:</strong> Book easily via website or phone. Most services completed within 24 hours.</li>
    <li><strong>Affordable Prices with No Hidden Charges:</strong> Transparent pricing. No surprises—pay only for what you get.</li>
    <li><strong>Genuine Spare Parts and Approved Tools:</strong> Only original parts and company-approved tools used for quality and warranty protection.</li>
    <li><strong>Service Guarantee for Customer Satisfaction:</strong> Limited warranty on services with free follow-ups if the issue persists.</li>
  </ul>

  <h2 className="mt-5"><b>Why People Trust Mr Service Expert</b></h2>
  <p>
    Millions of households across India trust Mr Service Expert because we prioritize quality, safety, and professionalism.
    Our customer-first approach, combined with industry expertise and modern service systems allow us to deliver a seamless and satisfying experience every time.
  </p>
  <p>
    From fixing a leaking RO system to installing a new air conditioner, our team handles every job with care, skill, and dedication.
  </p>

  <h2 className="mt-5"><b>Our Coverage</b></h2>
  <p>
    We proudly serve customers in <strong>Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Noida, Gurgaon, Jaipur,
    Chandigarh, Bhopal, Indore, Lucknow, Patna</strong>, and all major Indian cities. Wherever you are, Mr. Service Expert is ready to help you.
  </p>

  <h2 className="mt-5"><b>Contact Us</b></h2>
  <p>
    Need quick and professional service for your RO, AC, refrigerator, washing machine, or kitchen chimney?
    <br />
    <strong>Mr Service Expert</strong> is just a call away. We provide doorstep service in all major Indian cities.
  </p>
  <p>
    <strong>Call Us:</strong>{' '}
    <a href="tel:+919311587744" style={{ color: '#007bff', textDecoration: 'underline' }}>+91-9311587744</a>
    <br />
    <strong>Book Online:</strong>{' '}
    <a
      href="https://www.mrserviceexpert.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#007bff', textDecoration: 'underline' }}
    >
      www.mrserviceexpert.com
    </a>
  </p>


    </div>
        </div>
     
            {/* reviewer section */}
            {/* <div >
                {reviewer.map((reviews) => (
                    <div key={reviews.id} className='bg-white flex justify-start items-start p-4 flex-col lg:w-2xs reviewerBody'>
                       <div>
                       {reviews.reviewerName} | {reviews.reviewerLocation}

                    
                       
                       </div>
                      <div className=''>
                        {reviews.reviewerContent}
                      </div>
                    </div>
                ))}
            </div> */}




        </div>
    )
}

export default home