"use client";

import React, { useEffect, useState } from "react";
import { Info, Phone, MessageCircle } from "lucide-react";
import Tabs from "@/app/components/pages/Services/AllServices";
import AllServicesList from "@/app/components/pages/Services/Services";
import ServicesList from "@/app/components/service/ServicesList";
import Cart from "@/app/components/cart/Cart";
import Assurance from "@/app/components/Assurance/Assurance";
import ServiceProcedure from "@/app/components/serviceProcedure/index";
import HomeCareService from "../../servicesSection/homeCareService";
import StoreLocator from "@/app/components/StoreLocator/StoreLocator";
import CollapsibleHtml from "@/app/components/collapsibleHtml/CollapsibleHtml";
import CollapsibleBlock from "@/app/components/public/CollapsibleBlock";
import LeadPopup from "@/app/components/public/LeadPopup";
import { HANDYMAN_SERVICES } from "@/lib/homeCare";
import { Container, Section, ServiceHero, TwoThirds, Card, CardTitle, PHONE, PHONE_DISPLAY } from "@/app/components/public/ui";

/** Small "talk to us" card for pages without a cart (city landing). */
function HelpCard({ city }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[image:var(--grad-brand-deep)] p-5 text-white shadow-[var(--shadow-md)]">
      <h2 className="text-[17px] font-bold">Not sure what you need?</h2>
      <p className="mt-1 text-sm text-white/80">Tell us the problem and we will send the right technician in {city}.</p>
      <div className="mt-4 flex flex-col gap-2">
        <a href={`tel:${PHONE}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-semibold text-purple-800 shadow-sm hover:bg-purple-50">
          <Phone className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
        </a>
        <a
          href="https://wa.me/919311587715"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 text-[15px] font-semibold text-white hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp us
        </a>
      </div>
    </section>
  );
}

/**
 * /{city} (status "1") — the city landing page, and /{category} (status "0")
 * — the category landing page. Both share the hero + 2/3 + 1/3 layout.
 */
export default function City({ city, cityData }) {
  const [cartChanged, setCartChanged] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [addedServices, setAddedServices] = useState([]);

  const handleCartLoading = () => {
    setCartLoaded((n) => n + 1);
    setCartChanged((v) => !v);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("service_name");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAddedServices(parsed.map((i) => i.id));
        setCartLoaded(true);
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }, []);

  const cityName = cityData?.city_name;

  // ---------------- City landing page ----------------
  if (cityData.status === "1") {
    return (
      <>
        <Container className="pt-4 sm:pt-6">
          <ServiceHero
            crumbs={[{ label: cityName }]}
            eyebrow={`Serving ${cityName}`}
            title={`Affordable Home Appliance Repair & Home Care Services in ${cityName}`}
            subtitle={`RO, AC, washing machine, refrigerator, geyser and more — repaired at your doorstep in ${cityName} by verified technicians. Plus deep cleaning, pest control and handyman services.`}
            image="/assets/cityBanner/Front Banner.webp"
            imageAlt={`Home appliance services in ${cityName}`}
          />
        </Container>

        <Container className="mt-6">
          <TwoThirds
            main={
              <div className="flex flex-col gap-5">
                <Tabs />
                <AllServicesList />
              </div>
            }
            aside={
              <div className="flex flex-col gap-4">
                <HelpCard city={cityName} />
                <Assurance />
                <ServiceProcedure />
              </div>
            }
          />
        </Container>

        <Container>
          <Section>
            <HomeCareService />
          </Section>
          <Section className="!pt-0">
            <HomeCareService title="Handyman services" services={HANDYMAN_SERVICES} />
          </Section>
        </Container>

        {cityData?.stores?.length > 0 && (
          <Container>
            <Section className="!pt-0">
              <StoreLocator stores={cityData.stores} city={cityName} />
            </Section>
          </Container>
        )}

        <Container>
          <Section className="!pt-0">
            <Card className="p-5 sm:p-7">
              <CardTitle icon={Info} title={`About Mr. Service Expert in ${cityName}`} />
              <CollapsibleBlock className="prose-site" maxHeight="16em">
                <h2>Best Home Appliance Repair Services in {cityName} – Mr. Service Expert</h2>
                <p>
                  Are your home appliances not working as they should? Welcome to Mr. Service Expert, the most trusted name for{" "}
                  <a href={`https://www.mrserviceexpert.com/${city}`}>
                    <b>home appliance repair in {cityName}</b>
                  </a>
                  . Whether it’s a <a href="https://www.mrserviceexpert.com/ro-water-purifier">RO water purifier</a>, air conditioner, washing machine, refrigerator, geyser, microwave oven, vacuum cleaner, or LED TV, we provide reliable and affordable repair services at your doorstep across {cityName}.
                </p>
                <p>We specialize in servicing all major brands with certified technicians who ensure 100% customer satisfaction. Our quick response and same-day home appliance repair in {cityName} make us the first choice for thousands of customers.</p>
                <h2>Mr. Service Expert Home Appliance Repair Services in {cityName}</h2>
                <h3>RO Water Purifier Repair in {cityName}</h3>
                <p>We offer doorstep RO water purifier repair services in {cityName} for all major brands. Whether it is filter replacement, motor repair, or complete installation, our trained technicians handle it all with precision and care.</p>
                <p>At Mr. Service Expert, we specialize in expert repair and maintenance for top RO water purifier brands like Kent, Aquaguard, Livpure, Pureit, AO Smith, Havells, Blue Star, and Tata Swach. We ensure your RO system delivers clean, safe, and healthy drinking water by using genuine spare parts and following brand-compliant service procedures. Trust us for prompt service, transparent pricing, and long-term performance of your water purifier across {cityName}.</p>
                <h3>AC Repair in {cityName}</h3>
                <p>Stay cool and comfortable with fast, professional AC repair in {cityName} from Mr. Service Expert. We offer same-day air conditioner repair, installation, and maintenance for all types of AC units, including split and window models. Whether your AC is not cooling, leaking water, or making noise, our certified technicians are equipped to fix it efficiently at your doorstep.</p>
                <p>We are a trusted name for servicing top AC brands such as Daikin, Voltas, Samsung, LG, Blue Star, Hitachi, Carrier, Godrej, Panasonic, and Whirlpool. From AC gas refilling and regular tune-ups to advanced diagnostics and part replacements, our team ensures a smooth and hassle-free experience. With expert service, genuine parts, and prompt support, Mr. Service Expert guarantees your AC stays in top condition—even during {cityName}’s harshest summers.</p>
                <h3>Washing Machine Repair in {cityName}</h3>
                <p>Facing leakage, noise, drainage issues, or drum malfunctions? At Mr. Service Expert, we provide professional washing machine repair in {cityName} for both automatic and semi-automatic models. Our expert technicians are trained to handle top-load and front-load washing machines from all leading brands, including LG, Samsung, IFB, Whirlpool, Bosch, Godrej, Panasonic, and Haier.</p>
                <p>Whether your machine is not spinning, making strange noises, or facing drainage problems, we offer quick and reliable doorstep service to restore your appliance to full functionality. As one of the best washing machine services in {cityName}, we use genuine spare parts and experienced service engineers to ensure smooth performance and long-lasting repairs for all top-load and front-load washing machines across the city.</p>
                <h3>Refrigerator Repair in {cityName}</h3>
                <p>At Mr. Service Expert, our refrigerator repair experts in {cityName} are trained to handle a wide range of issues — from cooling problems and unusual noises to water leakage and complete compressor failure. We provide reliable and efficient refrigerator repair services in {cityName}, ensuring that your fridge runs smoothly and preserves your food safely.</p>
                <p>Our certified technicians specialize in servicing all types of refrigerators, including single-door, double-door, and side-by-side models. We work with all major brands such as Samsung, LG, Whirlpool, Haier, Godrej, Panasonic, Bosch, and Videocon. Whether it’s gas refilling, thermostat replacement, or compressor troubleshooting, you can count on us for prompt, professional, and affordable repairs — all delivered at your doorstep.</p>
                <h3>Geyser Repair in {cityName}</h3>
                <p>Book geyser repair in {cityName} with Mr. Service Expert for safe, reliable, and affordable service. We handle all types and models of geysers, including instant and storage types, providing quick solutions to ensure your hot water supply remains uninterrupted.</p>
                <p>Our skilled technicians specialize in repairing and maintaining popular geyser brands such as Bajaj, AO Smith, Havells, Racold, Crompton, Venus, and V-Guard. With fast response times and expert care, we deliver dependable service that keeps your geyser running efficiently and safely throughout the year.</p>
                <h3>Microwave Oven Repair in {cityName}</h3>
                <p>Don’t let a faulty microwave disrupt your kitchen routine. We offer expert microwave oven repair services in {cityName} for all major brands, including LG, Samsung, IFB, Whirlpool, Panasonic, Godrej, and Bajaj.</p>
                <p>Whether you own a solo, grill, or convection microwave, our skilled technicians quickly diagnose and fix issues related to heating, power supply, or circuit malfunctions. We pride ourselves on delivering the best microwave service in {cityName} with prompt, efficient, and reliable repairs right at your doorstep.</p>
                <h3>Vacuum Cleaner Repair in {cityName}</h3>
                <p>Experiencing low suction, unusual noise, or motor failure? At Mr. Service Expert, we handle all types of vacuum cleaner repairs in {cityName}, including suction loss, motor damage, and filter clogging. Our certified technicians specialize in repairing top brands like Eureka Forbes, Dyson, Philips, Karcher, Panasonic, Inalsa, and American Micronic. We expertly diagnose and fix performance issues to restore your vacuum cleaner to like-new condition with fast, reliable, and affordable service right at your doorstep.</p>
                <h3>LED & Smart TV Repair in {cityName}</h3>
                <p>For issues like no display, flickering screens, sound problems, or power faults, Mr. Service Expert is your trusted choice for LED and Smart TV repair in {cityName}. We provide expert repair and maintenance services for all major brands, including Sony, Samsung, LG, Panasonic, MI (Xiaomi), OnePlus, TCL, Vu, Thomson, and Haier.</p>
                <p>Whether you need screen replacement, audio-video troubleshooting, or any other brand-specific repair, our trained technicians deliver fast, reliable solutions right at your doorstep. As a top LED & Smart TV repair service in {cityName}, we ensure same-day service, genuine spare parts, and industry-leading support—so you can be confident your TV is in safe hands, no matter the brand or issue.</p>
                <h2>Why Choose Mr. Service Expert in {cityName}?</h2>
                <p>Mr. Service Expert is the go-to destination for reliable, fast, and affordable home appliance repair services in {cityName}. With a team of certified and experienced technicians, we bring professional repair solutions right to your doorstep with no more waiting or repeated follow-ups. Whether it&apos;s an RO purifier, air conditioner, washing machine, refrigerator, microwave, geyser, vacuum cleaner, or LED TV, we handle all appliance issues with precision and genuine spare parts.</p>
                <p>What sets us apart is our same-day service, transparent pricing, and 100% service satisfaction guarantee. We proudly serve all major locations in {cityName}.</p>
                <p>With Mr. Service Expert, you get the best home appliance repair in {cityName} from the comfort of your home.</p>
                <h2>Benefits of Choosing Mr. Service Expert for Major Appliance Brands in {cityName}</h2>
                <h3>Multi-Brand Expertise Under One Roof</h3>
                <p>Whether it&apos;s Indian or international brands, we handle all with equal proficiency—ensuring you don’t need to call multiple service providers.</p>
                <h3>Certified & Trained Technicians</h3>
                <p>Our technicians are brand-certified and highly trained, equipped to handle even the most complex repairs while maintaining original service standards.</p>
                <h3>Use of 100% Genuine Spare Parts</h3>
                <p>We prioritize your appliance&apos;s longevity by using only authentic, brand-compliant spare parts during every repair or replacement.</p>
                <h3>Quick Turnaround & On-Time Service</h3>
                <p>We value your time. Our service teams ensure timely doorstep visits and fast issue resolution across all major brands and appliance categories.</p>
                <h3>Pan-{cityName} Coverage</h3>
                <p>From one end of the city to the other, we provide seamless service coverage across {cityName} with no extra visit charges.</p>
                <h3>Comprehensive Service Portfolio</h3>
                <p>We cover ROs, ACs, refrigerators, washing machines, geysers, TVs, microwave ovens, vacuum cleaners, and more—making us your go-to appliance service partner.</p>
                <h3>Customer-Centric Pricing & Transparent Billing</h3>
                <p>Enjoy affordable, upfront pricing with no hidden costs. Every service is backed by clear estimates and post-service feedback support.</p>
                <h3>Extended Warranty Support</h3>
                <p>All services come with limited service warranties, giving you peace of mind after every repair or maintenance session.</p>
                <h2>Book Now – Trusted Home Appliance Service in {cityName}</h2>
                <p>Facing trouble with your AC, fridge, washing machine, RO, geyser, microwave, LED TV, or vacuum cleaner? Get quick, affordable appliance repair in {cityName} with just a call or online booking.</p>
                <h2>Conclusion: Your Home Appliance Expert in {cityName}</h2>
                <p>At Mr. Service Expert, we know how important your appliances are to your daily life. That’s why we offer fast, trusted, and affordable appliance repair in {cityName}. From AC repair to RO service, washing machine fixes to TV screen replacements, our team is here to restore convenience to your home with zero hassle.</p>
                <p>We aim to be the No. 1 appliance repair service provider in {cityName}, delivering quality service backed by experience, affordability, and professionalism.</p>
              </CollapsibleBlock>
            </Card>
          </Section>
        </Container>
      </>
    );
  }

  // ---------------- Category landing page (/ac, /ro-water-purifier …) ----------------
  const catName = (cityData?.categorydetail?.category_name || "").replace(/\s*Service$/i, "").trim();
  const sanitizedHtml = (cityData?.categorydetail?.category_content || "").replace(/<h1>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");

  return (
    <>
      <Container className="pt-4 sm:pt-6">
        <ServiceHero
          compact
          crumbs={[{ label: cityData?.categorydetail?.category_name || catName }]}
          eyebrow="Across India"
          title={`Get the Best ${catName} Service at Your Doorstep`}
          subtitle={`Book ${catName.toLowerCase()} repair, installation and AMC plans with verified technicians in 1500+ cities. Genuine parts, upfront prices and a service warranty on every job.`}
          image={cityData?.catbanner ? `/assets/categorybanner/${cityData.catbanner}` : "/assets/cityBanner/Front Banner.webp"}
          imageAlt={cityData?.categorydetail?.category_name || catName}
        />
      </Container>

      <Container className="mt-6">
        <TwoThirds
          main={
            <div className="flex flex-col gap-5">
              <Tabs cat={city} />
              <ServicesList category={city} status={cityData.status} state={cartChanged} addedServices={addedServices} handleCartLoading={handleCartLoading} />
            </div>
          }
          aside={
            <div className="flex flex-col gap-4">
              <Cart cartLoaded={cartLoaded} cartLoadedToggle={handleCartLoading} />
              <Assurance />
              <ServiceProcedure />
            </div>
          }
        />
      </Container>

      {sanitizedHtml.trim() && (
        <Container>
          <Section>
            <Card className="p-5 sm:p-7">
              <CardTitle icon={Info} title={`About ${catName} service by Mr. Service Expert`} />
              <CollapsibleHtml html={sanitizedHtml} className="prose-site" />
            </Card>
          </Section>
        </Container>
      )}

      <LeadPopup />
    </>
  );
}
