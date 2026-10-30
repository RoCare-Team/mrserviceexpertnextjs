"use client";

import React, { useEffect, useRef, useState } from "react";
import { Smartphone, ShieldCheck, X, Loader2, RotateCw } from "lucide-react";
import CongratsModal from "@/app/components/modals/CongratsModal";
import BasicDetails from "@/app/components/modals/BasicDetails";
import { toast, ToastContainer } from "react-toastify";

const RESEND_COOLDOWN = 30; // seconds between OTPs
const MAX_RESENDS = 3; // after the first OTP

/**
 * Customer login: mobile → OTP → session hints in localStorage, then the
 * basic-details / congrats modals. Also adds the pending service to the cart
 * when login was triggered by an "Add" click.
 */
const PhoneVerification = ({ onVerificationComplete, showModal, setShowModal }) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoader, setOtpLoader] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [phoneError, setPhoneError] = useState("");
  const [openBasic, setOpenBasic] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendsLeft, setResendsLeft] = useState(MAX_RESENDS);
  const sendingRef = useRef(false);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!(showModal || showOtpModal)) return;
    const onKey = (e) => e.key === "Escape" && handleCloseModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleCloseModal = () => {
    setShowModal(false);
    setShowOtpModal(false);
    setPhoneNumber("");
    setOtpDigits(["", "", "", ""]);
    setShowCongrats(false);
    setPhoneError("");
    setCooldown(0);
    setResendsLeft(MAX_RESENDS);
  };

  const syncCartItemsFromCheckoutState = () => {
    try {
      const checkoutState = localStorage.getItem("checkoutState");
      if (checkoutState) {
        const cartData = JSON.parse(checkoutState);
        const serviceIds = [];
        cartData.forEach((category) => {
          if (Array.isArray(category.cart_dtls)) {
            category.cart_dtls.forEach((item) => item.service_id && serviceIds.push(item.service_id));
          }
        });
        const existing = JSON.parse(localStorage.getItem("cartItems")) || [];
        const merged = [...new Set([...existing, ...serviceIds])];
        localStorage.setItem("cartItems", JSON.stringify(merged));
        return merged;
      }
    } catch (error) {
      console.error("Error syncing cart items:", error);
    }
    return [];
  };

  const handleVerification = async () => {
    const newOtp = otpDigits.join("");
    if (newOtp.length !== 4) {
      toast.error("Enter the 4-digit OTP.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/service_otp_verify.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, newOtp }),
      });
      const data = await res.json();

      if (data.name) localStorage.setItem("name", data.name);
      if (data.email) localStorage.setItem("email", data.email);
      if (data.c_id) localStorage.setItem("customer_id", data.c_id);

      // A service was added before login → add it to the cart now.
      const pendingService = localStorage.getItem("pendingServiceToAdd");
      if (pendingService && data.c_id) {
        const service_id = JSON.parse(pendingService);
        const existingCheckout = data.AllCartDetails || [];
        let quantity = 1;
        const entry = existingCheckout.find((c) => c.cart_dtls?.some((s) => s.service_id == service_id));
        if (entry) {
          const matched = entry.cart_dtls.find((s) => s.service_id == service_id);
          if (matched && Number(matched.quantity) > 1) quantity = Number(matched.quantity);
        }
        try {
          const r = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_id, quantity, cid: data.c_id, type: "add", source: "mrserviceexpert website" }),
          });
          const cartResponse = await r.json();
          localStorage.setItem("checkoutState", JSON.stringify(cartResponse.AllCartDetails || []));
          localStorage.setItem("cart_total_price", cartResponse.total_price || 0);
          const existingCart = JSON.parse(localStorage.getItem("cartItems")) || [];
          if (!existingCart.includes(service_id)) localStorage.setItem("cartItems", JSON.stringify([...existingCart, service_id]));
          syncCartItemsFromCheckoutState();
          localStorage.removeItem("pendingServiceToAdd");
        } catch (error) {
          console.error("Error adding pending service to cart:", error);
        }
      } else {
        if (data.AllCartDetails) {
          const filteredCart = data.AllCartDetails.filter((c) => c.cart_dtls.some((s) => Number(s.quantity) > 0)).map((c) => ({
            ...c,
            cart_dtls: c.cart_dtls.filter((s) => Number(s.quantity) > 0),
          }));
          localStorage.setItem("checkoutState", JSON.stringify(filteredCart));
          syncCartItemsFromCheckoutState();
        }
        if (data.total_cart_price) localStorage.setItem("cart_total_price", data.total_cart_price);
      }
      if (data.address) localStorage.setItem("RecentAddress", JSON.stringify(data.address));

      if (data.error === false) {
        localStorage.setItem("userPhone", phoneNumber);
        localStorage.setItem("userToken", "verified");
        window.dispatchEvent(new Event("cartItemsUpdated"));
        setShowOtpModal(false);
        if (data.status === 1) setOpenBasic(true);
        else setShowCongrats(true);
      } else {
        toast.error(data.msg || "Incorrect OTP. Please try again.");
      }
      if (onVerificationComplete) onVerificationComplete();
    } catch (error) {
      toast.error("Error verifying OTP: " + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleBasicDetails = async (userData) => {
    try {
      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/update_user_dtls.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userData, phoneNumber }),
      });
      const data = await res.json();
      if (data.error === false) {
        setOpenBasic(false);
        setShowCongrats(true);
        localStorage.setItem("userName", userData.name);
        localStorage.setItem("userEmail", userData.email);
      } else {
        toast.error(data.msg || "Failed to save details");
      }
      return data;
    } catch (error) {
      toast.error("Error saving details: " + error.message);
      throw error;
    }
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(phoneNumber);

  /** Sends (or resends) the OTP. Guarded against double taps and the cooldown. */
  const sendOtp = async ({ resend = false } = {}) => {
    if (!isPhoneValid) {
      setPhoneError(phoneNumber.length !== 10 ? "Phone number must be 10 digits" : "Please enter a valid phone number");
      return;
    }
    if (sendingRef.current || cooldown > 0) return;
    if (resend && resendsLeft <= 0) return;
    sendingRef.current = true;
    setOtpLoader(true);
    try {
      const res = await fetch("/api/send_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, source: "mrserviceexpert website" }),
      });
      const data = await res.json();
      if (data.error === false) {
        setShowModal(false);
        setShowOtpModal(true);
        setPhoneError("");
        setOtpDigits(["", "", "", ""]);
        setCooldown(data.resendAfter || RESEND_COOLDOWN);
        if (typeof data.resendsLeft === "number") setResendsLeft(data.resendsLeft);
        else if (resend) setResendsLeft((n) => Math.max(0, n - 1));
        if (resend) toast.success("A new OTP has been sent.");
        setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
      } else {
        if (data.retryAfter) setCooldown(data.retryAfter);
        if (data.resendsLeft === 0) setResendsLeft(0);
        toast.error(data.msg || "Could not send the OTP.");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setOtpLoader(false);
      sendingRef.current = false;
    }
  };

  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      // Pasted code → fill all boxes.
      const next = ["", "", "", ""];
      digits.slice(0, 4).split("").forEach((d, i) => (next[i] = d));
      setOtpDigits(next);
      otpInputRefs.current[Math.min(digits.length, 4) - 1]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = digits;
    setOtpDigits(next);
    if (digits && index < 3) otpInputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
    else if (e.key === "Enter") handleVerification();
  };

  const open = showModal || showOtpModal;

  return (
    <div>
      <ToastContainer position="top-right" />

      {open && (
        <div
          className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && handleCloseModal()}
          role="dialog"
          aria-modal="true"
          aria-label={showOtpModal ? "Enter OTP" : "Login with mobile number"}
        >
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {showModal && (
              <div className="text-center">
                <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_10px_22px_-10px_rgba(98,41,205,.7)]">
                  <Smartphone className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="text-xl font-bold text-[var(--ink)] sm:text-2xl">Login with your mobile</h2>
                <p className="mt-1.5 text-sm text-[var(--muted)]">We&apos;ll send a 4-digit OTP by SMS to verify your number.</p>

                <form
                  className="mt-6 text-left"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendOtp();
                  }}
                >
                  <label htmlFor="login-mobile" className="mb-1.5 block text-sm font-medium text-[var(--ink-soft)]">
                    Mobile number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[var(--line-strong)] bg-purple-50 px-3.5 text-sm font-semibold text-[var(--ink-soft)]">+91</span>
                    <input
                      id="login-mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      autoFocus
                      placeholder="10-digit mobile number"
                      className={`w-full rounded-r-xl border bg-white px-3.5 py-3 text-[16px] tracking-wide text-[var(--ink)] outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${phoneError ? "border-red-400" : "border-[var(--line-strong)]"}`}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setPhoneError("");
                      }}
                      maxLength={10}
                      name="mobile"
                    />
                  </div>
                  {phoneError && <p className="mt-1.5 text-sm text-red-600">{phoneError}</p>}

                  <button
                    type="submit"
                    disabled={!isPhoneValid || otpLoader || cooldown > 0}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {otpLoader ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {otpLoader ? "Sending OTP…" : cooldown > 0 ? `Send OTP in ${cooldown}s` : "Send OTP"}
                  </button>
                </form>

                <p className="mt-4 text-xs text-[var(--muted)]">
                  By continuing you agree to our{" "}
                  <a href="/terms-and-conditions" className="font-semibold text-[var(--ink-soft)] underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy-and-policy" className="font-semibold text-[var(--ink-soft)] underline">
                    Privacy policy
                  </a>
                  .
                </p>
              </div>
            )}

            {showOtpModal && (
              <div className="text-center">
                <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_10px_22px_-10px_rgba(18,147,77,.7)]">
                  <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="text-xl font-bold text-[var(--ink)] sm:text-2xl">Enter the OTP</h2>
                <p className="mt-1.5 text-sm text-[var(--muted)]">
                  Sent by SMS to <b className="text-[var(--ink-soft)]">+91 {phoneNumber}</b>{" "}
                  <button
                    type="button"
                    className="font-semibold text-purple-700 underline"
                    onClick={() => {
                      setShowOtpModal(false);
                      setShowModal(true);
                    }}
                  >
                    Change
                  </button>
                </p>

                <div className="mt-6 flex justify-center gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      autoFocus={index === 0}
                      maxLength={4}
                      aria-label={`OTP digit ${index + 1}`}
                      className="h-14 w-12 rounded-xl border border-[var(--line-strong)] bg-white text-center text-2xl font-bold text-[var(--ink)] outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 sm:w-14"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleVerification}
                  disabled={verifying || otpDigits.join("").length !== 4}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  {verifying ? "Verifying…" : "Verify & continue"}
                </button>

                <div className="mt-4 text-sm text-[var(--muted)]">
                  {resendsLeft <= 0 ? (
                    <span>Resend limit reached. Please try again in a few minutes.</span>
                  ) : cooldown > 0 ? (
                    <span>
                      Didn&apos;t get it? Resend in <b className="tabular-nums text-[var(--ink-soft)]">{cooldown}s</b>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendOtp({ resend: true })}
                      disabled={otpLoader}
                      className="inline-flex items-center gap-1.5 font-semibold text-purple-700 hover:underline disabled:opacity-50"
                    >
                      {otpLoader ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />}
                      Resend OTP
                      <span className="font-normal text-[var(--muted)]">
                        ({resendsLeft} left)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {openBasic && <BasicDetails setOpen={setOpenBasic} open={openBasic} phoneNumber={phoneNumber} onSubmitDetails={handleBasicDetails} />}
      {showCongrats && <CongratsModal setShowCongrats={setShowCongrats} open={showCongrats} />}
    </div>
  );
};

export default PhoneVerification;
