
import { NextResponse } from "next/server";
import { fetchCityData } from "@/lib/cityData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function respond(city) {
  try {
    const { data, notFound } = await fetchCityData(city);
    return NextResponse.json(data, { status: notFound ? 404 : 200 });
  } catch (error) {
    console.error("get_city_data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return respond(searchParams.get("city") || "");
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  return respond(body.city || "");
}