"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { inputCls, labelCls, btnPrimary, FieldError } from "./ui";

/** Reads the site's existing customer login hints (localStorage) to pre-fill. */
export function storedCustomerHints() {
  try {
    return {
      name: localStorage.getItem("name") || "",
      mobile: (localStorage.getItem("userPhone") || "").replace(/\D/g, "").slice(-10),
    };
  } catch {
    return { name: "", mobile: "" };
  }
}

/**
 * Customer mobile verification for bookings / reviews. Pre-fills name and
 * number from the site's login, then confirms by OTP on our server, which
 * issues the customer session cookie.
 */
export default function CustomerOtp({ onVerified, askName = true, intro }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [len, setLen] = useState(4);
  const otpRef = useRef(null);

  useEffect(() => {
    const h = storedCustomerHints();
    setName(h.name);
    setMobile(h.mobile);
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    if (askName && name.trim().length < 2) return setMsg("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setMsg("Enter a valid 10-digit mobile number.");
    setBusy(true);
    setMsg("");
    const r = await partnerApi("/api/customer-auth/send-otp", { method: "POST", body: { mobile } });
    setBusy(false);
    if (!r.ok) {
      if (r.error.fields?.retryAfter) setCooldown(r.error.fields.retryAfter);
      return setMsg(r.error.message);
    }
    setSent(true);
    setLen(r.data.length || 4);
    setCooldown(r.data.resendAfter || 60);
    setTimeout(() => otpRef.current?.focus(), 50);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (!sent) return send();
    if (!new RegExp(`^\\d{${len}}$`).test(otp)) return setMsg(`Enter the ${len}-digit OTP.`);
    setBusy(true);
    setMsg("");
    const r = await partnerApi("/api/customer-auth/verify-otp", {
      method: "POST",
      body: { mobile, otp, ...(askName ? { name } : {}) },
    });
    setBusy(false);
    if (!r.ok) return setMsg(r.error.message);
    onVerified(r.data);
  };

  return (
    <form onSubmit={verify} noValidate className="space-y-3">
      {intro && <p className="text-sm text-[var(--muted)]">{intro}</p>}
      {askName && (
        <div>
          <label htmlFor="c-name" className={labelCls}>Your name</label>
          <input id="c-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} disabled={sent} maxLength={120} autoComplete="name" />
        </div>
      )}
      <div>
        <label htmlFor="c-mobile" className={labelCls}>Mobile number</label>
        <input
          id="c-mobile"
          className={inputCls}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          disabled={sent}
          inputMode="numeric"
          autoComplete="tel-national"
        />
      </div>
      {sent && (
        <div>
          <label htmlFor="c-otp" className={labelCls}>OTP sent to +91 {mobile}</label>
          <input
            id="c-otp"
            ref={otpRef}
            className={`${inputCls} text-center text-lg font-semibold tracking-[0.5em]`}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, len))}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <div className="mt-1 flex gap-3 text-sm">
            <button type="button" className="text-purple-700 underline disabled:text-gray-400 disabled:no-underline" disabled={cooldown > 0 || busy} onClick={send}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
            <button type="button" className="text-[var(--muted)] underline" onClick={() => (setSent(false), setOtp(""))}>
              Change number
            </button>
          </div>
        </div>
      )}
      <FieldError msg={msg} />
      <button type="submit" className={`${btnPrimary} w-full`} disabled={busy || (!sent && cooldown > 0)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <ShieldCheck className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
        {sent ? "Verify OTP" : cooldown > 0 ? `Send OTP in ${cooldown}s` : "Send OTP"}
      </button>
    </form>
  );
}
