import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);

    connection = await db.getConnection();

    // ---- real-time duplicate check ----
    if (searchParams.get("type") === "check_duplicate") {
      const field = searchParams.get("field");
      const value = (searchParams.get("value") || "").trim();

      if (!["category_name", "category_url"].includes(field) || !value) {
        return NextResponse.json({ success: true, exists: false });
      }

      const [rows] = await connection.query(
        `SELECT id FROM category_tb WHERE ${field} = ? LIMIT 1`,
        [value]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    return NextResponse.json(
      { success: false, message: "Unknown request type." },
      { status: 400 }
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

// ---- CREATE a new category ----
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const {
      category_name,
      category_url,
      category_content,
      status = "1",
      phone,
      banner,
      icon,
      meta_title,
      meta_keywords,
      meta_description,
    } = body;

    // --- Required field validation ---
    const errors = {};
    if (!category_name || !category_name.trim())
      errors.category_name = "Category name is required.";
    if (!category_url || !category_url.trim())
      errors.category_url = "Category URL is required.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed.", errors },
        { status: 422 }
      );
    }

    const trimmedName = category_name.trim();
    const trimmedUrl = category_url.trim();

    connection = await db.getConnection();

    // --- Duplicate check ---
    const [dupRows] = await connection.query(
      `SELECT id, category_name, category_url FROM category_tb
       WHERE category_name = ? OR category_url = ?
       LIMIT 2`,
      [trimmedName, trimmedUrl]
    );

    if (dupRows.length > 0) {
      const dupErrors = {};
      dupRows.forEach((row) => {
        if (row.category_name === trimmedName)
          dupErrors.category_name = `Category name already exists (ID: ${row.id}).`;
        if (row.category_url === trimmedUrl)
          dupErrors.category_url = `Category URL already exists (ID: ${row.id}).`;
      });
      return NextResponse.json(
        { success: false, message: "Duplicate entry detected.", errors: dupErrors },
        { status: 409 }
      );
    }

    // --- Insert ---
    const [result] = await connection.query(
      `INSERT INTO category_tb
        (category_name, category_url, category_content, status,
         phone, banner, icon, meta_title, meta_keywords, meta_description,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        trimmedName,
        trimmedUrl,
        category_content || null,
        status,
        phone || null,
        banner || null,
        icon || null,
        meta_title || null,
        meta_keywords || null,
        meta_description || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully.",
        category_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "A category with this name or URL already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}