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
          AND status = '1'
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

    // "Popular Brands" — only brands that actually HAVE a page for this city +
    // category. Matched on brand_url (not brand_id) so this list agrees exactly
    // with how getBrandPageData resolves /{city}/{brand}/{cat}; a brand without
    // a page row would otherwise be rendered as a link straight into a 404.
    const [brands] = await connection.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb b
        WHERE b.category_id = ?
          AND b.status = '1'
          AND b.brand_url IS NOT NULL AND b.brand_url <> ''
          AND EXISTS (
            SELECT 1
              FROM page_master_tb pm
              JOIN brand_tb b2 ON b2.id = pm.brand_id
             WHERE pm.city_id = ?
               AND pm.category_id = ?
               AND LOWER(b2.brand_url) = LOWER(b.brand_url)
          )
        ORDER BY b.brand_name ASC`,
      [catRow.id, cityRow.id, catRow.id]
    );

    // "Popular Cities" — other cities that have a page for THIS brand and
    // category, so every link stays /{city}/{brand}/{cat} and none can 404.
    //
    // Same state first, because those are the genuinely nearby cities. 348 of
    // the 2,294 city rows have a NULL state though, and `state = ?` never
    // matches NULL in SQL, so that tier silently returned nothing for ~15% of
    // brand pages and the block vanished. When it comes back empty we fall
    // back to any city carrying this brand + category, capped so the page does
    // not sprout hundreds of links.
    const CITY_LINK_CAP = 40;
    const relatedCitiesSql = (scoped) => `
      SELECT DISTINCT ci.id, ci.city_name, ci.city_url
        FROM page_master_tb pm
        JOIN city_tb ci ON ci.id = pm.city_id
        JOIN brand_tb b ON b.id = pm.brand_id
       WHERE pm.category_id = ?
         AND LOWER(b.brand_url) = ?
         AND LOWER(ci.city_url) <> ?
         AND ci.city_url IS NOT NULL AND ci.city_url <> ''
         ${scoped ? "AND ci.state = ?" : ""}
       ORDER BY ci.city_name ASC
       ${scoped ? "" : `LIMIT ${CITY_LINK_CAP}`}`;

    let relatedCities = [];
    if (cityRow.state) {
      [relatedCities] = await connection.query(relatedCitiesSql(true), [
        catRow.id, brand, city, cityRow.state,
      ]);
    }
    if (!relatedCities.length) {
      [relatedCities] = await connection.query(relatedCitiesSql(false), [
        catRow.id, brand, city,
      ]);
    }

    // "Other Services" — the same brand in this same city, other categories.
    // Existence-gated for the same reason as the cities list above.
    const [relatedCategories] = await connection.query(
      `SELECT DISTINCT ca.id, ca.category_name, ca.category_url
         FROM page_master_tb pm
         JOIN category_tb ca ON ca.id = pm.category_id
         JOIN brand_tb b ON b.id = pm.brand_id
        WHERE pm.city_id = ?
          AND LOWER(b.brand_url) = ?
          AND ca.id <> ?
          AND ca.status = '1'
          AND ca.category_url IS NOT NULL AND ca.category_url <> ''
        ORDER BY ca.category_name ASC`,
      [cityRow.id, brand, catRow.id]
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
      // Same shape the city+category route hands its "Popular Cities Near Me"
      // block, so the two pages can render identical markup.
      related_cities: relatedCities.map((c) => ({
        id: c.id,
        city_id: c.id,
        parent_city: cityRow.state,
        url: `/${c.city_url}/${brand}/${cat}`,
        city_name: c.city_name,
        city_url: c.city_url,
      })),
      related_categories: relatedCategories.map((c) => ({
        id: c.id,
        url: `/${city}/${brand}/${c.category_url}`,
        category_name: c.category_name,
        category_url: c.category_url,
      })),
    };
  } finally {
    if (connection) connection.release();
  }
}