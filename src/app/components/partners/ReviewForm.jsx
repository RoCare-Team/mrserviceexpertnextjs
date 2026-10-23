"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { partnerApi } from "./partnerApi";
import CustomerOtp from "./CustomerOtp";
import { btnPrimary, btnGhost, inputCls, FieldError } from "./ui";

/** Logged-in (OTP-verified) customers can post or edit one review. */
export default function ReviewForm({ partnerSlug, partnerName }) {
  const router = useRouter();
  const [state, setState] = useState("loading"); // loading | guest | login | form
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [existing, setExisting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const r = await partnerApi(`/api/partner-reviews?partner=${encodeURIComponent(partnerSlug)}`);
    if (!r.ok || !r.data.customer) return setState("guest");
    setExisting(r.data.review);
    if (r.data.review) {
      setRating(r.data.review.rating);
      setComment(r.data.review.comment || "");
    }
    setState("form");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerSlug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setMsg("Please choose a star rating.");
    setBusy(true);
    setMsg("");
    const r = await partnerApi("/api/partner-reviews", { method: "POST", body: { partner: partnerSlug, rating, comment } });
    setBusy(false);
    if (!r.ok) return setMsg(r.error.message);
    setSaved(true);
    setExisting({ rating, comment, status: "published" });
    router.refresh();
  };

  if (state === "loading") return null;

  if (state === "guest")
    return (
      <div className="rounded-2xl bg-purple-50/60 p-4 text-sm">
        <p className="text-[var(--ink-soft)]">Used {partnerName}&apos;s service? Share your experience.</p>
        <button className={`${btnGhost} mt-3`} onClick={() => setState("login")}>Write a review</button>
      </div>
    );

  if (state === "login")
    return (
      <div className="rounded-2xl border border-[var(--line)] p-4">
        <CustomerOtp intro="Verify your mobile number to post a review." onVerified={() => load()} />
      </div>
    );

  if (existing?.status === "removed")
    return <p className="text-sm text-[var(--muted)]">Your review for this partner was removed by a moderator.</p>;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--line)] p-4" noValidate>
      <p className="mb-2 font-semibold text-[var(--ink)]">{existing ? "Your review" : "Write a review"}</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => (setRating(n), setSaved(false))}
            className="rounded p-1 focus-visible:outline-2 focus-visible:outline-purple-600"
          >
            <Star className={`h-7 w-7 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <label htmlFor="rv-text" className="sr-only">Your review</label>
      <textarea
        id="rv-text"
        rows={3}
        maxLength={1000}
        className={`${inputCls} mt-3`}
        placeholder="How was the service? (optional)"
        value={comment}
        onChange={(e) => (setComment(e.target.value), setSaved(false))}
      />
      <FieldError msg={msg} />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {existing ? "Update review" : "Post review"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Thanks! Your review is live.</span>}
      </div>
    </form>
  );
}
