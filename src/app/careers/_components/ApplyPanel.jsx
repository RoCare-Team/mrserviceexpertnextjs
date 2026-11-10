"use client";

import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X, UploadCloud, FileText, Loader2, CheckCircle2, RefreshCw, Trash2, AlertCircle, Send } from "lucide-react";
import { checkResumeFile, formatBytes, RESUME_ACCEPT } from "@/lib/careers/constants";

const INITIAL = {
  full_name: "",
  mobile: "",
  email: "",
  current_city: "",
  total_experience: "",
  current_company: "",
  current_salary: "",
  expected_salary: "",
  notice_period: "",
  cover_letter: "",
  consent: false,
  website: "", // honeypot
};

const inputCls = (err) =>
  `min-h-11 w-full rounded-xl border bg-white px-3 text-[15px] text-[var(--ink)] placeholder:text-[#9a95b5] focus:outline-none focus:ring-2 ${
    err ? "border-red-400 focus:ring-red-100" : "border-[var(--line-strong)] focus:border-purple-500 focus:ring-purple-200"
  }`;

function Field({ id, label, required, error, hint, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-soft)]">
        {label} {required ? <span className="text-red-600">*</span> : <span className="font-normal text-[var(--muted)]">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1 flex items-center gap-1 text-[12.5px] text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[12.5px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** PUT the file straight to S3 with real progress events. */
function putWithProgress(url, file, contentType, onProgress, xhrRef) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")));
    xhr.onerror = () => reject(new Error("Network error while uploading. Please check your connection and try again."));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.send(file);
  });
}

