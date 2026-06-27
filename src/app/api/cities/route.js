import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
// Cities change rarely — let Next cache the response for an hour.
export const revalidate = 3600;

export async function GET() {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT id, city_name, city_url, state
       FROM city_tb
       WHERE status = '1'
       ORDER BY city_name ASC`
    );
    return NextResponse.json(
      { success: true, data: rows, total: rows.length },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
