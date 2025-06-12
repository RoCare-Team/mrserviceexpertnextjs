import React from 'react';
import Head from 'next/head';
import RepairView from '../app/components/repairs/repairView';
import ServiceSection from '../app/components/servicesSection/servicesSection';
import HomeCareService from './components/servicesSection/homeCareService';

const Home = () => {
  // ✅ 1. LocalBusiness schema
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
      "addressCountry": { "@type": "Country", "name": "IN" }
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.4595,
      "longitude": 77.0266
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "serviceArea": { "@type": "AdministrativeArea", "name": "India" },
    "sameAs": [
      "https://www.facebook.com/MrServiceExpert/",
      "https://www.linkedin.com/company/mr-service-expert/",
      "https://x.com/mrserviceexpert"
    ],
    "priceRange": "₹399+",
    "description": "Mr Service Expert is a trusted name in home appliance repair across India...",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.8,
      "reviewCount": 679554,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Amzad Khan" },
      "datePublished": "2025-02-01",
      "reviewBody": "Excellent service! My RO System was repaired quickly and efficiently.",
      "reviewRating": { "@type": "Rating", "ratingValue": 5 }
    }
  };

  // ✅ 2. FAQ schema
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
      }
    ]
  };

  // ✅ 3. Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mrserviceexpert.com" },
      { "@type": "ListItem", "position": 2, "name": "RO Water Purifier", "item": "https://www.mrserviceexpert.com/ro-water-purifier" },
      { "@type": "ListItem", "position": 3, "name": "AC Service", "item": "https://www.mrserviceexpert.com/ac" },
      { "@type": "ListItem", "position": 4, "name": "Washing Machine Service", "item": "https://www.mrserviceexpert.com/washing-machine-repair" },
      { "@type": "ListItem", "position": 5, "name": "Refrigerator Service", "item": "https://www.mrserviceexpert.com/refrigerator-repair" }
    ]
  };

  return (
    <>
      {/* ✅ Schema in Head */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              localBusinessSchema,
              faqSchema,
              breadcrumbSchema
            ])
          }}
        />
      </Head>


      {/* ✅ Your page UI starts here */}
      <div className="common-spacing">
        <div className="hero-section flex items-center justify-around">
          <div className="leftHeroPortion w-7/12 py-2.5 flex items-center justify-end">
            <img src="/assets/images/homeBanner.webp" alt="Our Services" width={600} height="auto" />
          </div>

          <div className="rightHeroDetails w-5/12 flex flex-col items-start justify-between pl-2 pr-2">
            <h1 className="heroHeading">
              <b>Fast, Trusted Home Appliance Service - Mr. Service Expert</b>
            </h1>
            <a href="tel:+91 9311587715">
              <button className="book-btn-style">Call Now</button>
            </a>
            <p className="text-xl hidden lg:block">Expert installation and repair services for your home</p>
          </div>
        </div>

        {/* ✅ Service Sections */}
        <div className="my-8">
          <ServiceSection />
        </div>

        <div className="my-8">
          <HomeCareService />
        </div>

        <div className="my-8">
          <RepairView />
        </div>

        {/* ✅ About Section (Shortened) */}
        <div className="common-spacing mt-2 bg-white p-4">
          <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT</h3>
          <p>We are India’s most trusted home appliance repair brand serving 1500+ cities with genuine spare parts and trained technicians. Book your RO, AC, Refrigerator, or Washing Machine service today!</p>
          <p>
            <b>Call Us:</b> <a href="tel:+919311587715">+91-9311587715</a><br />
            <b>Book Online:</b> <a href="https://www.mrserviceexpert.com">www.mrserviceexpert.com</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
