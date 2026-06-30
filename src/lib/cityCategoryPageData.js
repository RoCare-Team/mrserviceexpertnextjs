
import db from "@/lib/db";

const normalize = (v = "") => v.toString().toLowerCase().trim();

export async function getCityCategoryPageData(rawCity, rawCat) {
  const city = normalize(rawCity);
  const cat = normalize(rawCat);
  if (!city || !cat) return null;

  let connection;
  try {
    connection = await db.getConnection();

    const [[cityRow]] = await connection.query(
      `SELECT id, city_name, city_url, state
         FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1`,
      [city]
    );
    const [[catRow]] = await connection.query(
      `SELECT id, category_name, category_url, banner, category_content,
              meta_title, meta_keywords, meta_description, phone
         FROM category_tb WHERE LOWER(category_url) = ? LIMIT 1`,
      [cat]
    );

    if (!cityRow || !catRow) return null;

    // Page content for this city + category (no brand) → master_tb_withoutbrand.
    const [[pageRow]] = await connection.query(
      `SELECT *
         FROM master_tb_withoutbrand
        WHERE city_id = ? AND category_id = ?
        ORDER BY id ASC
        LIMIT 1`,
      [cityRow.id, catRow.id]
    );

    // Brands available in this category → "Popular Brand" section.
    const [brands] = await connection.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb
        WHERE category_id = ?
          AND brand_url IS NOT NULL AND brand_url <> ''
        ORDER BY brand_name ASC`,
      [catRow.id]
    );

    // Related cities (same state) → "Popular Cities Near Me" (all, no limit).
    const [related] = await connection.query(
      `SELECT id, city_name, city_url
         FROM city_tb
        WHERE state = ?
          AND city_url IS NOT NULL AND city_url <> ''
          AND LOWER(city_url) <> ?
        ORDER BY city_name ASC`,
      [cityRow.state, city]
    );

    return {
      // page_master_tb row → data.content.* (meta_*, page_content, faq*).
      // Falls back to the category's own content if no specific page row exists.
      content:
        pageRow || {
          meta_title: catRow.meta_title,
          meta_description: catRow.meta_description,
          meta_keywords: catRow.meta_keywords,
          page_content: catRow.category_content,
        },
      city_name: cityRow.city_name,
      cityname: cityRow.city_name,
      // Top-level fields the <ServicePage> heading/banner read directly.
      category_name: catRow.category_name,
      categoryname: catRow.category_name,
      banner: catRow.banner,
      // The page filters this array by slugified category_name.
      category: [catRow],
      brands,
      related_cities: related.map((c) => ({
        id: c.id,
        city_id: c.id,
        parent_city: cityRow.state,
        url: `/${c.city_url}`,
        city_name: c.city_name,
        city_url: c.city_url,
      })),
      // Page blanks these out itself; included for shape parity.
      cities: [],
      category_services: [],
    };
  } finally {
    if (connection) connection.release();
  }
}