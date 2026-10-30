// JSON-LD blocks for the /{city}/{cat} pages. Moved out of ServicePage.jsx
// unchanged so the page component stays readable; AC and RO pages carry
// their own breadcrumb / service / FAQ / organisation schemas, and
// /bangalore/ro-water-purifier adds a Product schema.

const SITE = "https://www.mrserviceexpert.com";

const ORG = (reviewCount) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mr Service Expert",
  url: SITE,
  logo: `${SITE}/assets/images/serviceLogo.webp`,
  aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, reviewCount, worstRating: 1 },
  contactPoint: { "@type": "ContactPoint", telephone: "+91-9311587715", contactType: "Customer Service", areaServed: "IN", availableLanguage: ["English", "Hindi"] },
  sameAs: ["https://www.facebook.com/mrserviceexpert", "https://www.linkedin.com/company/mr-service-expert/", "https://twitter.com/mrserviceexper4/"],
  address: { "@type": "PostalAddress", streetAddress: "8th Floor, Head Office, JMD MEGAPOLIS, Sector 48", addressLocality: "Gurgaon", addressRegion: "Haryana", postalCode: "122018", addressCountry: "IN" },
  description:
    "Mr Service Expert is a trusted name in home appliance repair across India. We provide reliable RO Water purifiers Repair &, AC repair & services, refrigerators service, washing machines service, geysers service, and more",
});

const faq = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
});

const crumbs = (name, items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  name,
  itemListElement: items.map(([n, item], i) => ({ "@type": "ListItem", position: i + 1, name: n, item })),
});

