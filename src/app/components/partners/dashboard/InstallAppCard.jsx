"use client";

import { useEffect, useState } from "react";
import { Smartphone, Download, X, Share } from "lucide-react";
import { btnPrimary } from "../ui";

const KEY = "mse_partner_app_installed";
const HIDE_KEY = "mse_partner_app_hide_until";

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

/** Running as the installed app (home-screen icon), or installed before on this device. */
function isInstalled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true || read(KEY) === "1";
}

/**
 * "Install the partner app" card on the dashboard. Uses the browser's install
 * prompt (Chrome / Edge / Android); on iPhone shows the Share → Add to Home
 * Screen steps. Disappears for good once the app is installed.
 */
export default function InstallAppCard() {
  const [mode, setMode] = useState(null); // null | "prompt" | "ios" | "manual"
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isInstalled()) return;
    if (Number(read(HIDE_KEY) || 0) > Date.now()) return;

    // Needed for the install prompt (push-only worker, no caching).
    navigator.serviceWorker?.getRegistration("/partner/").then((r) => r || navigator.serviceWorker.register("/partner-sw.js", { scope: "/partner/" })).catch(() => {});

    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (ios) setMode("ios");
    else setMode("manual"); // replaced by "prompt" as soon as the browser offers it

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode("prompt");
    };
    const onInstalled = () => {
      write(KEY, "1");
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setDeferred(null);
    if (choice?.outcome === "accepted") {
      write(KEY, "1");
      setMode(null);
    }
  };
  const later = () => {
    write(HIDE_KEY, String(Date.now() + 7 * 86400_000)); // ask again in a week
    setMode(null);
  };

  return (
    <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-4" aria-labelledby="install-h">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white">
        <Smartphone className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="install-h" className="font-bold text-[var(--ink)]">Install the partner app</h2>
        {mode === "ios" ? (
          <p className="text-sm text-[var(--body-text)]">
            In Safari tap <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> <b>Share</b>, then <b>Add to Home Screen</b>. Open leads in one tap.
          </p>
        ) : mode === "manual" ? (
          <p className="text-sm text-[var(--body-text)]">
            Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b> — open leads in one tap, like an app.
          </p>
        ) : (
          <p className="text-sm text-[var(--body-text)]">Add it to your home screen — open new leads in one tap, no app store needed.</p>
        )}
      </div>
      {mode === "prompt" && (
        <button type="button" className={btnPrimary} onClick={install}>
          <Download className="h-4 w-4" /> Install
        </button>
      )}
      <button type="button" onClick={later} aria-label="Not now" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100">
        <X className="h-5 w-5" />
      </button>
    </section>
  );
}