export default function ApplyPanel({ job, options, autoOpen = false }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [upload, setUpload] = useState({ status: "idle", progress: 0, token: null, error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const startedAt = useRef(0);
  const fileInput = useRef(null);
  const xhrRef = useRef(null);
  const dialogRef = useRef(null);
  const uploadSeq = useRef(0);

  const show = () => {
    if (!startedAt.current) startedAt.current = Date.now();
    setOpen(true);
  };

  useEffect(() => {
    if (autoOpen) show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && !submitting && close();
    window.addEventListener("keydown", onKey);
    setTimeout(() => dialogRef.current?.querySelector("input:not([type=hidden]):not([tabindex='-1'])")?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting]);

  function close() {
    setOpen(false);
  }

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function startUpload(f) {
    const seq = ++uploadSeq.current;
    xhrRef.current?.abort();
    setUpload({ status: "uploading", progress: 0, token: null, error: "" });
    try {
      const res = await fetch("/api/careers/resume-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, fileName: f.name, fileSize: f.size, mimeType: f.type }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error?.message || "Could not start the upload. Please try again.");
      const { uploadUrl, uploadToken, contentType } = json.data;
      await putWithProgress(uploadUrl, f, contentType, (p) => seq === uploadSeq.current && setUpload((u) => ({ ...u, progress: p })), xhrRef);
      if (seq !== uploadSeq.current) return;
      setUpload({ status: "done", progress: 100, token: uploadToken, error: "" });
      setErrors((x) => ({ ...x, resume: undefined }));
      toast.success("Resume uploaded successfully.");
    } catch (e) {
      if (e.message === "aborted" || seq !== uploadSeq.current) return;
      setUpload({ status: "error", progress: 0, token: null, error: e.message });
      toast.error(e.message);
    }
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f) return;
    // Validate BEFORE anything is sent — an oversize / wrong file never reaches S3.
    const check = checkResumeFile({ name: f.name, size: f.size, type: f.type });
    if (check.error) {
      toast.error(check.error);
      setErrors((x) => ({ ...x, resume: check.error }));
      return;
    }
    setFile(f);
    startUpload(f);
  }

  function removeFile() {
    uploadSeq.current++;
    xhrRef.current?.abort();
    setFile(null);
    setUpload({ status: "idle", progress: 0, token: null, error: "" });
  }

  function validate() {
    const e = {};
    if (!/^[\p{L}][\p{L} .'-]{1,119}$/u.test(form.full_name.trim())) e.full_name = "Enter your full name (letters only).";
    const m = form.mobile.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(m)) e.mobile = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (form.current_city.trim().length < 2) e.current_city = "Enter your current city.";
    const exp = Number(form.total_experience);
    if (form.total_experience === "" || !Number.isFinite(exp) || exp < 0 || exp > 50) e.total_experience = "Enter your total experience in years (0–50).";
    if (options.require_cover_letter && form.cover_letter.trim().length < 30) e.cover_letter = "Please write a short cover letter (at least 30 characters).";
    if (!file) e.resume = "Please upload your resume / CV.";
    else if (upload.status === "uploading") e.resume = "Please wait for the resume upload to finish.";
    else if (upload.status !== "done") e.resume = "Resume upload failed — please upload it again.";
    if (!form.consent) e.consent = "Please accept the privacy notice to continue.";
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error(e.resume && Object.keys(e).length === 1 ? e.resume : "Please correct the highlighted fields.");
      const firstKey = Object.keys(e)[0];
      dialogRef.current?.querySelector(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jobId: job.id, uploadToken: upload.token, startedAt: startedAt.current }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        const err = json?.error || {};
        if (err.fields) setErrors(err.fields);
        if (err.fields?.resume) removeFile();
        throw new Error(err.message || "Your application could not be submitted. Please try again.");
      }
      setSuccess(json.data);
      toast.success("Application submitted successfully!");
    } catch (e2) {
      toast.error(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k) => errors[k];
  const aria = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <>
      <ToastContainer position="top-center" autoClose={4500} newestOnTop theme="colored" />
      <button
        type="button"
        onClick={show}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-6 text-[16px] font-bold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden="true" /> Apply Now
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(21,13,56,.55)] sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && !submitting && close()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-title"
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[var(--shadow-lg)] sm:rounded-3xl"
          >
            <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-purple-700">Apply for</p>
                <h2 id="apply-title" className="truncate text-lg font-bold text-[var(--ink)]">{job.title}</h2>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="overflow-y-auto px-5 py-10 text-center sm:px-8">
                <span className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--green-soft)] text-[var(--green)]">
                  <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
                </span>
                <h3 className="text-2xl font-bold text-[var(--ink)]">Application Submitted Successfully!</h3>
                <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--body-text)]">{success.message}</p>
                <dl className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">Application ID</dt>
                    <dd className="mt-1 font-mono text-[17px] font-bold text-purple-800">{success.applicationCode}</dd>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">Job Title</dt>
                    <dd className="mt-1 text-[15px] font-bold text-[var(--ink)]">{success.jobTitle}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-[13px] text-[var(--muted)]">Please save your Application ID. A confirmation has been sent to your email.</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] px-6 text-[15px] font-semibold text-[var(--ink-soft)] hover:bg-purple-50"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {/* Honeypot — hidden from people, filled by bots. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                    </label>
                  </div>

                  <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <legend className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--muted)]">Personal details</legend>
                    <Field id="full_name" label="Full Name" required error={err("full_name")}>
                      <input id="full_name" name="full_name" autoComplete="name" maxLength={120} value={form.full_name} onChange={set("full_name")} className={inputCls(err("full_name"))} {...aria("full_name")} />
                    </Field>
                    <Field id="mobile" label="Mobile Number" required error={err("mobile")}>
                      <input id="mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="tel" maxLength={14} placeholder="10-digit mobile" value={form.mobile} onChange={set("mobile")} className={inputCls(err("mobile"))} {...aria("mobile")} />
                    </Field>
                    <Field id="email" label="Email Address" required error={err("email")}>
                      <input id="email" name="email" type="email" autoComplete="email" maxLength={190} value={form.email} onChange={set("email")} className={inputCls(err("email"))} {...aria("email")} />
                    </Field>
                    <Field id="current_city" label="Current City" required error={err("current_city")}>
                      <input id="current_city" name="current_city" autoComplete="address-level2" maxLength={80} value={form.current_city} onChange={set("current_city")} className={inputCls(err("current_city"))} {...aria("current_city")} />
                    </Field>
                  </fieldset>

                  <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <legend className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--muted)]">Professional details</legend>
                    <Field id="total_experience" label="Total Experience (years)" required error={err("total_experience")} hint="Enter 0 if you are a fresher.">
                      <input id="total_experience" name="total_experience" type="number" min="0" max="50" step="0.5" inputMode="decimal" value={form.total_experience} onChange={set("total_experience")} className={inputCls(err("total_experience"))} {...aria("total_experience")} />
                    </Field>
                    <Field id="current_company" label="Current Company" error={err("current_company")}>
                      <input id="current_company" name="current_company" autoComplete="organization" maxLength={150} value={form.current_company} onChange={set("current_company")} className={inputCls(err("current_company"))} />
                    </Field>
                    {options.show_salary_fields && (
                      <>
                        <Field id="current_salary" label="Current Salary" error={err("current_salary")} hint="e.g. ₹25,000 / month">
                          <input id="current_salary" name="current_salary" maxLength={60} value={form.current_salary} onChange={set("current_salary")} className={inputCls(err("current_salary"))} />
                        </Field>
                        <Field id="expected_salary" label="Expected Salary" error={err("expected_salary")}>
                          <input id="expected_salary" name="expected_salary" maxLength={60} value={form.expected_salary} onChange={set("expected_salary")} className={inputCls(err("expected_salary"))} />
                        </Field>
                      </>
                    )}
                    <Field id="notice_period" label="Notice Period" error={err("notice_period")}>
                      <select id="notice_period" name="notice_period" value={form.notice_period} onChange={set("notice_period")} className={inputCls(err("notice_period"))}>
                        <option value="">Select</option>
                        {["Immediate", "15 days", "30 days", "45 days", "60 days", "90 days", "Serving notice"].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </Field>
                  </fieldset>

                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-[var(--ink-soft)]">
                      Resume / CV <span className="text-red-600">*</span>
                    </p>
                    <input ref={fileInput} type="file" accept={RESUME_ACCEPT} onChange={onPick} className="sr-only" id="resume" name="resume" aria-describedby="resume-help" />
                    {!file ? (
                      <label
                        htmlFor="resume"
                        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition hover:border-purple-400 hover:bg-purple-50 ${
                          err("resume") ? "border-red-300 bg-red-50/40" : "border-[var(--line-strong)] bg-[var(--surface-soft)]"
                        }`}
                      >
                        <UploadCloud className="h-8 w-8 text-purple-600" aria-hidden="true" />
                        <span className="text-[15px] font-semibold text-[var(--ink)]">Click to upload your resume</span>
                        <span id="resume-help" className="text-[13px] text-[var(--muted)]">PDF, DOC or DOCX · max 5 MB</span>
                      </label>
                    ) : (
                      <div className={`rounded-2xl border p-4 ${upload.status === "error" ? "border-red-300 bg-red-50/50" : "border-[var(--line-strong)] bg-[var(--surface-soft)]"}`}>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-700 shadow-[var(--shadow-sm)]">
                            <FileText className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-[var(--ink)]" title={file.name}>{file.name}</p>
                            <p className="text-[12.5px] text-[var(--muted)]">
                              {formatBytes(file.size)} ·{" "}
                              {upload.status === "uploading" ? (
                                <span className="text-purple-700">Uploading {upload.progress}%</span>
                              ) : upload.status === "done" ? (
                                <span className="inline-flex items-center gap-1 text-[var(--green)]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Uploaded</span>
                              ) : upload.status === "error" ? (
                                <span className="text-red-600">Upload failed</span>
                              ) : null}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {upload.status === "error" && (
                              <button type="button" onClick={() => startUpload(file)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-purple-700 hover:bg-white" title="Retry upload">
                                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
                              </button>
                            )}
                            <button type="button" onClick={() => fileInput.current?.click()} disabled={submitting} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-white" title="Replace file">
                              <RefreshCw className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Replace</span>
                            </button>
                            <button type="button" onClick={removeFile} disabled={submitting} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-red-600 hover:bg-white" title="Remove file">
                              <Trash2 className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                        {(upload.status === "uploading" || upload.status === "done") && (
                          <div className="careers-progress mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={upload.progress} aria-label="Resume upload progress">
                            <span style={{ width: `${upload.progress}%` }} />
                          </div>
                        )}
                        {upload.status === "error" && <p className="mt-2 text-[12.5px] text-red-600">{upload.error}</p>}
                      </div>
                    )}
                    {err("resume") && (
                      <p id="resume-err" className="mt-1 flex items-center gap-1 text-[12.5px] text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {err("resume")}
                      </p>
                    )}
                  </div>

                  <Field id="cover_letter" label="Cover Letter" required={options.require_cover_letter} error={err("cover_letter")}>
                    <textarea id="cover_letter" name="cover_letter" rows={4} maxLength={5000} value={form.cover_letter} onChange={set("cover_letter")} placeholder="Tell us briefly why you are a good fit for this role." className={`${inputCls(err("cover_letter"))} py-2.5`} {...aria("cover_letter")} />
                  </Field>

                  <div>
                    <label className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--body-text)]">
                      <input type="checkbox" name="consent" checked={form.consent} onChange={set("consent")} className="mt-1 h-4 w-4 shrink-0 accent-purple-700" {...aria("consent")} />
                      <span>
                        I agree that Mr. Service Expert may store and use my details and resume to evaluate this and future job applications, as described in the{" "}
                        <a href="/privacy-and-policy" target="_blank" className="font-semibold text-purple-700 underline">privacy policy</a>.
                      </span>
                    </label>
                    {err("consent") && (
                      <p id="consent-err" className="mt-1 flex items-center gap-1 text-[12.5px] text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {err("consent")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button type="button" onClick={close} disabled={submitting} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-5 text-[15px] font-semibold text-[var(--ink-soft)] hover:bg-purple-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || upload.status === "uploading"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-6 text-[15px] font-bold text-white shadow-[var(--shadow-cta)] hover:brightness-110 disabled:opacity-60">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    {submitting ? "Submitting…" : upload.status === "uploading" ? "Uploading resume…" : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
