"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Check, Plus, ChevronDown } from "lucide-react";
import PhoneVerification from "../PhoneVerification/PhoneVerification";
import ServicesSkeleton from "./ServicesSkeleton";
import { filterHiddenServices } from "@/lib/hiddenServices";
import { leadTypeFor } from "@/lib/serviceLeadType";

/**
 * The bookable services for the current page (from /api/services), each with
 * an "Add" button that goes through the CRM cart. Logged-out visitors get
 * the OTP modal first; the chosen service is added right after.
 */
const ServicesList = ({ cate, addedServices = [], state, handleCartLoading, cartLoaded }) => {
  const [serviceListCart, setServiceListCart] = useState([]);
  const [clickedValues, setClickedValues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { city, cat } = useParams();
  const [servicedata, setServiceData] = useState([]);
  const [catergoryTitle, setCatergoryTitle] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cartItems");
    setServiceListCart(stored ? JSON.parse(stored) : []);
  }, [state, cartLoaded]);

  useEffect(() => {
    const storedClicked = localStorage.getItem("clickedValues");
    if (storedClicked) setClickedValues(JSON.parse(storedClicked));
    const stored = localStorage.getItem("cartItems");
    if (stored) {
      setServiceListCart(JSON.parse(stored));
    } else if (addedServices.length > 0) {
      setServiceListCart(addedServices);
      localStorage.setItem("cartItems", JSON.stringify(addedServices));
    }
    localStorage.setItem("type", "add");
  }, []);

  useEffect(() => {
    if (addedServices.length > 0) {
      setServiceListCart(addedServices);
      localStorage.setItem("cartItems", JSON.stringify(addedServices));
    }
  }, [addedServices]);

  useEffect(() => {
    const lead_type = leadTypeFor(cat, city, cate);
    const cid = localStorage.getItem("customer_id");
    setIsLoading(true);
    fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, lead_type }),
    })
      .then((res) => res.json())
      .then((data) => {
        setServiceData(filterHiddenServices(data.service_details));
        setCatergoryTitle(data.Title);
      })
      .catch((error) => console.error("Error fetching services:", error))
      .finally(() => setIsLoading(false));
  }, [cat]);

  const handleAddToCart = async (service) => {
    if (addedServices.includes(service.id)) return;
    setClickedValues((prev) => [...prev, service.id]);
    const service_id = service.id;
    const quantity = 1;
    const type = localStorage.getItem("type");
    const cid = localStorage.getItem("customer_id");
    const source = "mrserviceexpert";
    if (cid != null) {
      const payload = { service_id, quantity, cid, type, source };
      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
      localStorage.setItem("cart_total_price", data.total_price == null ? 0 : data.total_price);

      const newClickedValues = [...clickedValues, service.id];
      setClickedValues(newClickedValues);
      localStorage.setItem("clickedValues", JSON.stringify(newClickedValues));

      const newServiceListCart = [...serviceListCart, service.id];
      setServiceListCart(newServiceListCart);
      localStorage.setItem("cartItems", JSON.stringify(newServiceListCart));
      window.dispatchEvent(new Event("cartItemsUpdated"));

      if (handleCartLoading) handleCartLoading();
    } else {
      localStorage.setItem("pendingServiceToAdd", JSON.stringify(service.id));
      setShowModal(true);
    }
  };

  if (isLoading) return <ServicesSkeleton />;

  return (
    <section id="services" className="scroll-mt-28" aria-labelledby="services-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="services-h" className="text-lg font-bold text-[var(--ink)] sm:text-xl">
          {catergoryTitle || "Services"}
        </h2>
        {servicedata?.length > 0 && (
          <span className="text-xs font-medium text-[var(--muted)]">
            {servicedata.length} option{servicedata.length === 1 ? "" : "s"} · prices include visit charges
          </span>
        )}
      </div>

      {!servicedata?.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          No services are listed for this page yet. Call us and we will arrange a visit.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {servicedata.map((service) => {
            const isAdded = serviceListCart.includes(service.id);
            const price = Number(service?.price) || 0;
            return (
              <li
                key={service.id}
                id={service.id}
                className="scroll-mt-36 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] transition hover:border-purple-200 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] sm:h-20 sm:w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.image}
                      alt={service.category_name || service.service_name}
                      title={service.category_name || service.service_name}
                      width={80}
                      height={80}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold leading-snug text-[var(--ink)] sm:text-base">{service.service_name}</h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <b className="text-[var(--ink-soft)]">4.5</b> (30K+ reviews)
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-lg font-extrabold tracking-tight text-[var(--ink)]">₹{price}</span>
                      <s className="text-sm text-[var(--muted)]">₹{price + 100}</s>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Save ₹100</span>
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    <button
                      type="button"
                      title={isAdded ? "Added to cart" : "Add to cart"}
                      onClick={() => handleAddToCart(service)}
                      disabled={isAdded}
                      className={`inline-flex min-h-10 min-w-[84px] items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition ${
                        isAdded
                          ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-purple-600 bg-white text-purple-700 shadow-[var(--shadow-sm)] hover:bg-purple-600 hover:text-white"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" aria-hidden="true" /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {service.description && (
                  <details className="pub-details group mt-3 border-t border-[var(--line)] pt-2.5">
                    <summary className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple-700 hover:underline">
                      What&apos;s included
                      <ChevronDown className="pub-chevron h-3.5 w-3.5 transition-transform" aria-hidden="true" />
                    </summary>
                    <div className="pub-details-body svc-desc mt-2" dangerouslySetInnerHTML={{ __html: service.description }} />
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
    </section>
  );
};

export default ServicesList;
