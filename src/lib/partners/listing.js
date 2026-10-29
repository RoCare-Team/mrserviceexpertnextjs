// Public partner listings for existing city / locality service pages, and the
// public profile. Only partners that are approved, listed, mobile-verified
// and not deleted ever leave this module.
//
// Coverage rule (see partner_service_areas):
//   • city-wide row (locality_id NULL) → shown on that city's pages
//   • locality row                      → shown on that locality's pages
// A city-wide partner is NOT shown on every locality page, and a
// locality-only partner is NOT shown on the parent city page.

import db from "@/lib/db";
import { publicUrl } from "@/lib/partners/storage";
import { getRatingSummaries } from "@/lib/partners/reviews";
import { CRM_LEAD_TYPES } from "@/lib/partners/crm";
import { getWorkDoneCounts, workDoneLabel } from "@/lib/partners/seo";

const PUBLIC_WHERE = `p.status = 'approved' AND p.is_listed = 1
  AND p.mobile_verified_at IS NOT NULL AND p.deleted_at IS NULL`;

export const LISTING_PAGE_SIZE = 6;

/** Resolve the canonical ids behind an existing page URL. */
export async function resolvePageIds({ cityUrl, categoryUrl, brandUrl = null }) {
  const [[city]] = await db.query("SELECT id FROM city_tb WHERE LOWER(city_url) = ? AND status = '1' LIMIT 1", [cityUrl]);
  const [[cat]] = await db.query("SELECT id FROM category_tb WHERE LOWER(category_url) = ? LIMIT 1", [categoryUrl]);
  if (!city || !cat) return null;
  let brandId = null;
  if (brandUrl) {
    const [[brand]] = await db.query(
      "SELECT id FROM brand_tb WHERE LOWER(brand_url) = ? AND category_id = ? LIMIT 1",
      [brandUrl, cat.id]
    );
    if (!brand) return null;
    brandId = brand.id;
  }
  return { cityId: city.id, categoryId: cat.id, brandId };
}

/**
 * One page of partners for a city/locality + category (+ optional brand).
 * EXISTS sub-queries keep each partner exactly once however many rows match.
 */
