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
    const [[catRow]] = await connection.query(
      `SELECT id, category_name, category_url, banner, category_content
         FROM category_tb WHERE LOWER(category_url) = ? LIMIT 1`,
      [cat]
    );

    if (!cityRow || !catRow) return null;

    // A brand_url may exist once per category (e.g. "godrej" for AC,
    // refrigerator and washing machine), so prefer the row belonging to
    // the requested category and only then fall back to any match.
    const [[brandRow]] = await connection.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb
        WHERE LOWER(brand_url) = ?
        ORDER BY (category_id = ?) DESC, id ASC
        LIMIT 1`,
      [brand, catRow.id]
    );

    if (!brandRow) return null;

    // The actual page content (city + brand + category). Match the brand
    // by URL via a join so a page linked to a sibling brand row (same
    // brand_url, different category row) is still found.
    const [[pageRow]] = await connection.query(
      `SELECT pm.*
         FROM page_master_tb pm
         JOIN brand_tb b ON b.id = pm.brand_id
        WHERE pm.city_id = ? AND pm.category_id = ? AND LOWER(b.brand_url) = ?
        ORDER BY pm.id ASC
        LIMIT 1`,
      [cityRow.id, catRow.id, brand]
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