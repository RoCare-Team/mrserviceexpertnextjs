import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    connection = await db.getConnection();

    // Categories dropdown
    if (searchParams.get("type") === "categories") {
      const [rows] = await connection.query(
        `SELECT id, category_name FROM category_tb
         WHERE status = '1'
         ORDER BY category_name ASC`
      );
      return NextResponse.json({ success: true, categories: rows });
    }

    // Check duplicate brand_name or brand_url in real-time
    if (searchParams.get("type") === "check_duplicate") {
      const field = searchParams.get("field"); // "brand_name" or "brand_url"
      const value = (searchParams.get("value") || "").trim();

      if (!["brand_name", "brand_url"].includes(field) || !value) {
        return NextResponse.json({ success: true, exists: false });
      }

      const [rows] = await connection.query(
        `SELECT id FROM brand_tb WHERE ${field} = ? LIMIT 1`,
        [value]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    return NextResponse.json({ success: false, message: "Unknown request type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const {
      brand_name,
      brand_url,
      category_id,
      status = "1",
      icon,
      meta_title,
      meta_keywords,
      meta_description,
      brand_content,
    } = body;

    // --- Required field validation ---
    const errors = {};
    if (!brand_name || !brand_name.trim()) errors.brand_name = "Brand name is required.";
    if (!brand_url || !brand_url.trim()) errors.brand_url = "Brand URL is required.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 422 }
      );
    }

    const trimmedName = brand_name.trim();
    const trimmedUrl = brand_url.trim();

    connection = await db.getConnection();

    // --- Duplicate check (name AND url) ---
    const [dupRows] = await connection.query(
      `SELECT id, brand_name, brand_url FROM brand_tb
       WHERE brand_name = ? OR brand_url = ?
       LIMIT 2`,
      [trimmedName, trimmedUrl]
    );

    if (dupRows.length > 0) {
      const dupErrors = {};
      dupRows.forEach((row) => {
        if (row.brand_name === trimmedName)
          dupErrors.brand_name = `A brand with this name already exists (ID: ${row.id}).`;
        if (row.brand_url === trimmedUrl)
          dupErrors.brand_url = `A brand with this URL already exists (ID: ${row.id}).`;
      });
      return NextResponse.json(
        { success: false, message: "Duplicate entry detected.", errors: dupErrors },
        { status: 409 }
      );
    }

    // --- Insert ---
    const [result] = await connection.query(
      `INSERT INTO brand_tb
        (brand_name, brand_url, category_id, status, icon,
         meta_title, meta_keywords, meta_description, brand_content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        trimmedName,
        trimmedUrl,
        category_id || null,
        status,
        icon || null,
        meta_title || null,
        meta_keywords || null,
        meta_description || null,
        brand_content || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully.",
        brand_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    // MySQL duplicate key fallback (unique index at DB level)
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "A brand with this name or URL already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}