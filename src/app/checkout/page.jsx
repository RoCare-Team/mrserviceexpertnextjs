"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShoppingBag, Minus, Plus, LogIn, X, CalendarCheck, ShieldCheck, Clock, BadgeCheck, ArrowRight, Receipt, Loader2 } from "lucide-react";
import PhoneVerification from "../components/PhoneVerification/PhoneVerification";
import BookingSlots from "../components/bookingData/BookingSlots";
import useServiceOverrides from "@/lib/useServiceOverrides";
import { Container, Breadcrumbs } from "../components/public/ui";

const CART_API = "https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php";

/**
 * /checkout — the CRM cart grouped by category. Each category is booked
 * separately: pick address + slot (sidebar on desktop, modal on phones),
 * then "Book now" creates the lead and redirects to payment, or "Pay later"
 * creates it without payment.
 */
export default function CheckOut() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bookingSlotsKey, setBookingSlotsKey] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartDataArray, setCartDataArray] = useState([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const [placing, setPlacing] = useState(null); // category_cart_id being booked
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [bookingData, setBookingData] = useState({ address: null, timeSlot: null, addressId: null });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentBookingItem, setCurrentBookingItem] = useState(null);

  // Admin title / description / image (prices stay from the cart API).
  const withOverride = useServiceOverrides(cartDataArray?.flatMap((c) => (c.cart_dtls || []).map((d) => d.service_id)));

  const displayCartData = () => {
    const cartdata = localStorage.getItem("checkoutState");
    setCartDataArray(cartdata ? JSON.parse(cartdata) || [] : []);
    setFinalTotal(Number(localStorage.getItem("cart_total_price")) || 0);
  };

  const refreshBookingData = useCallback(() => {
    const address = localStorage.getItem("bookingAddress");
    const timeSlot = localStorage.getItem("bookingTimeSlot");
    const addressId = localStorage.getItem("address_id");
    // Bail out when nothing changed so the 1s poll does not re-render the page
    // (and the booking modals inside it) every tick.
    setBookingData((prev) => {
      const next = { address, timeSlot: timeSlot ? JSON.parse(timeSlot) : null, addressId };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    setBookingCompleted(!!(address && timeSlot && addressId));
  }, []);

  useEffect(() => {
    displayCartData();
    setIsLoggedIn(!!localStorage.getItem("userToken"));
    const userPhone = localStorage.getItem("userPhone");
    if (userPhone) setPhoneNumber(userPhone);
    refreshBookingData();
  }, [refreshBookingData, showModal]);

  // Address / slot are written to localStorage by the modals; poll while the
  // page is open so the buttons enable as soon as both are chosen.
  useEffect(() => {
    const id = setInterval(refreshBookingData, 1000);
    return () => clearInterval(id);
  }, [refreshBookingData]);

  const post = async (payload) => {
    const res = await fetch(CART_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
  };

  const onIncrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const quantity = Number(qunt) + 1;
    if (quantity > 5) return toast.error("You can't add more than 5 of one service");
    try {
      const data = await post({ service_id, type, cid, quantity });
      localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails));
      localStorage.setItem("cart_total_price", data.total_main);
      displayCartData();
      window.dispatchEvent(new Event("cartItemsUpdated"));
    } catch (error) {
      toast.error("Error updating cart");
      console.error("Error:", error);
    }
  };

  const onDecrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const quantity = Number(qunt) - 1;
    if (quantity < 0) return;
    try {
      const data = await post({ service_id, type, cid, quantity });
      localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
      localStorage.setItem("cart_total_price", data.total_main == null ? 0 : data.total_main);
      if (quantity === 0) {
        const old = JSON.parse(localStorage.getItem("cartItems") || "[]");
        localStorage.setItem("cartItems", JSON.stringify(old.filter((id) => id !== service_id)));
      }
      displayCartData();
      window.dispatchEvent(new Event("cartItemsUpdated"));
    } catch (error) {
      toast.error("Error updating cart");
      console.error("Error:", error);
    }
  };

  const handleBookNowClick = (service) => {
    if (!isLoggedIn) return setShowModal(true);
    setCurrentBookingItem(service);
    setShowBookingModal(true);
    setTimeout(refreshBookingData, 100);
  };

  const handleProceedToPayment = () => {
    refreshBookingData();
    setTimeout(() => {
      const address = localStorage.getItem("bookingAddress");
      const timeSlot = localStorage.getItem("bookingTimeSlot");
      const addressId = localStorage.getItem("address_id");
      if (address && timeSlot && addressId && currentBookingItem) {
        setShowBookingModal(false);
        handlePaymentCompleted(currentBookingItem.category_cart_id);
      } else {
        toast.error("Please complete all booking details before proceeding");
      }
    }, 200);
  };

  const handlePaymentCompleted = async (leadtype, redirect = true) => {
    if (!isLoggedIn) return setShowModal(true);
    const cust_id = localStorage.getItem("customer_id");
    const cust_mobile = localStorage.getItem("userPhone");
    const address_id = localStorage.getItem("address_id");
    const cust_email = localStorage.getItem("email") || localStorage.getItem("userEmail");
    const chkout = JSON.parse(localStorage.getItem("checkoutState") || "[]");
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const cart_id = leadtype;
    const timeSlotData = localStorage.getItem("bookingTimeSlot");
    const time = timeSlotData ? JSON.parse(timeSlotData) : {};
    const appointment_time = time.time;
    const appointment_date = time.date;
    const source = "mrserviceexpert website";

    if (!cust_id || !cust_mobile || !address_id || !cust_email || !appointment_date || !appointment_time) {
      toast.error(!cust_email ? "Please add your email in your profile before booking." : "Please select an address and a time slot first.", { autoClose: 3000 });
      if (window.innerWidth < 1024 && (!address_id || !appointment_date)) {
        const item = chkout.find((c) => c.category_cart_id === cart_id);
        if (item) {
          setCurrentBookingItem(item);
          setShowBookingModal(true);
        }
      }
      return;
    }

    setPlacing(cart_id);
    try {
      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_lead_with_full_dtls.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cust_id, cust_mobile, address_id, cust_email, cart_id, appointment_time, appointment_date, source }),
      });
      const data = await res.json();

      if (data.error == false) {
        const leftOverItems = chkout.filter((items) => items.category_cart_id !== cart_id);
        localStorage.setItem("checkoutState", JSON.stringify(leftOverItems));

        const currentCategoryItem = chkout.find((item) => item.category_cart_id === cart_id);
        if (currentCategoryItem && cartItems.length > 0) {
          const checkedOut = currentCategoryItem.cart_dtls.map((s) => String(s.service_id));
          localStorage.setItem("cartItems", JSON.stringify(cartItems.filter((item) => !checkedOut.includes(String(item)))));
        } else if (leftOverItems.length === 0) {
          localStorage.setItem("cartItems", JSON.stringify([]));
        }
        window.dispatchEvent(new Event("cartItemsUpdated"));

        ["bookingTimeSlot", "bookingAddress", "time_slot", "address_id"].forEach((k) => localStorage.removeItem(k));
        setBookingData({ address: null, timeSlot: null, addressId: null });
        setBookingCompleted(false);
        setBookingSlotsKey((n) => n + 1);
        displayCartData();

        if (redirect) {
          setTimeout(() => {
            window.location.href = data.lead_id_for_payment;
          }, 100);
        } else {
          toast.success("Booking placed. Our team will contact you soon.");
        }
      } else {
        toast.error(data.msg || "Booking failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setPlacing(null);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setCurrentBookingItem(null);
  };

  const groups = cartDataArray || [];
  const itemCount = groups.reduce((n, g) => n + (g.cart_dtls || []).reduce((m, d) => m + (Number(d.quantity) || 1), 0), 0);
  const itemsTotal = groups.reduce((sum, g) => {
    const calc = (g.cart_dtls || []).reduce((s, i) => s + Number(i.total_price || i.price || 0) * Number(i.quantity || 1), 0);
    return sum + (Number(g.total_main) || calc);
  }, 0);
  const grandTotal = finalTotal || itemsTotal;

  const catTotal = (g) => {
    const calc = (g.cart_dtls || []).reduce((s, i) => s + Number(i.total_price || i.price || 0) * Number(i.quantity || 1), 0);
    return Number(g.total_main) || calc;
  };

  const bookBtn = "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-4 text-[14px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-60";
  const laterBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-[14px] font-semibold text-[var(--ink-soft)] transition hover:bg-purple-50 disabled:opacity-60";

  return (
    <>
      <Container className="pt-4 sm:pt-6">
        <Breadcrumbs items={[{ label: "Checkout" }]} className="mb-3" />
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[28px]">Checkout</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {itemCount > 0 ? `${itemCount} service${itemCount === 1 ? "" : "s"} in your cart` : "Your cart is empty"}
            </p>
          </div>
          {groups.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-[12px] font-medium text-[var(--ink-soft)]">
              {[
                [Clock, "Doorstep in 30 min"],
                [BadgeCheck, "Verified technicians"],
                [ShieldCheck, "Service warranty"],
              ].map(([Icon, t]) => (
                <li key={t} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-[var(--line)]">
                  <Icon className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>

      <Container className="pb-8">
        {groups.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-sm)] sm:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/emptyCart.webp" alt="" width={96} height={96} className="mx-auto h-24 w-24 opacity-80" />
            <h2 className="mt-4 text-xl font-bold text-[var(--ink)]">Nothing here yet</h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">Pick a service and tap “Add” — it will show up here for booking.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                ["RO service", "/ro-water-purifier"],
                ["AC repair", "/ac"],
                ["Washing machine", "/washing-machine-repair"],
                ["Refrigerator", "/refrigerator-repair"],
              ].map(([l, h]) => (
                <Link key={h} href={h} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--line)] bg-white px-4 text-[13.5px] font-semibold text-[var(--ink-soft)] hover:border-purple-300 hover:bg-purple-50">
                  {l} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* ---------- Order ---------- */}
            <div className="min-w-0">
              <div className="flex flex-col gap-4">
                {groups.map((g) => (
                  <section key={g.category_cart_id} className="rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]" aria-labelledby={`cat-${g.category_cart_id}`}>
                    <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 id={`cat-${g.category_cart_id}`} className="flex-1 text-[15px] font-bold text-[var(--ink)] sm:text-base">
                        {g.leadtype_name}
                      </h2>
                      <span className="text-sm font-bold text-[var(--ink)]">₹{catTotal(g)}</span>
                    </div>

                    <ul className="divide-y divide-[var(--line)]">
                      {(g.cart_dtls || []).map((d) => withOverride(d)).map((item) => (
                        <li key={item.service_id} className="flex items-start gap-3.5 px-4 py-3.5 sm:px-5">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.service_name} width={64} height={64} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14.5px] font-bold leading-snug text-[var(--ink)]">{item.service_name}</p>
                            {item.description && <div className="svc-desc mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.description }} />}
                            <div className="mt-2 inline-flex items-center rounded-lg border border-[var(--line-strong)] bg-white">
                              <button type="button" aria-label="Decrease quantity" onClick={() => onDecrement(item.service_id, "delete", item.quantity)} className="inline-flex h-8 w-8 items-center justify-center text-purple-700 hover:bg-purple-50">
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <span className="min-w-[2rem] text-center text-[13px] font-bold text-[var(--ink)]">{item.quantity || 1}</span>
                              <button type="button" aria-label="Increase quantity" onClick={() => onIncrement(item.service_id, "add", item.quantity)} disabled={(item.quantity || 1) >= 5} className="inline-flex h-8 w-8 items-center justify-center text-purple-700 hover:bg-purple-50 disabled:opacity-40">
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[15px] font-extrabold text-[var(--ink)]">₹{item.total_price || item.price}</p>
                            {Number(item.quantity) > 1 && <p className="text-[11px] text-[var(--muted)]">₹{item.price} × {item.quantity}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-[var(--surface-soft)]/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-5">
                      <button type="button" onClick={() => handlePaymentCompleted(g.category_cart_id, false)} disabled={placing === g.category_cart_id} className={laterBtn}>
                        Pay later
                      </button>
                      <button
                        type="button"
                        disabled={placing === g.category_cart_id}
                        onClick={() => (window.innerWidth < 1024 ? handleBookNowClick(g) : handlePaymentCompleted(g.category_cart_id))}
                        className={`${bookBtn} sm:max-w-xs`}
                      >
                        {placing === g.category_cart_id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
                        Book now · ₹{catTotal(g)}
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* ---------- Sidebar ---------- */}
            <aside className="pub-sticky min-w-0">
              <div className="flex flex-col gap-4">
                {!isLoggedIn ? (
                  <section className="rounded-2xl border border-[var(--line)] bg-white p-5 text-center shadow-[var(--shadow-sm)]">
                    <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <LogIn className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h2 className="mt-3 text-[16px] font-bold text-[var(--ink)]">Login to book</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">Verify your mobile number with an OTP to choose an address and time slot.</p>
                    <button type="button" onClick={() => setShowModal(true)} className={`${bookBtn} mt-4 w-full`}>
                      <LogIn className="h-4 w-4" aria-hidden="true" /> Login / Sign up
                    </button>
                  </section>
                ) : (
                  <section className="hidden rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] lg:block" aria-labelledby="booking-h">
                    <h2 id="booking-h" className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                      Booking details
                    </h2>
                    <BookingSlots phoneNumber={phoneNumber} bookingSlotsKey={bookingSlotsKey} />
                    <p className="-mt-2 text-[12px] text-[var(--muted)]">Then tap “Book now” on a category to confirm.</p>
                  </section>
                )}

                <section className="rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]" aria-labelledby="summary-h">
                  <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_-6px_rgba(224,137,0,.6)]">
                      <Receipt className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h2 id="summary-h" className="text-[15px] font-bold text-[var(--ink)]">
                      Payment summary
                    </h2>
                  </div>
                  <dl className="space-y-2 px-4 py-4 text-sm">
                    <div className="flex justify-between text-[var(--body-text)]">
                      <dt>Item total</dt>
                      <dd className="font-semibold text-[var(--ink)]">₹{itemsTotal}</dd>
                    </div>
                    <div className="flex justify-between text-[var(--body-text)]">
                      <dt>Visit &amp; service fee</dt>
                      <dd className="font-semibold text-emerald-700">Free</dd>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-[var(--line-strong)] pt-3 text-[var(--ink)]">
                      <dt className="font-bold">Total</dt>
                      <dd className="text-lg font-extrabold tracking-tight">₹{grandTotal}</dd>
                    </div>
                  </dl>
                  <p className="border-t border-[var(--line)] px-4 py-3 text-[12px] text-[var(--muted)]">
                    Spare parts, if needed, are quoted by the technician before work starts. Pay online after booking or in cash on completion.
                  </p>
                </section>

                <p className="px-1 text-[12px] text-[var(--muted)]">
                  By booking you agree to our{" "}
                  <Link href="/terms-and-conditions" className="font-semibold text-[var(--ink-soft)] underline">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-and-policy" className="font-semibold text-[var(--ink-soft)] underline">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        )}
      </Container>

      {/* Phone / tablet: booking details in a sheet */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && handleCloseModal()} role="dialog" aria-modal="true" aria-label="Complete your booking">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">Complete your booking</h3>
                {currentBookingItem && <p className="text-xs text-[var(--muted)]">{currentBookingItem.leadtype_name} · ₹{catTotal(currentBookingItem)}</p>}
              </div>
              <button type="button" onClick={handleCloseModal} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="px-5 pt-5">
              <BookingSlots phoneNumber={phoneNumber} bookingSlotsKey={bookingSlotsKey} />
            </div>
            <div className="flex gap-2 border-t border-[var(--line)] p-4">
              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  if (currentBookingItem) handlePaymentCompleted(currentBookingItem.category_cart_id, false);
                }}
                className={laterBtn}
              >
                Pay later
              </button>
              <button type="button" onClick={handleProceedToPayment} disabled={!bookingCompleted} className={bookBtn}>
                <CalendarCheck className="h-4 w-4" aria-hidden="true" /> {bookingCompleted ? "Book & pay" : "Select address & slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
