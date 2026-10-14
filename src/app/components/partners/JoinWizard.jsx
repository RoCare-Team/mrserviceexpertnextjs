"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, RefreshCw, BadgeCheck } from "lucide-react";
import { partnerApi } from "./partnerApi";
import OtpSignIn from "./OtpSignIn";
import { StepCategories, StepServices, StepBrands } from "./StepSelections";
import StepBusiness from "./StepBusiness";
import StepLocations from "./StepLocations";
import StepReview from "./StepReview";
import { cardCls, btnPrimary, btnGhost, inputCls, labelCls, FieldError, StepNav } from "./ui";

const STEPS = ["Basic details", "Categories", "Services", "Brands", "Business", "Address & areas", "Review"];
const EDITABLE = ["draft", "rejected", "info_requested"];

/**
 * Seven-step partner registration. Every step is saved to the server on
 * "Continue" (the draft survives closing the browser); nothing sensitive is
 * kept in localStorage.
 */
export default function JoinWizard({ initialApp = null }) {
  const [app, setApp] = useState(initialApp);
  const [step, setStep] = useState(() => (initialApp ? Math.min(Math.max(initialApp.current_step, 1), 7) : 1));
  const [banner, setBanner] = useState(null); // { tone, text, reload? }
  const [submitted, setSubmitted] = useState(null);

  const go = (n) => {
    setStep(n);
    setBanner(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleError = (r) => {
    if (r.status === 401) {
      setApp(null);
      setStep(1);
      setBanner({ tone: "warn", text: "Your session expired. Verify your mobile number again — your saved progress is safe." });
    } else if (r.error.code === "version_conflict" || r.error.code === "not_editable") {
      setBanner({ tone: "warn", text: r.error.message, reload: true });
    }
    return r.error;
  };

  /** Save one step; resolves to null on success or the error object. */
  const save = async (stepNo, data) => {
    const r = await partnerApi("/api/partners/me", { method: "PATCH", body: { step: stepNo, version: app.version, data } });
    if (!r.ok) return handleError(r);
    setApp(r.data);
    go(stepNo + 1);
    return null;
  };

  const onVerified = async () => {
    const r = await partnerApi("/api/partners/me");
    if (!r.ok) {
      setBanner({ tone: "warn", text: r.error.message });
      return;
    }
    setApp(r.data);
    if (EDITABLE.includes(r.data.status)) go(r.data.full_name ? Math.min(Math.max(r.data.current_step, 2), 7) : 1);
  };

  if (submitted) return <SubmittedPanel result={submitted} />;
  if (app && !EDITABLE.includes(app.status)) return <LockedPanel app={app} />;

  const reachable = (n) => n === 1 || (app && n <= Math.max(app.current_step, 1));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Stepper step={step} reachable={reachable} onJump={go} />

      {app?.review_reason && ["rejected", "info_requested"].includes(app.status) && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <b>{app.status === "rejected" ? "Your application was not approved." : "We need a few more details."}</b>
            <p className="mt-1 whitespace-pre-line">{app.review_reason}</p>
            <p className="mt-1">Update the relevant steps and submit again.</p>
          </div>
        </div>
      )}

      {banner && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="h-5 w-5 shrink-0" />
          <span className="flex-1">{banner.text}</span>
          {banner.reload && (
            <button className={btnGhost} onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
          )}
        </div>
      )}

      <section className={cardCls} aria-labelledby="step-title">
        <h2 id="step-title" className="mb-1 text-xl font-bold text-[var(--ink)] sm:text-2xl">
          {step}. {STEPS[step - 1]}
        </h2>

        {step === 1 &&
          (app ? (
            <StepBasic app={app} onSave={(d) => save(1, d)} />
          ) : (
            <>
              <p className="mb-5 text-sm text-[var(--muted)]">
                Verify your mobile number to start. Already registered? Verifying signs you in and resumes your application.
              </p>
              <OtpSignIn onVerified={onVerified} />
            </>
          ))}
        {step === 2 && <StepCategories app={app} onSave={(d) => save(2, d)} onBack={() => go(1)} />}
        {step === 3 && <StepServices app={app} onSave={(d) => save(3, d)} onBack={() => go(2)} />}
        {step === 4 && <StepBrands app={app} onSave={(d) => save(4, d)} onBack={() => go(3)} />}
        {step === 5 && (
          <StepBusiness app={app} onSave={(d) => save(5, d)} onBack={() => go(4)} onAppUpdate={setApp} onError={handleError} />
        )}
        {step === 6 && <StepLocations app={app} onSave={(d) => save(6, d)} onBack={() => go(5)} />}
        {step === 7 && (
          <StepReview app={app} onJump={go} onBack={() => go(6)} onSubmitted={setSubmitted} onError={handleError} />
        )}
      </section>

      {app && (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Progress is saved each time you press Continue. Application ref: <b>{app.ref}</b> ·{" "}
          <Link href="/partner/dashboard" className="underline">Go to dashboard</Link>
        </p>
      )}
    </div>
  );
}

