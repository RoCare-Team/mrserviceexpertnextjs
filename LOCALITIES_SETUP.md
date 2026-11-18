# Localities + partner pages — kaise chalta hai

## Flow

1. **Localities pehle se** — top 200 cities ki ~2,575 localities `city_tb` me rows hain,
   `city_parent_map` me `kind = 'locality'` ke saath (`scripts/data/localities.csv`).
   Inke **pages nahi** bante, sirf partner form me checkbox dikhte hain.
2. **Partner select karta hai** — city → "Entire city" ya localities; categories; brands
   (`brand_tb` ke saare active brands).
3. **Page kab banta hai** — jab partner public hota hai: admin approve / listing on,
   live areas change, change-request approve, badge (payment / admin / choose active).
   `src/lib/partnerPages.js` har area × category × brand ka **sirf missing** page banata hai:
   - `/{area}/{category}` → `master_tb_withoutbrand`
   - `/{area}/{brand}/{category}` → `page_master_tb`
   Har banaya page `partner_generated_pages` me record hota hai. Purana page kabhi overwrite nahi hota.
4. **Page par** — city page par "by locality" block (sirf jinka page bana hai), locality page par
   parent city breadcrumb + baaki localities. Partner list: pehle locality wale, phir parent city ke city-wide.
5. **Partner hat gaya** — partner-made page par koi partner na bache to page `noindex` ho jata hai aur
   `sitemap/partner-pages.xml` se hat jata hai. Row delete nahi hoti.

Purane lists ("nearby cities", `/api/cities`, state pages, brand rollout "all", static sitemaps)
imported localities aur partner-made pages ko nahi dikhate — wo pehle jaise hi rehte hain.

## Setup (ek baar)

```bash
mysqldump -u <user> -p <db> > backup-before-localities.sql
node scripts/run-migrations.mjs --commit          # 2026_11_16_012
node scripts/import-localities.mjs                # dry run — slug clash list dekho
node scripts/import-localities.mjs --commit
node scripts/ensure-partner-pages.mjs             # dry run — purane approved partners
node scripts/ensure-partner-pages.mjs --commit
npm run sitemaps                                  # index me partner-pages.xml jud jayega
```

## Rollback

```bash
node scripts/import-localities.mjs --remove --commit   # unused localities hatao
mysql -u <user> -p <db> < scripts/migrations/rollback/2026_11_16_012_localities_partner_pages.down.sql
```

## Nayi localities

`scripts/data/localities.csv` me `city_url,locality_name` line jodo aur `import-localities.mjs --commit`
chalao (re-run safe hai). Ya Admin → Partners → Localities se ek-ek.