export async function getListingPage({ cityId, categoryId, brandId = null, page = 1, pageSize = LISTING_PAGE_SIZE }) {
  const size = Math.min(Math.max(Number(pageSize) || LISTING_PAGE_SIZE, 1), 24);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size;

  const params = [categoryId, cityId, cityId];
  let brandSql = "";
  if (brandId) {
    brandSql = `AND EXISTS (SELECT 1 FROM partner_brands pb
                             WHERE pb.partner_id = p.id AND pb.category_id = ? AND pb.brand_id = ?)`;
    params.push(categoryId, brandId);
  }
  const where = `${PUBLIC_WHERE}
    AND EXISTS (SELECT 1 FROM partner_services ps WHERE ps.partner_id = p.id AND ps.category_id = ?)
    AND EXISTS (SELECT 1 FROM partner_service_areas a
                 WHERE a.partner_id = p.id
                   AND ((a.city_id = ? AND a.locality_key = 0) OR a.locality_id = ?))
    ${brandSql}`;

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM partners p WHERE ${where}`, params);
  if (!total) return { items: [], total: 0, page: 1, pageSize: size, hasMore: false };

  const [rows] = await db.query(
    `SELECT p.id, p.slug, p.business_name, p.business_type, p.experience_years, p.logo_key,
            p.operating_hours, p.is_available,
            p.identity_verified_at IS NOT NULL AS identity_verified,
            p.gst_verified_at IS NOT NULL AS gst_verified
       FROM partners p
      WHERE ${where}
      ORDER BY (p.identity_verified_at IS NOT NULL) DESC, p.approved_at ASC, p.id ASC
      LIMIT ${size} OFFSET ${offset}`,
    params
  );

  const items = await decorate(rows, categoryId);
  return { items, total, page: Math.floor(offset / size) + 1, pageSize: size, hasMore: offset + rows.length < total };
}

async function decorate(rows, categoryId) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [[svcs], [brands], [areas], ratings, workDone] = await Promise.all([
    db.query(
      `SELECT ps.partner_id, t.name FROM partner_services ps
         JOIN partner_service_types t ON t.id = ps.service_type_id
        WHERE ps.partner_id IN (?) AND ps.category_id = ? ORDER BY t.sort_order`,
      [ids, categoryId]
    ),
    db.query(
      `SELECT pb.partner_id, COALESCE(b.brand_name, pb.custom_name) AS name
         FROM partner_brands pb LEFT JOIN brand_tb b ON b.id = pb.brand_id
        WHERE pb.partner_id IN (?) AND pb.category_id = ?
          AND (pb.brand_id IS NOT NULL OR pb.custom_status = 'approved')
        ORDER BY name`,
      [ids, categoryId]
    ),
    db.query(
      `SELECT a.partner_id, COALESCE(l.city_name, c.city_name) AS name, a.locality_id IS NULL AS city_wide
         FROM partner_service_areas a
         JOIN city_tb c ON c.id = a.city_id
         LEFT JOIN city_tb l ON l.id = a.locality_id
        WHERE a.partner_id IN (?) ORDER BY a.is_primary DESC, a.id`,
      [ids]
    ),
    getRatingSummaries(ids),
    getWorkDoneCounts(ids),
  ]);
  return rows.map((r) => ({
    slug: r.slug,
    business_name: r.business_name,
    business_type: r.business_type,
    experience_years: r.experience_years,
    logo_url: publicUrl(r.logo_key),
    operating_hours: r.operating_hours,
    identity_verified: !!r.identity_verified,
    gst_verified: !!r.gst_verified,
    services: svcs.filter((s) => s.partner_id === r.id).map((s) => s.name),
    brands: brands.filter((b) => b.partner_id === r.id).map((b) => b.name),
    areas: areas.filter((a) => a.partner_id === r.id).map((a) => a.name).slice(0, 4),
    rating: ratings.get(r.id) || null,
    work_done: workDoneLabel(workDone.get(r.id)),
    is_available: !!r.is_available,
  }));
}

/** Public profile by slug, or null when it must not be shown. */
export async function getPublicProfile(slug) {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  const [[p]] = await db.query(
    `SELECT p.*, c.city_name AS address_city_name, c.city_url AS address_city_url, s.name AS state_name
       FROM partners p
       LEFT JOIN city_tb c ON c.id = p.address_city_id
       LEFT JOIN states s ON s.id = p.address_state_id
      WHERE p.slug = ? AND ${PUBLIC_WHERE} LIMIT 1`,
    [slug]
  );
  if (!p) return null;

  const [[cats], [svcs], [brands], [areas], [photos]] = await Promise.all([
    db.query(
      `SELECT c.id, c.category_name AS name, c.category_url AS url
         FROM partner_categories pc JOIN category_tb c ON c.id = pc.category_id
        WHERE pc.partner_id = ? ORDER BY c.id`,
      [p.id]
    ),
    db.query(
      `SELECT ps.category_id, t.name FROM partner_services ps
         JOIN partner_service_types t ON t.id = ps.service_type_id
        WHERE ps.partner_id = ? ORDER BY t.sort_order`,
      [p.id]
    ),
    // Custom "Other" brands appear only once an admin approved them.
    db.query(
      `SELECT pb.category_id, COALESCE(b.brand_name, pb.custom_name) AS name
         FROM partner_brands pb LEFT JOIN brand_tb b ON b.id = pb.brand_id
        WHERE pb.partner_id = ? AND (pb.brand_id IS NOT NULL OR pb.custom_status = 'approved')
        ORDER BY name`,
      [p.id]
    ),
    db.query(
      `SELECT a.city_id, c.city_name, c.city_url, a.locality_id, l.city_name AS locality_name,
              l.city_url AS locality_url, a.is_primary
         FROM partner_service_areas a
         JOIN city_tb c ON c.id = a.city_id
         LEFT JOIN city_tb l ON l.id = a.locality_id
        WHERE a.partner_id = ? ORDER BY a.is_primary DESC, c.city_name, l.city_name`,
      [p.id]
    ),
    db.query("SELECT s3_key FROM partner_photos WHERE partner_id = ? ORDER BY sort_order, id LIMIT 12", [p.id]),
  ]);
  const workDone = (await getWorkDoneCounts([p.id])).get(p.id) || 0;

  // Group coverage by city: { city, cityWide, localities[] }.
  const coverage = [];
  for (const a of areas) {
    let g = coverage.find((x) => x.city_id === a.city_id);
    if (!g) {
      g = { city_id: a.city_id, city_name: a.city_name, city_url: a.city_url, city_wide: false, localities: [] };
      coverage.push(g);
    }
    if (a.locality_id) g.localities.push({ name: a.locality_name, url: a.locality_url });
    else g.city_wide = true;
  }

  return {
    id: p.id,
    slug: p.slug,
    business_name: p.business_name,
    business_type: p.business_type,
    full_name: p.full_name,
    description: p.description,
    seo_content: p.seo_content,
    meta_title: p.meta_title,
    meta_description: p.meta_description,
    meta_keywords: p.meta_keywords,
    seo_generated_at: p.seo_generated_at,
    work_done_count: workDone,
    work_done: workDoneLabel(workDone),
    experience_years: p.experience_years,
    operating_hours: p.operating_hours,
    logo_url: publicUrl(p.logo_key),
    shop_image_url: publicUrl(p.shop_image_key),
    photos: photos.map((ph) => publicUrl(ph.s3_key)),
    is_available: !!p.is_available,
    locality: p.address_locality,
    city_name: p.address_city_name,
    state_name: p.state_name,
    verification: {
      mobile: true,
      identity: !!p.identity_verified_at,
      business: !!p.business_verified_at,
      gst: !!p.gst_verified_at,
    },
    categories: cats.map((c) => ({
      ...c,
      services: svcs.filter((s) => s.category_id === c.id).map((s) => s.name),
      brands: brands.filter((b) => b.category_id === c.id).map((b) => b.name),
    })),
    coverage,
    // Categories customers can book online (mapped to a CRM lead type).
    bookable: cats.filter((c) => CRM_LEAD_TYPES[c.url]).map((c) => ({ url: c.url, name: c.name })),
    approved_at: p.approved_at,
    updated_at: p.updated_at,
  };
}