function Stepper({ step, reachable, onJump }) {
  return (
    <nav aria-label="Registration progress" className="mb-5">
      <p className="mb-2 text-sm font-medium text-[var(--muted)] sm:hidden">
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-purple-100 sm:hidden">
        <div className="h-full bg-purple-600 transition-all" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>
      <ol className="hidden items-center gap-1 sm:flex">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          const can = reachable(n) && !current;
          return (
            <li key={label} className="flex flex-1 items-center gap-1">
              <button
                type="button"
                disabled={!can}
                onClick={() => onJump(n)}
                aria-current={current ? "step" : undefined}
                className="group flex min-w-0 flex-col items-center gap-1 text-center disabled:cursor-default"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                    current
                      ? "bg-purple-600 text-white ring-4 ring-purple-100"
                      : done
                      ? "bg-purple-100 text-purple-700 group-enabled:group-hover:bg-purple-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className={`text-[11px] leading-tight ${current ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"}`}>{label}</span>
              </button>
              {n < STEPS.length && <span className={`mb-5 h-0.5 flex-1 rounded ${done ? "bg-purple-300" : "bg-gray-200"}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepBasic({ app, onSave }) {
  const [name, setName] = useState(app.full_name || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const error = await onSave({ full_name: name });
    setBusy(false);
    setErr(error);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4">
      <div>
        <label htmlFor="b-name" className={labelCls}>Full name *</label>
        <input id="b-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-invalid={!!err?.fields?.full_name} />
        <FieldError msg={err?.fields?.full_name} />
      </div>
      <div>
        <span className={labelCls}>Mobile number</span>
        <p className="flex items-center gap-2 text-[15px] text-[var(--ink)]">
          +91 {app.mobile}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </p>
      </div>
      {err && !err.fields && <FieldError msg={err.message} />}
      <StepNav busy={busy} />
    </form>
  );
}

function SubmittedPanel({ result }) {
  return (
    <div className={`${cardCls} mx-auto max-w-xl text-center`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--ink)]">Application submitted</h2>
      <p className="mt-2 text-[var(--body-text)]">
        Thank you! Your reference number is <b>{result.ref}</b>. Our team will review your details — you&apos;ll see the
        outcome on your dashboard. Your profile is not public until it is approved.
      </p>
      <Link href="/partner/dashboard" className={`${btnPrimary} mt-6`}>
        Go to dashboard
      </Link>
    </div>
  );
}

function LockedPanel({ app }) {
  return (
    <div className={`${cardCls} mx-auto max-w-xl text-center`}>
      <h2 className="text-2xl font-bold text-[var(--ink)]">Welcome back, {app.full_name}</h2>
      <p className="mt-2 text-[var(--body-text)]">
        Your application <b>{app.ref}</b> is currently <b>{app.status_label}</b>.
        {app.status === "approved" && " To change your details, use “Edit profile” on your dashboard."}
      </p>
      <Link href="/partner/dashboard" className={`${btnPrimary} mt-6`}>
        Open dashboard
      </Link>
    </div>
  );
}
