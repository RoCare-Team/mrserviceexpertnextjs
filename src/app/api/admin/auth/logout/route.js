import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ success: true });
  const opts = sessionCookieOptions(0);
  // expire the cookie immediately
  res.cookies.set(opts.name, "", { ...opts, maxAge: 0 });
  return res;
}
