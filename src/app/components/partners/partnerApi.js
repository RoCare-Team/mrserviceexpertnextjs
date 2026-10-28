"use client";

/**
 * Tiny fetch wrapper for the partner APIs. Always resolves to
 * { ok, data, error: { code, message, fields } } — never throws.
 */
export async function partnerApi(url, { method = "GET", body, form } = {}) {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {}
    if (res.ok && json?.success) return { ok: true, data: json.data, status: res.status };
    return {
      ok: false,
      status: res.status,
      error: json?.error || { code: "network", message: json?.message || "Something went wrong. Please try again." },
    };
  } catch {
    return { ok: false, status: 0, error: { code: "network", message: "You appear to be offline. Check your connection and try again." } };
  }
}
