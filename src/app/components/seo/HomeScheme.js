'use client';
import Script from 'next/script';

export default function HomeScheme() {
  return (
    <>
         <Script
          id="localBusiness-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
        
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
        
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
    </>
  );
}
