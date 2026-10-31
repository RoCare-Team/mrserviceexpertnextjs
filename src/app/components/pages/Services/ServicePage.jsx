"use client";

import React, { useEffect, useState } from "react";
import { Info, Tag } from "lucide-react";
import Tabs from "@/app/components/pages/Services/AllServices";
import ServicesList from "../../service/ServicesList";
import Cart from "../../cart/Cart";
import Assurance from "../../Assurance/Assurance";
import ServiceProcedure from "@/app/components/serviceProcedure/index";
import AiContent from "@/app/components/aiContent/AiContent";
import CollapsibleHtml from "@/app/components/collapsibleHtml/CollapsibleHtml";
import PopularCities from "@/app/components/popularCities/PopularCities";
import LeadPopup from "@/app/components/public/LeadPopup";
import { Container, Section, ServiceHero, TwoThirds, Card, CardTitle, Faq, LinkCloud } from "@/app/components/public/ui";
import { serviceGroupFor } from "@/lib/homeCare";
import { schemasFor, faqItemsFor } from "./serviceSchemas";

/**
 * /{city}/{cat} — e.g. /delhi/ac. Hero, then the bookable services in the
 * 2/3 column with the cart + approved partners sticky in the 1/3 column.
 * `partnerSidebar` / `partnerSection` are server-rendered by the route and
 * passed in; `children` is any extra server content (stores, city extras).
 */
export default function ServicePage({ pagedata, city, cat, aiContent, partnerSection = null, partnerSidebar = null, children = null }) {
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  const group = serviceGroupFor(cat);
  const catName = (pagedata?.category_name || "").replace(/\s*Service$/i, "").trim();
  const cityName = pagedata?.city_name || city;
  const h1 = group ? `${catName} Service in ${cityName} from Expert Professionals` : `${catName} Repair Service in ${cityName} from Expert Technician`;
  const subtitle = group
    ? `Trained, background-verified professionals for ${catName.toLowerCase()} in ${cityName}. Transparent pricing, on-time arrival and a satisfaction guarantee.`
    : `Same-day doorstep ${catName} repair, installation and maintenance in ${cityName}. Genuine spare parts, upfront prices and a service warranty on every job.`;

  const aiContentHeading = `${(pagedata?.category_name || cat?.replace(/-/g, " ") || "").replace(/\s*services?\s*$/i, "").trim()} Service in ${cityName}`;
  const schemas = schemasFor(city, cat);
  const faqItems = faqItemsFor({ content: pagedata?.content, city: cityName, cat });
  const brands = (pagedata?.brands || []).map((b) => ({
    href: `/${city}/${b.brand_url}/${cat}`,
    label: b.brand_name,
    title: `${b.brand_name} ${pagedata?.category_name} in ${cityName}`,
  }));
  // related_cities.url is the bare city page; link to the same category there.
  const relatedCities = (pagedata?.related_cities || []).map((c) => ({
    href: `/${c.city_url}/${cat}`,
    label: c.city_name,
    title: `${pagedata?.category_name} in ${c.city_name}`,
  }));
  const hideAbout = city === "bangalore" && cat === "ro-water-purifier";

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <Container className="pt-4 sm:pt-6">
        <ServiceHero
          compact
          crumbs={[{ label: cityName, href: `/${city}` }, { label: pagedata?.category_name || catName }]}
          eyebrow={group ? "Home care & handyman" : "Appliance repair"}
          title={h1}
          subtitle={subtitle}
          image={pagedata?.banner ? `/assets/categorybanner/${pagedata.banner}` : "/assets/cityBanner/Front Banner.webp"}
          imageAlt={`${pagedata?.category_name} in ${cityName}`}
          chips={
            brands.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[12px] font-semibold text-purple-800">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" /> {brands.length} brands serviced
              </span>
            ) : null
          }
        />
      </Container>

      <Container className="mt-6">
        <TwoThirds
          main={
            <div className="flex flex-col gap-5">
              <Tabs />
              <ServicesList handleCartLoading={handleCartLoading} addedServices={addedServices} state={cartChanged} />
              <AiContent html={aiContent?.html} title={aiContentHeading} />
            </div>
          }
          aside={
            <div className="flex flex-col gap-4">
              {/* Cart appears once a service is added; until then the partners lead. */}
              <Cart cartLoaded={cartLoaded} cartLoadedToggle={handleCartLoading} hideWhenEmpty={!!partnerSidebar} />
              {partnerSidebar}
              <Assurance />
              <ServiceProcedure />
            </div>
          }
        />
      </Container>

      {partnerSection && (
        <Container>
          <Section>{partnerSection}</Section>
        </Container>
      )}

      {children}

      <Container>
        <Section>
          <Faq title="Frequently asked questions" subtitle={`Everything about ${catName} service in ${cityName}`} items={faqItems} />
        </Section>
      </Container>

      {!hideAbout && pagedata?.content?.page_content && (
        <Container>
          <Section className="!pt-0">
            <Card className="p-5 sm:p-7">
              <CardTitle icon={Info} title={`About ${catName} service in ${cityName}`} />
              <CollapsibleHtml html={pagedata.content.page_content} className="prose-site" />
            </Card>
          </Section>
        </Container>
      )}

      <Container>
          <Section className="!pt-0 flex flex-col gap-4">
            {brands.length > 0 && (
              <LinkCloud id="brands" icon={Tag} title={`${pagedata?.category_name} by brand in ${cityName}`} subtitle="Brand-trained technicians and genuine parts" items={brands} />
            )}
            {relatedCities.length > 0 ? (
              <LinkCloud id="nearby" title={`${pagedata?.category_name} in nearby cities`} subtitle={`Other cities in ${pagedata?.related_cities?.[0]?.parent_city || "the state"} we serve`} items={relatedCities} />
            ) : (
              <PopularCities categoryUrl={cat} categoryName={pagedata?.category_name} excludeCity={city} />
            )}
          </Section>
        </Container>

      <LeadPopup />
    </>
  );
}