export function schemasFor(city, cat) {
  const out = [];

  if (cat === "ac") {
    out.push(
      crumbs(`AC Service ${city} Breadcrumbs`, [
        ["Voltas AC Service", `${SITE}/${city}/voltas/ac`],
        ["Blue Star AC Service", `${SITE}/${city}/blue-star/ac`],
        ["Daikin AC Service", `${SITE}/${city}/daikin/ac`],
        ["LG AC Service", `${SITE}/${city}/lg/ac`],
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `AC Service ${city}`,
        serviceType: ["Air Conditioner Service", "AC Repair", "AC Installation"],
        url: `${SITE}/${city}/ac`,
        areaServed: { "@type": "Place", name: city },
        description:
          "Mr Service Expert provides professional air conditioner services. We specialize in AC repair, installation, and maintenance for both window and split units.",
      },
      faq([
        [`What are the AC service charges in ${city}?`, "AC service charges start from ₹299 depending on the type of service."],
        ["How can I book an AC service with Mr Service Expert?", `You can book AC service through our website ${SITE}/${city}/ac or by calling customer support.`],
        ["Do you provide both AC service and installation?", "Yes, we offer servicing, repair, and installation for window and split ACs."],
      ]),
      ORG(145078)
    );
  }

  if (cat === "ro-water-purifier") {
    out.push(
      crumbs(`RO Water Purifier Service ${city} Breadcrumbs`, [
        ["Kent RO Service", `${SITE}/${city}/kent/ro-water-purifier`],
        ["Pureit RO Service", `${SITE}/${city}/pureit/ro-water-purifier`],
        ["Aquafresh RO Service", `${SITE}/${city}/aquafresh/ro-water-purifier`],
        ["Livpure RO Service", `${SITE}/${city}/livpure/ro-water-purifier`],
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `RO Service ${city}`,
        serviceType: ["RO Service", "RO Repair", "RO Installation"],
        url: `${SITE}/${city}/ro-water-purifier`,
        areaServed: { "@type": "Place", name: `${city}` },
        description: `Mr Service Expert offers professional RO water purifier services in ${city}, including installation, repair, and maintenance. We service all major RO brands with fast, reliable, and affordable doorstep support.`,
      },
      faq([
        [
          `What are the RO water purifier service charges in ${city}?`,
          `Mainly RO service charges in ${city} start at ₹299 and may vary depending on the type of service—installation, repair, or filter replacement.`,
        ],
        [
          "How can I book RO water purifier service with Mr Service Expert?",
          `Booking is very easy. Just call us at +91 9311587715 or visit our website to book your service. We’ll confirm your appointment and send a technician to your doorstep in ${city}.`,
        ],
        [
          `Do you provide both RO installation and repair services in ${city}?`,
          "Yes, Mr Service Expert offers complete RO solutions, including installation, repair, maintenance, and filter replacements for all major brands.",
        ],
        [
          `Where can I find reliable RO service near me in ${city}?`,
          `If you're in ${city}, Mr Service Expert is a trusted name for doorstep RO service with trained technicians and transparent pricing.`,
        ],
        [
          `Why choose Mr Service Expert over other RO service providers in ${city}?`,
          "Mr Service Expert stands out for its skilled and experienced technicians, transparent pricing starting at ₹299, and quick, reliable doorstep service.",
        ],
      ]),
      ORG(173078)
    );

    if (city === "bangalore") {
      out.push({
        "@context": "https://schema.org/",
        "@type": "Product",
        name: `RO Service ${city}`,
        description: `Mr Service Expert offers professional water purifier service in ${city} starting at ₹399. We provide complete solutions including RO servicing, water purifier repair service, RO installation, and filter change. Whether you're searching for RO service near me, RO repair near me, or reverse osmosis system maintenance, our expert technicians are just a call away. Get reliable and affordable RO and water purifier service from a trusted local provider.`,
        image: "https://www.waterpurifierservicecenter.in/inet/img/service_img/data-ROUTINE%20SERVICE%20700X700.webp",
        brand: { "@type": "Brand", name: "Mr Service Expert" },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: "399",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
          url: `${SITE}/${city}/ro-water-purifier`,
        },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.7", reviewCount: "7931" },
        review: [
          {
            "@type": "Review",
            author: { "@type": "Person", name: "Ravi Mehra" },
            reviewBody:
              "I booked water purifier service near me and was very satisfied. The technician from Mr Service Expert arrived on time, serviced my RO system professionally, and the charges were reasonable.",
            reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
          },
          {
            "@type": "Review",
            author: { "@type": "Person", name: "Sameer" },
            reviewBody: `Needed RO repair service in ${city} and contacted Mr Service Expert. They provided excellent support for my reverse osmosis system. Definitely recommended.`,
            reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
          },
        ],
      });
    }
  }

  return out;
}

/** Visible FAQ rows: the five from the DB (with defaults) + RO extras. */
export function faqItemsFor({ content, city, cat }) {
  const c = content || {};
  const items = [
    { q: c.faqquestion1 || "Do you provide AC repair for all brands in Delhi?", a: c.faqanswer1 || "Yes, we repair all major AC brands including LG, Samsung, Voltas, Daikin, Blue Star, and more." },
    { q: c.faqquestion2 || "Is gas refilling available for split and window ACs?", a: c.faqanswer2 || "Yes, we offer AC gas refilling, servicing, and installation for both split and window ACs." },
    { q: c.faqquestion3 || "What types of washing machines do you repair?", a: c.faqanswer3 || "We repair front load, top load, semi-automatic, and fully automatic washing machines." },
    { q: c.faqquestion4 || "Do you use genuine spare parts?", a: c.faqanswer4 || "Yes, we use 100% original and brand-certified parts for all washing machine repairs." },
    { q: c.faqquestion5 || "How often should I get my RO serviced?", a: c.faqanswer5 || "It’s recommended every 3–6 months to ensure water purity and machine efficiency." },
  ];
  if (cat === "ro-water-purifier") {
    items.push(
      {
        q: `What are the signs that my RO water purifier needs immediate service in ${city}?`,
        a: `Over time, your RO system may show signs such as an unusual taste or odor in the water, slow filtration, or leakage. If you are in ${city} and are noticing any of these symptoms, it's time to book a professional RO service to ensure clean and safe drinking water.`,
      },
      {
        q: `Why and when should I get RO service in ${city}?`,
        a: `In ${city}, regular RO service is important due to high TDS levels, water hardness and seasonal contamination - especially during monsoons and summers. Getting your RO purifier serviced every 3 to 6 months helps maintain water quality, improve filtration performance, prevent bad taste or odour, and extend the life of the purifier. Timely maintenance also reduces the risk of health problems caused by unfiltered or impure water.`,
      },
      {
        q: `What is the cost of RO service in ${city}?`,
        a: `RO servicing in ${city} starts at ₹399 with Mr. Service Expert. This includes a doorstep visit, inspection, and basic servicing by certified technicians. If any filters or parts need replacement, charges are communicated transparently before proceeding. We offer same-day service, cover all major RO brands, and ensure no hidden fees — trusted by thousands across ${city} for reliable RO care, only at Mr. Service Expert.`,
      },
      {
        q: `Does Mr. Service Expert provide RO service for Kent, Aquaguard, and Livpure in ${city}?`,
        a: `Yes, Mr. Service Expert offers certified RO service in ${city} for all major brands including Kent, Aquaguard, Pureit, Livpure, AO Smith, and more—covering installation, repair, and AMC plans at your doorstep.`,
      },
      {
        q: `Can I book RO service in ${city} just by calling?`,
        a: `Yes, booking RO service in ${city} is simple and flexible with Mr. Service Expert. You can either call us directly at +91-9311587715 or book instantly through our official website. Whichever way you choose, we guarantee a same-day visit by a certified RO technician, right at your doorstep—no delays, no hassle.`,
      }
    );
  }
  return items;
}
