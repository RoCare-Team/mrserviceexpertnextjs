"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { inputCls, labelCls, btnPrimary, FieldError } from "./ui";

const RESEND_COOLDOWN = 30;
const MAX_RESENDS = 3;

/**
 * Name + mobile → OTP → server-verified session. Used by the registration
 * wizard (askName) and the partner login page (no name).
 */
export default function OtpSignIn({ askName = true, onVerified, submitLabel = "Verify & continue" }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendsLeft, setResendsLeft] = useState(MAX_RESENDS);
  const [otpLength, setOtpLength] = useState(4);
  const otpRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validate = () => {
    const e = {};
    if (askName && name.trim().length < 2) e.full_name = "Please enter your full name.";
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = "Enter a valid 10-digit mobile number.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const send = async () => {
    if (!validate()) return;
    // One request at a time, never inside the cooldown, at most MAX_RESENDS resends.
    if (sendingRef.current || cooldown > 0 || (sent && resendsLeft <= 0)) return;
    sendingRef.current = true;
    setBusy(true);
    setMessage("");
    const r = await partnerApi("/api/partner-auth/send-otp", { method: "POST", body: { mobile } });
    setBusy(false);
    sendingRef.current = false;
    if (!r.ok) {
      if (r.error.fields?.retryAfter) setCooldown(r.error.fields.retryAfter);
      if (r.error.fields?.resendsLeft === 0) setResendsLeft(0);
      setMessage(r.error.message);
      return;
    }
    setSent(true);
    setOtp("");
    setOtpLength(r.data.length || 4);
    setCooldown(r.data.resendAfter || RESEND_COOLDOWN);
    setResendsLeft(typeof r.data.resendsLeft === "number" ? r.data.resendsLeft : (n) => Math.max(0, n - 1));
    setTimeout(() => otpRef.current?.focus(), 50);
  };

  const verify = async (e) => {
    e?.preventDefault();
    if (!new RegExp(`^\\d{${otpLength}}$`).test(otp)) {
      setErrors({ otp: `Enter the ${otpLength}-digit OTP.` });
      return;
    }
    setErrors({});
    setBusy(true);
    setMessage("");
    const r = await partnerApi("/api/partner-auth/verify-otp", {
      method: "POST",
      body: { mobile, otp, ...(askName ? { full_name: name } : {}) },
    });
    setBusy(false);
    if (!r.ok) {
      setMessage(r.error.message);
      if (r.error.fields) setErrors(r.error.fields);
      return;
    }
    onVerified?.(r.data);
  };

  return (
    <form onSubmit={sent ? verify : (e) => (e.preventDefault(), send())} className="space-y-4" noValidate>
      {askName && (
        <div>
          <label htmlFor="p-name" className={labelCls}>Full name *</label>
          <input
            id="p-name"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sent}
            autoComplete="name"
            maxLength={120}
            aria-invalid={!!errors.full_name}
          />
          <FieldError msg={errors.full_name} />
        </div>
      )}

      <div>
        <label htmlFor="p-mobile" className={labelCls}>Mobile number *</label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[var(--line-strong)] bg-purple-50 px-3 text-sm text-[var(--muted)]">+91</span>
          <input
            id="p-mobile"
            className={`${inputCls} rounded-l-none`}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            disabled={sent}
            inputMode="numeric"
            autoComplete="tel-national"
            aria-invalid={!!errors.mobile}
          />
        </div>
        <FieldError msg={errors.mobile} />
      </div>

      {sent && (
        <div>
          <label htmlFor="p-otp" className={labelCls}>
            Enter the {otpLength}-digit OTP sent to +91 {mobile}
          </label>
          <input
            id="p-otp"
            ref={otpRef}
            className={`${inputCls} tracking-[0.5em] text-center text-lg font-semibold`}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, otpLength))}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-invalid={!!errors.otp}
          />
          <FieldError msg={errors.otp} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <button type="button" className="text-purple-700 underline disabled:text-gray-400 disabled:no-underline" disabled={cooldown > 0 || busy || resendsLeft <= 0} onClick={send}>
              {resendsLeft <= 0 ? "Resend limit reached" : cooldown > 0 ? `Resend OTP in ${cooldown}s` : `Resend OTP (${resendsLeft} left)`}
            </button>
            <button type="button" className="text-[var(--muted)] underline" onClick={() => { setSent(false); setOtp(""); setMessage(""); }}>
              Change number
            </button>
          </div>
        </div>
      )}

      {message && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

      {sent ? (
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {submitLabel}
        </button>
      ) : (
        <button type="submit" className={btnPrimary} disabled={busy || cooldown > 0}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
          {cooldown > 0 ? `Send OTP in ${cooldown}s` : "Send OTP"}
        </button>
      )}
      <p className="text-xs text-[var(--muted)]">
        We use your number only to verify you and manage your partner account.
      </p>
    </form>
  );
}
