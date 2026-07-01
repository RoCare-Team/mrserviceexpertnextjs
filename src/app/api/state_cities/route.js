import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // status = 1 wali active cities hi lena (agar sab chahiye to WHERE hata dena)
    const [rows] = await db.query(
      `SELECT state_name, city_name
       FROM city_table
       WHERE status = 1
       ORDER BY state_name ASC, city_name ASC`
    );

    // Group by state_name -> array of city_name
    const data = {};
    let totalCities = 0;

    for (const row of rows) {
      const state = row.state_name;
      const city = row.city_name;

      if (!data[state]) {
        data[state] = [];
      }
      data[state].push(city);
      totalCities++;
    }

    return NextResponse.json(
      {
        totalCities,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
}