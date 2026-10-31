import { clientIp } from "@/lib/partners/http";

// Customer login OTP (site header / "Add" on a service). Proxies the CRM OTP
// API with the app token, and caps resends: one OTP + 3 resends per number in
// 10 minutes, at least 30 s apart, so a double-tap never sends two messages.
export const COOLDOWN_SEC = 30;
export const MAX_RESENDS = 3;
const WINDOW_MS = 10 * 60_000;
const IP_LIMIT_PER_HOUR = 20;

// Per-process ledger: { phone → [sentAt, …] }, { ip → [sentAt, …] }.
const byPhone = new Map();
const byIp = new Map();

function recent(map, key, windowMs) {
  const now = Date.now();
  const list = (map.get(key) || []).filter((t) => now - t < windowMs);
  map.set(key, list);
  if (map.size > 5000) for (const [k, v] of map) if (!v.length || now - v[v.length - 1] > windowMs) map.delete(k);
  return list;
}

export async function POST(request) {
  const body = await request.json();
  const phone = String(body?.phoneNumber || "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return Response.json({ error: true, msg: "Enter a valid 10-digit mobile number." }, { status: 422 });
  }

  const sends = recent(byPhone, phone, WINDOW_MS);
  const last = sends[sends.length - 1];
  if (last && Date.now() - last < COOLDOWN_SEC * 1000) {
    const retryAfter = Math.ceil((COOLDOWN_SEC * 1000 - (Date.now() - last)) / 1000);
    return Response.json({ error: true, msg: `Please wait ${retryAfter}s before requesting another OTP.`, retryAfter }, { status: 429 });
  }
  if (sends.length > MAX_RESENDS) {
    return Response.json({ error: true, msg: "OTP resend limit reached. Please try again after 10 minutes.", resendsLeft: 0 }, { status: 429 });
  }
  const ip = clientIp(request) || "unknown";
  if (recent(byIp, ip, 60 * 60_000).length >= IP_LIMIT_PER_HOUR) {
    return Response.json({ error: true, msg: "Too many OTP requests. Please try again later." }, { status: 429 });
  }

  // Record before calling the provider so a concurrent double-click hits the cooldown.
  sends.push(Date.now());
  byIp.get(ip).push(Date.now());

  const response = await fetch(process.env.NEXT_PUBLIC_API_SEND_OTP, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Token": `${process.env.OTP_TOKEN}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();
  if (data?.error !== false) sends.pop(); // a failed send does not count against the limit
  return Response.json({ ...data, resendAfter: COOLDOWN_SEC, resendsLeft: Math.max(0, MAX_RESENDS - (sends.length - 1)) });
}
