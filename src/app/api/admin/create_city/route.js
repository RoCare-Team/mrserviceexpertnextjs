import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const {
      city_name,
      city_url,
      city_content,
      state,
      status,
      meta_title,
      meta_keywords,
      meta_description,
    } = body;

    // ---- required field validation ----
    if (!city_name || !city_name.trim()) {
      return NextResponse.json(
        { success: false, message: "City name is required." },
        { status: 400 }
      );
    }
    if (!city_url || !city_url.trim()) {
      return NextResponse.json(
        { success: false, message: "City URL is required." },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // ---- duplicate check: city_name OR city_url already exists ----
    const [existing] = await connection.query(
      `SELECT id, city_name, city_url FROM city_tb
       WHERE city_name = ? OR city_url = ?
       LIMIT 1`,
      [city_name.trim(), city_url.trim()]
    );

    if (existing.length > 0) {
      const dup = existing[0];
      const conflict =
        dup.city_name.toLowerCase() === city_name.trim().toLowerCase()
          ? `city name "${dup.city_name}"`
          : `city URL "${dup.city_url}"`;

      return NextResponse.json(
        {
          success: false,
          message: `A city with this ${conflict} already exists (ID: ${dup.id}). Please use a unique name and URL.`,
        },
        { status: 409 }
      );
    }

    // ---- insert new city ----
    const [result] = await connection.query(
      `INSERT INTO city_tb
        (city_name, city_url, city_content, state, status,
         meta_title, meta_keywords, meta_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        city_name.trim(),
        city_url.trim(),
        city_content ?? null,
        state ?? null,
        status ?? "1",
        meta_title ?? null,
        meta_keywords ?? null,
        meta_description ?? null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "City created successfully.",
        cityId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}