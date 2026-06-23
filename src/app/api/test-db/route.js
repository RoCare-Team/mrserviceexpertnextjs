import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  let connection;

  try {
    connection = await db.getConnection();

    const [rows] = await connection.query(
      "SELECT NOW() AS server_time"
    );

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Database Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}