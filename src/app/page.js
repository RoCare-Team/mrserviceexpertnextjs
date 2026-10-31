import React from "react";
import { Phone, Star, MapPin, Users, Store, Tag, Info, CheckCircle2, ArrowRight } from "lucide-react";
import RepairView from "../app/components/repairs/repairView";
import ServiceSection from "../app/components/servicesSection/servicesSection";
import HomeCareService from "./components/servicesSection/homeCareService";
import { HANDYMAN_SERVICES } from "@/lib/homeCare";
import PopularCities from "./components/popularCities/PopularCities";
import OtherCities from "./components/popularCities/OtherCities";
import CollapsibleBlock from "./components/public/CollapsibleBlock";
import { Container, Section, Card, CardTitle, TrustStrip, btnPrimary, btnGhost, PHONE, PHONE_DISPLAY } from "./components/public/ui";

// The Homepage Cities block is admin-managed, so the page is revalidated
// instead of being frozen at build time. Five minutes keeps the homepage
// served from cache for almost every visitor while admin edits still
// appear without a redeploy.
export const revalidate = 300;

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Mr Service Expert",
  image: { "@type": "ImageObject", url: "https://www.mrserviceexpert.com/assets/images/serviceLogo.webp" },
  url: "https://www.mrserviceexpert.com",
  telephone: "+91-9311587744",
  email: "info@mrserviceexpert.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "8th Floor, Head Office, JMD MEGAPOLIS, Sector 48",
    addressLocality: "Gurgaon",
    postalCode: "122008",
    addressRegion: "Haryana",
    addressCountry: { "@type": "Country", name: "IN" },
  },
  geo: { "@type": "GeoCoordinates", latitude: 28.4595, longitude: 77.0266 },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  serviceArea: { "@type": "AdministrativeArea", name: "India" },
  sameAs: ["https://www.facebook.com/MrServiceExpert/", "https://www.linkedin.com/company/mr-service-expert/", "https://x.com/mrserviceexpert"],
  priceRange: "₹399+",
  description:
    "Mr Service Expert is a trusted name in home appliance repair across India. We provide reliable services for RO purifiers, ACs, refrigerators, washing machines, geysers, and more.",
  aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 679554, bestRating: 5, worstRating: 1 },
  review: {
    "@type": "Review",
    author: { "@type": "Person", name: "Amzad Khan" },
    datePublished: "2025-02-01",
    reviewBody: "Excellent service! My RO System was repaired quickly and efficiently.",
    reviewRating: { "@type": "Rating", ratingValue: 5 },
  },
};

const FAQS = [
  ["What home appliances do you service?", "Mr Service Expert offers repair, installation, and maintenance services for RO water purifiers, air conditioners, washing machines, and refrigerators."],
  ["How can I book a service with Mr Service Expert?", "You can easily book a service by visiting our website at https://www.mrserviceexpert.com or by calling our customer care number."],
  ["Do you provide doorstep service for RO water purifiers?", "Yes, Mr Service Expert offers doorstep service for all types of RO water purifiers, including installation, filter replacement, and maintenance."],
  ["What types of air conditioners do you repair?", "We repair split ACs, window ACs, inverter ACs, and central air conditioning systems for residential and commercial clients."],
  ["Do you repair front-load and top-load washing machines?", "Yes, we service all models and brands of front-load, top-load, and semi-automatic washing machines with expert technicians."],
  ["Is there a warranty on your repair services?", "Yes, we provide a limited service warranty on most repairs. Warranty details are shared at the time of service booking."],
  ["How much does an AC service cost?", "AC servicing starts from ₹399. The final cost depends on the type of service and any spare parts required."],
  ["Are your technicians verified?", "Yes, all Mr Service Expert technicians are background-verified, trained, and experienced in appliance repair and servicing."],
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mrserviceexpert.com" },
    { "@type": "ListItem", position: 2, name: "RO Water Purifier", item: "https://www.mrserviceexpert.com/ro-water-purifier" },
    { "@type": "ListItem", position: 3, name: "AC Service", item: "https://www.mrserviceexpert.com/ac" },
    { "@type": "ListItem", position: 4, name: "Washing Machine Service", item: "https://www.mrserviceexpert.com/washing-machine-repair" },
    { "@type": "ListItem", position: 5, name: "Refrigerator Service", item: "https://www.mrserviceexpert.com/refrigerator-repair" },
  ],
};

const GTM = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WXFVRZGM');`;

