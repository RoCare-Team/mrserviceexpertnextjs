"use client";

import React, { useEffect, useState } from "react";
import { Info, Tag, Wrench } from "lucide-react";
import Tabs from "@/app/components/pages/Services/AllServices";
import ServicesList from "@/app/components/service/ServicesList";
import Cart from "@/app/components/cart/Cart";
import Assurance from "@/app/components/Assurance/Assurance";
import ServiceProcedure from "@/app/components/serviceProcedure/index";
import AiContent from "@/app/components/aiContent/AiContent";
import CollapsibleHtml from "@/app/components/collapsibleHtml/CollapsibleHtml";
import PopularCities from "@/app/components/popularCities/PopularCities";
import LeadPopup from "@/app/components/public/LeadPopup";
import { Container, Section, ServiceHero, TwoThirds, Card, CardTitle, Faq, LinkCloud } from "@/app/components/public/ui";
import { faqItemsFor } from "./serviceSchemas";

/**
 * /{city}/{brand}/{cat} — e.g. /delhi/kent/ro-water-purifier. Same layout as
 * the city+category page: hero, services (2/3) + sticky cart & partners (1/3),
 * FAQ, about copy and the brand / city / category link clouds.
 */
export default function ServicePage({ city, brand, cat, pagedata, aiContent, partnerSection = null, partnerSidebar = null }) {
  const citySlug = (city || "").toLowerCase();
  const catSlug = (cat || "").toLowerCase();

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

  const brandName = pagedata?.brandname || "";
  const catName = (pagedata?.categoryname || cat?.replace(/-/g, " ") || "").replace(/\s*services?\s*$/i, "").trim();
  const cityName = pagedata?.cityname || pagedata?.city_name || city;
  const aiContentHeading = `${brandName} ${catName} Service in ${cityName}`.trim();
  const faqItems = faqItemsFor({ content: pagedata?.content, city: cityName, cat: catSlug });

  const otherCities = (pagedata?.related_cities || []).map((c) => ({ href: c.url, label: c.city_name, title: `${brandName} ${pagedata?.categoryname} in ${c.city_name}` }));
  const otherCategories = (pagedata?.related_categories || []).map((c) => ({ href: c.url, label: c.category_name, title: `${brandName} ${c.category_name} in ${cityName}` }));
  const otherBrands = (pagedata?.brands || []).map((b) => ({ href: `/${citySlug}/${b.brand_url}/${catSlug}`, label: b.brand_name, title: `${b.brand_name} ${pagedata?.categoryname} in ${cityName}` }));

  return (
    <>
      <Container className="pt-4 sm:pt-6">
        <ServiceHero
          compact
          crumbs={[
            { label: cityName, href: `/${citySlug}` },
            { label: pagedata?.categoryname || catName, href: `/${citySlug}/${catSlug}` },
            { label: brandName },
          ]}
          eyebrow={`${brandName} specialists`}
          title={`${brandName} ${pagedata?.categoryname} Services in ${cityName}`}
          subtitle={`Doorstep ${brandName} ${catName} repair, installation and AMC in ${cityName} by technicians trained on ${brandName} models. Genuine parts, upfront prices and a service warranty.`}
          image={pagedata?.banner ? `/assets/categorybanner/${pagedata.banner}` : "/assets/cityBanner/Front Banner.webp"}
          imageAlt={`${brandName} ${pagedata?.categoryname} in ${cityName}`}
          chips={
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[12px] font-semibold text-purple-800">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> All {brandName} models
            </span>
          }
        />
      </Container>

      <Container className="mt-6">
        <TwoThirds
          main={
            <div className="flex flex-col gap-5">
              <Tabs cater={cat} />
              <ServicesList handleCartLoading={handleCartLoading} addedServices={addedServices} cate={cat} state={cartChanged} />
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

      <Container>
        <Section>
          <Faq title="Frequently asked questions" subtitle={`Everything about ${brandName} ${catName} service in ${cityName}`} items={faqItems} />
        </Section>
      </Container>

      {pagedata?.content?.page_content && (
        <Container>
          <Section className="!pt-0">
            <Card className="p-5 sm:p-7">
              <CardTitle icon={Info} title={`About ${brandName} ${pagedata?.categoryname} in ${cityName}`} />
              <CollapsibleHtml html={pagedata.content.page_content} className="prose-site" />
            </Card>
          </Section>
        </Container>
      )}

      <Container>
        <Section className="!pt-0 flex flex-col gap-4">
          {otherBrands.length > 0 && <LinkCloud id="brands" icon={Tag} title={`Other ${pagedata?.categoryname} brands in ${cityName}`} items={otherBrands} />}
          {otherCategories.length > 0 && <LinkCloud id="brand-services" icon={Wrench} title={`Other ${brandName} services in ${cityName}`} items={otherCategories} />}
          {otherCities.length > 0 ? (
            <LinkCloud id="nearby" title={`${brandName} ${pagedata?.categoryname} in other cities`} items={otherCities} />
          ) : (
            <PopularCities categoryUrl={catSlug} excludeCity={citySlug} />
          )}
        </Section>
      </Container>

      <LeadPopup />
    </>
  );
}
