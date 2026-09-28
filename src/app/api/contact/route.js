import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

// Public endpoint behind the /contact form. Writes one row to contact_us_tb;
// admins read them at /admin/contact_us (via /api/admin/contact_us).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile, after stripping +91 / 0 / spaces

// Light per-IP throttle so a bot can't flood the table. In-memory, so it is
// per process — good enough for a contact form.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = globalThis._contactHits ?? (globalThis._contactHits = new Map());

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

const bad = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: real users never see or fill this field.
  if (body.website) return NextResponse.json({ success: true, message: "Thank you!" });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const phone = String(body.phone || "")
    .replace(/[\s-]/g, "")
    .replace(/^(\+91|91|0)(?=\d{10}$)/, "");

  if (name.length < 2 || name.length > 120) return bad("Please enter your full name.");
  if (!PHONE_RE.test(phone)) return bad("Please enter a valid 10-digit mobile number.");
  if (!EMAIL_RE.test(email) || email.length > 160) return bad("Please enter a valid email address.");
  if (subject.length > 160) return bad("Subject is too long.");
  if (message.length < 5) return bad("Please write a short message.");
  if (message.length > 3000) return bad("Message is too long (max 3000 characters).");

  const ip =
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "";
  if (ip && tooMany(ip))
    return bad("Too many messages. Please try again in a few minutes.", 429);

  try {
    await db.query(
      `INSERT INTO contact_us_tb
         (name, phone, email, subject, message, ip_address, user_agent, page_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email,
        subject || null,
        message,
        ip.slice(0, 64) || null,
        (request.headers.get("user-agent") || "").slice(0, 300) || null,
        String(body.page_url || "").slice(0, 500) || null,
      ]
    );
    return NextResponse.json({
      success: true,
      message: "Your message has been sent. Our team will contact you soon.",
    });
  } catch (error) {
    console.error("contact form insert failed:", error);
    return bad("Something went wrong. Please try again or call us.", 500);
  }
}