const STATS = [
  { icon: Store, value: "20,000+", label: "Retail stores", hint: "Trusted nationwide" },
  { icon: Tag, value: "300+", label: "Brands covered", hint: "Every major make and model" },
  { icon: Users, value: "8 Million+", label: "Happy customers", hint: "Your satisfaction, our priority" },
  { icon: MapPin, value: "1500+", label: "Cities served", hint: "Doorstep service across India" },
];

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GTM }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* ---------------- Hero ---------------- */}
      <Container className="pt-4 sm:pt-6">
        <header className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[var(--shadow-md)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(820px 340px at 8% -12%, rgba(109,42,216,0.12), transparent 60%), radial-gradient(640px 300px at 96% -4%, rgba(246,162,30,0.12), transparent 55%)",
            }}
          />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:p-12">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-purple-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> India&apos;s trusted appliance care
              </p>
              <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-tight text-[var(--ink)] sm:text-[40px] lg:text-[46px]">
                Fast, Trusted Home Appliance Service <span className="text-purple-700">at Your Doorstep</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--body-text)] sm:text-[17px]">
                Mr. Service Expert sends verified technicians for RO, AC, washing machine, refrigerator, geyser and every other home appliance — same day, with genuine parts and upfront prices.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#appliances" className={btnPrimary}>
                  Book a service <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href={`tel:${PHONE}`} className={btnGhost} title={`Call ${PHONE_DISPLAY}`}>
                  <Phone className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
                </a>
              </div>
              <ul className="mt-6 grid gap-2 text-[14px] text-[var(--ink-soft)] sm:grid-cols-3">
                {["Advanced RO system maintenance", "Same-day emergency repairs", "Professional technicians at your doorstep"].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span className="font-medium">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[var(--muted)]">
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> 4.8 <span className="font-normal text-[var(--muted)]">(6.7 lakh+ reviews)</span>
                </span>
                <span>8M+ happy customers</span>
                <span>1500+ cities</span>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] shadow-[var(--shadow-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/homeBanner.webp" alt="Mr. Service Expert technician at a customer's home" title="Our Services" width={600} height={450} loading="eager" className="h-auto w-full object-cover" />
              </div>
              <div className="absolute -bottom-3 left-4 hidden items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 shadow-[var(--shadow-md)] sm:flex">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[13px] leading-tight">
                  <b className="block text-[var(--ink)]">Technician in 30 min</b>
                  <span className="text-[var(--muted)]">Doorstep, same day</span>
                </span>
              </div>
            </div>
          </div>
          <div className="relative border-t border-[var(--line)] bg-[var(--surface-soft)]/70 px-5 py-3.5 sm:px-8 lg:px-12">
            <TrustStrip />
          </div>
        </header>
      </Container>

      {/* ---------------- Services ---------------- */}
      <Container>
        <Section>
          <ServiceSection />
        </Section>
        <Section className="!pt-0">
          <HomeCareService />
        </Section>
        <Section className="!pt-0">
          <HomeCareService title="Handyman services" services={HANDYMAN_SERVICES} />
        </Section>
      </Container>

      {/* ---------------- Brands ---------------- */}
      <Container>
        <Section className="!pt-0">
          <RepairView />
        </Section>
      </Container>

      {/* ---------------- Numbers ---------------- */}
      <Container>
        <Section className="!pt-0">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, value, label, hint }) => (
              <li key={label} className="flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 leading-tight">
                  <b className="block truncate text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">{value}</b>
                  <span className="block truncate text-[13px] font-semibold text-[var(--ink-soft)]">{label}</span>
                  <span className="hidden truncate text-[11px] text-[var(--muted)] sm:block">{hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      {/* ---------------- About ---------------- */}
      <Container>
        <Section className="!pt-0">
          <Card className="p-5 sm:p-7">
            <CardTitle icon={Info} title="About Mr. Service Expert — India's trusted home appliance service brand" />
            <CollapsibleBlock className="prose-site" maxHeight="15em">
              <p>
                Mr Service Expert is one of India&apos;s most trusted names in home appliance repair and maintenance. We are committed to delivering high-quality service for all major home appliances right at your doorstep. With a network spread across every major Indian city, we aim to make appliance care simple, affordable and accessible for every home.
              </p>
              <p>
                We specialize in service and repair of RO water purifiers, air conditioners, refrigerators, washing machines, kitchen chimneys, geysers, microwaves and many other appliances. Whether it&apos;s a regular checkup or an emergency breakdown, our expert technicians are just a call away.
              </p>
              <h2>Why choose Mr Service Expert</h2>
              <ul>
                <li><strong>Doorstep service in 1500+ cities:</strong> Fast, reliable home appliance repair services across India with prompt local technician assistance.</li>
                <li><strong>Trained and verified technicians:</strong> Professionally trained, background-verified experts skilled in repairing all major brands.</li>
                <li><strong>Quick turnaround with easy booking:</strong> Book easily via website or phone. Most services completed within 24 hours.</li>
                <li><strong>Affordable prices with no hidden charges:</strong> Transparent pricing. No surprises — pay only for what you get.</li>
                <li><strong>Genuine spare parts and approved tools:</strong> Only original parts and company-approved tools used for quality and warranty protection.</li>
                <li><strong>Service guarantee for customer satisfaction:</strong> Limited warranty on services with free follow-ups if the issue persists.</li>
              </ul>
              <h2>Why people trust Mr Service Expert</h2>
              <p>
                Millions of households across India trust Mr Service Expert because we prioritize quality, safety, and professionalism. Our customer-first approach, combined with industry expertise and modern service systems allow us to deliver a seamless and satisfying experience every time.
              </p>
              <p>From fixing a leaking RO system to installing a new air conditioner, our team handles every job with care, skill, and dedication.</p>
              <h2>Our coverage</h2>
              <p>
                We proudly serve customers in <strong>Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Noida, Gurgaon, Jaipur, Chandigarh, Bhopal, Indore, Lucknow, Patna</strong>, and all major Indian cities. Wherever you are, Mr. Service Expert is ready to help you.
              </p>
              <h2>Contact us</h2>
              <p>
                Need quick and professional service for your RO, AC, refrigerator, washing machine, or kitchen chimney? <strong>Mr Service Expert</strong> is just a call away. We provide doorstep service in all major Indian cities.
              </p>
              <p>
                <strong>Call us:</strong> <a href={`tel:${PHONE}`}>{PHONE_DISPLAY}</a>
                <br />
                <strong>Book online:</strong> <a href="https://www.mrserviceexpert.com">www.mrserviceexpert.com</a>
              </p>
            </CollapsibleBlock>
          </Card>
        </Section>
      </Container>

      {/* ---------------- Cities ---------------- */}
      <Container>
        <Section className="!pt-0 flex flex-col gap-4">
          <PopularCities />
          <OtherCities />
        </Section>
      </Container>
    </>
  );
}
