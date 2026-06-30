// lib/brandPageData.js
//
// Replaces get_drand_page_data.php for the /{city}/{brand}/{cat} route.
//
// How it maps to your tables:
//   city_tb.city_url        → city_id
//   brand_tb.brand_url      → brand_id
//   category_tb.category_url → category_id
//   page_master_tb          → the page row matching all three IDs
//
// The returned shape matches exactly what <ServicePage> reads from `pagedata`.

import db from "@/lib/db";

const normalize = (v = "") => v.toString().toLowerCase().trim();

export async function getBrandPageData(rawCity, rawBrand, rawCat) {
  const city = normalize(rawCity);
  const brand = normalize(rawBrand);
  const cat = normalize(rawCat);
  if (!city || !brand || !cat) return null;

  let connection;
  try {
    connection = await db.getConnection();

    // Resolve each slug to its row.
    const [[cityRow]] = await connection.query(
      `SELECT id, city_name, city_url, state
         FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1`,
      [city]
    );
    const [[brandRow]] = await connection.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb WHERE LOWER(brand_url) = ? LIMIT 1`,
      [brand]
    );
    const [[catRow]] = await connection.query(
      `SELECT id, category_name, category_url, banner, category_content
         FROM category_tb WHERE LOWER(category_url) = ? LIMIT 1`,
      [cat]
    );

    // Any slug not found → no page.
    if (!cityRow || !brandRow || !catRow) return null;

    // The actual page content (city + brand + category).
    const [[pageRow]] = await connection.query(
      `SELECT *
         FROM page_master_tb
        WHERE city_id = ? AND brand_id = ? AND category_id = ?
        ORDER BY id ASC
        LIMIT 1`,
      [cityRow.id, brandRow.id, catRow.id]
    );

    if (!pageRow) return null;

    // "Popular Brands" — every brand in this category.
    const [brands] = await connection.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb
        WHERE category_id = ?
          AND brand_url IS NOT NULL AND brand_url <> ''
        ORDER BY brand_name ASC`,
      [catRow.id]
    );

    return {
      // page_master_tb row → pagedata.content.* (page_content, meta_*, faq*)
      content: pageRow,
      cityname: cityRow.city_name,
      city_name: cityRow.city_name,
      brandname: brandRow.brand_name,
      categoryname: catRow.category_name,
      banner: catRow.banner,
      brands,
    };
  } finally {
    if (connection) connection.release();
  }
}