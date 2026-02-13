
import React from 'react';
import RepairView from '../app/components/repairs/repairView';
import ServiceSection from '../app/components/servicesSection/servicesSection';
import HomeCareService from './components/servicesSection/homeCareService';

const home = () => {

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Mr Service Expert",
    "image": {
      "@type": "ImageObject",
      "url": "https://www.mrserviceexpert.com/assets/images/serviceLogo.webp"
    },
    "url": "https://www.mrserviceexpert.com",
    "telephone": "+91-9311587744",
    "email": "info@mrserviceexpert.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "8th Floor, Head Office, JMD MEGAPOLIS, Sector 48",
      "addressLocality": "Gurgaon",
      "postalCode": "122008",
      "addressRegion": "Haryana",
      "addressCountry": {
        "@type": "Country",
        "name": "IN"
      }
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.4595,
      "longitude": 77.0266
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "serviceArea": {
      "@type": "AdministrativeArea",
      "name": "India"
    },
    "sameAs": [
      "https://www.facebook.com/MrServiceExpert/",
      "https://www.linkedin.com/company/mr-service-expert/",
      "https://x.com/mrserviceexpert"
    ],
    "priceRange": "₹399+",
    "description": "Mr Service Expert is a trusted name in home appliance repair across India. We provide reliable services for RO purifiers, ACs, refrigerators, washing machines, geysers, and more.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.8,
      "reviewCount": 679554,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Amzad Khan"
      },
      "datePublished": "2025-02-01",
      "reviewBody": "Excellent service! My RO System was repaired quickly and efficiently.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 5
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What home appliances do you service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mr Service Expert offers repair, installation, and maintenance services for RO water purifiers, air conditioners, washing machines, and refrigerators."
        }
      },
      {
        "@type": "Question",
        "name": "How can I book a service with Mr Service Expert?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can easily book a service by visiting our website at https://www.mrserviceexpert.com or by calling our customer care number."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide doorstep service for RO water purifiers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Mr Service Expert offers doorstep service for all types of RO water purifiers, including installation, filter replacement, and maintenance."
        }
      },
      {
        "@type": "Question",
        "name": "What types of air conditioners do you repair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We repair split ACs, window ACs, inverter ACs, and central air conditioning systems for residential and commercial clients."
        }
      },
      {
        "@type": "Question",
        "name": "Do you repair front-load and top-load washing machines?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we service all models and brands of front-load, top-load, and semi-automatic washing machines with expert technicians."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a warranty on your repair services?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide a limited service warranty on most repairs. Warranty details are shared at the time of service booking."
        }
      },
      {
        "@type": "Question",
        "name": "How much does an AC service cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AC servicing starts from ₹399. The final cost depends on the type of service and any spare parts required."
        }
      },
      {
        "@type": "Question",
        "name": "Are your technicians verified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all Mr Service Expert technicians are background-verified, trained, and experienced in appliance repair and servicing."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.mrserviceexpert.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "RO Water Purifier",
        "item": "https://www.mrserviceexpert.com/ro-water-purifier"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "AC Service",
        "item": "https://www.mrserviceexpert.com/ac"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Washing Machine Service",
        "item": "https://www.mrserviceexpert.com/washing-machine-repair"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Refrigerator Service",
        "item": "https://www.mrserviceexpert.com/refrigerator-repair"
      }
    ]
  };

  return (
    <>
      {/* <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var script = document.createElement('script');
              script.async = true;
              script.src = 'https://www.googletagmanager.com/gtag/js?id=G-GFJQZF71K8';
              document.head.appendChild(script);
              
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GFJQZF71K8');
            })();
          `
        }}
      /> */}
      <script
        dangerouslySetInnerHTML={{
          __html:

            `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WXFVRZGM');
        
        `

        }}




      />


      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />



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
              <span><a href="tel:+91 9311587715" title='For calling contact +91 9311587715'><button className='book-btn-style' aria-label="Open menu">Call Now</button></a></span>
              <p className='text-xl hidden lg:block'>Ensuring your familys comfort and convenience with expert installation and repair services</p>
              <div className="benifits hidden lg:block">
                <ul>
                  <li>✓<strong>Advanced RO system maintenance</strong></li>
                  <li>✓<strong>Same day emergency repairs</strong></li>
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

        <div className='my-8'>
          <HomeCareService />
        </div>

        {/* <div className='my-8'>
                <ServiceSection />
            </div> */}

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

            <h2 className="text-primary mb-4">{"India's Trusted Home Appliance Service Brand"}</h2>

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
              <a href="tel:+919311587715" style={{ color: '#007bff', textDecoration: 'underline' }}>+91-9311587715</a>
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




      </div></>
  )
}

export default home