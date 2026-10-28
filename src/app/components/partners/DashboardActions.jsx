"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Loader2 } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { btnGhost, btnPrimary } from "./ui";

export default function DashboardActions({ status, editable }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const canReopen = status === "approved" || status === "pending";

  const startEdit = async () => {
    setBusy(true);
    const r = await partnerApi("/api/partners/me/edit", { method: "POST" });
    setBusy(false);
    if (r.ok) router.push("/partner/profile");
    else setMsg(r.error.message);
  };

  const logout = async () => {
    await partnerApi("/api/partner-auth/logout", { method: "POST" });
    router.replace("/partner/login");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {editable && (
        <button className={btnPrimary} onClick={() => router.push("/partner/profile")}>
          <Pencil className="h-4 w-4" /> Edit profile
        </button>
      )}
      {canReopen && !confirming && (
        <button className={btnPrimary} onClick={() => setConfirming(true)}>
          <Pencil className="h-4 w-4" /> Edit profile
        </button>
      )}
      <button className={btnGhost} onClick={logout}>
        <LogOut className="h-4 w-4" /> Log out
      </button>

      {confirming && (
        <div role="alertdialog" aria-modal="false" className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            {status === "approved"
              ? "Editing takes your profile off the website until our team approves your changes. Continue?"
              : "Editing withdraws your application from review. You'll need to submit it again. Continue?"}
          </p>
          <div className="mt-3 flex gap-2">
            <button className={btnPrimary} onClick={startEdit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Yes, edit
            </button>
            <button className={btnGhost} onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          </div>
          {msg && <p className="mt-2 text-red-700">{msg}</p>}
        </div>
      )}
    </div>
  );
}
