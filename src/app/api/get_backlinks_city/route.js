import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // status = 1 wali active cities hi lena (agar sab chahiye to WHERE hata dena)
    const [rows] = await db.query(
      `SELECT UPPER(TRIM(state)) AS state_name, TRIM(city_name) AS city_name
       FROM city_tb
       WHERE status = '1'
         AND state IS NOT NULL AND state <> ''
       ORDER BY state_name ASC, city_name ASC`
    );

    // Group by state_name -> { state, city_count, cities }
    const byState = new Map();
    for (const { state_name, city_name } of rows) {
      if (!byState.has(state_name)) {
        byState.set(state_name, { state: state_name, city_count: 0, cities: [] });
      }
      const entry = byState.get(state_name);
      entry.cities.push(city_name);
      entry.city_count++;
    }

    const states = [...byState.values()];

    return NextResponse.json(
      { success: true, count: states.length, states },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
