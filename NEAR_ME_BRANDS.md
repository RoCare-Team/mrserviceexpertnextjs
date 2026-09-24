# near-me brands — kaise kaam karta hai

Ye doc batata hai ki kuchh brands sirf `/near-me/...` pages par kyun dikhte hain aur
baaki cities par kyun nahi, pehle flow kya tha, ab kya badla, aur future me naye
brands kaise add karne hain.

**Ek line me:** kisi brand ki visibility ab `brand_tb` ke kisi flag se nahi,
balki is baat se decide hoti hai ki **us city ke liye uska page row exist karta
hai ya nahi**. Jis brand ka page row sirf near-me ke liye hai, wo sirf near-me
par dikhega.

---

## 1. Data model — pehle ye samajh lo

Char tables milkar har page banate hain:

| Table | Kya rakhta hai |
|---|---|
| `city_tb` | Cities. `near-me` bhi ek normal city row hai (id **2295**, state **"India"**) |
| `category_tb` | 22 categories (`ac`, `ro-water-purifier`, ...) |
| `brand_tb` | 137 brands. Har row ek brand **+ ek category** ka pair hai |
| `master_tb_withoutbrand` | `/{city}/{category}` pages ka content (34,522 rows) |
| `page_master_tb` | `/{city}/{brand}/{category}` pages ka content (87,270 rows) |

Routes aur unka data source:

| URL | Route file | Data function |
|---|---|---|
| `/{city}` ya `/{category}` | `src/app/[city]/page.jsx` | `src/lib/cityData.js` |
| `/{city}/{cat}` | `src/app/[city]/[cat]/page.jsx` | `src/lib/cityCategoryPageData.js` |
| `/{city}/{brand}/{cat}` | `src/app/[...params]/page.jsx` | `src/lib/brandPageData.js` |

**Sabse important baat:** `/{city}/{brand}/{cat}` page **tabhi** render hota hai jab
`page_master_tb` me us exact `city_id + category_id + brand_id` ka row ho. Row nahi
to seedha **404**. Iske liye koi fallback content nahi hai.

(Iske ulta, `/{city}/{cat}` page row na hone par bhi 200 deta hai — wo category ka
apna content fallback me dikha deta hai. Dono routes ka behaviour alag hai, ye yaad
rakhna.)

---

## 2. Pehle ka flow (jo problem thi)

"Popular Brands" wali list **city ko dekhti hi nahi thi**. Query aisi thi:

```sql
SELECT id, brand_name, brand_url, category_id
  FROM brand_tb
 WHERE category_id = ?
   AND status = '1'
 ORDER BY brand_name ASC
```

Matlab: category ke **saare** switched-on brands, chahe us city me un brands ka
page ho ya na ho.

Ab isko upar wali baat ke saath jodo:

- List har brand ka link dikha deti thi → `/{city}/{brand}/{cat}`
- Par page tabhi khulta jab `page_master_tb` row ho

To jis brand ka us city me page nahi tha, uska link **404 par le jaata tha**.

Historically ye zyada dikhta nahi tha kyunki backend ne har city ke liye page rows
bana rakhe the — maine measure kiya tha to 62,753 brand links me se sirf 2 broken
the. Lekin jaise hi aap **ek naya brand** add karte, wo turant **har city** ki list
me aa jaata aur har jagah 404 link ban jaata. Isi wajah se "sirf near-me ke liye
brand" banana us flow me possible hi nahi tha.

---

## 3. Ab kya badla

Dono "Popular Brands" queries me ek `EXISTS` check laga diya gaya hai. Ab brand
tabhi list hota hai jab **jis city ka page khula hai, us city ke liye uska page row
maujood ho**:

```sql
SELECT id, brand_name, brand_url, category_id
  FROM brand_tb b
 WHERE b.category_id = ?
   AND b.status = '1'
   AND b.brand_url IS NOT NULL AND b.brand_url <> ''
   AND EXISTS (
     SELECT 1
       FROM page_master_tb pm
       JOIN brand_tb b2 ON b2.id = pm.brand_id
      WHERE pm.city_id = ?          -- jo city abhi khuli hai
        AND pm.category_id = ?
        AND LOWER(b2.brand_url) = LOWER(b.brand_url)
   )
 ORDER BY b.brand_name ASC
```

Ye query do jagah hai:

- `src/lib/cityCategoryPageData.js` — `/{city}/{cat}` page ki brand list
- `src/lib/brandPageData.js` — `/{city}/{brand}/{cat}` page ki brand list

Aur poore site par brand links **sirf** in do jagah render hote hain:

- `src/app/[city]/[cat]/page.jsx` (~line 561)
- `src/app/components/pages/Services/brands.jsx` (~line 491)

(`City.jsx` aur `ServicePage.jsx` me jo brand blocks the wo commented-out hain, aur
`problmModal.jsx` ka list hardcoded hai jisme koi link nahi hai.)

### `brand_url` par match kyun, `brand_id` par kyun nahi

Ek hi `brand_url` kai categories me ho sakta hai — jaise `godrej` AC, Washing
Machine aur Refrigerator teeno me alag rows hai. `getBrandPageData` bhi page
dhoondhte waqt `brand_url` par join karta hai, `brand_id` par nahi. Isliye gate bhi
`brand_url` par match karta hai — warna list aur actual page resolution alag-alag
jawab dete aur phir se broken link ban jaata.

### Iska matlab

> **Brand ki visibility ab `page_master_tb` me rows ki presence se control hoti hai.**
> Koi `scope` column, koi flag, kuchh nahi chahiye.

Ye jaanbujh kar aisa rakha gaya hai — ek extra column add karke usko har query me
filter karna padta, aur wo column aur actual page rows ke beech mismatch ho sakta
tha (column kehta "dikhao" par page row hota hi nahi → 404). Existence gate me ye
mismatch possible hi nahi.

---

## 4. near-me-only brand ka poora walkthrough

Maan lo `AO Smith` ko sirf near-me par dikhana hai, RO category me.

**Step 1** — `brand_tb` me ek row:

| id | brand_name | brand_url | category_id | status |
|---|---|---|---|---|
| 44 | AO Smith | `ao-smith` | 1 (RO) | 1 |

**Step 2** — `page_master_tb` me **sirf ek** row:

| city_id | category_id | brand_id |
|---|---|---|
| **2295** (near-me) | 1 | 44 |

Bas. Ab kya hota hai:

| URL | Result | Kyun |
|---|---|---|
| `/near-me/ro-water-purifier` | AO Smith **list me dikhta hai** | EXISTS pass — near-me ka row hai |
| `/gurgaon/ro-water-purifier` | AO Smith **list me nahi hai** | EXISTS fail — gurgaon ka row nahi |
| `/mumbai/ro-water-purifier` | AO Smith **list me nahi hai** | wahi |
| `/near-me/ao-smith/ro-water-purifier` | **200** | page row maujood hai |
| `/gurgaon/ao-smith/ro-water-purifier` | 404 | page row nahi hai |

Aakhri wali line dekhkar ghabrana mat. Wo URL **kahin se bhi link nahi hai** —
na kisi page par, na sitemap me. Koi user ya Google crawler wahan pahunchega hi
nahi. Sirf agar koi manually address bar me type kare tab 404 aayega, jo bilkul
sahi HTTP response hai kyunki wo page sach me exist nahi karta.

### Abhi ka actual state

- **137** brands total
- **99** brands aise hain jinke pages **sirf** near-me ke liye hain
- **38** purane brands jo near-me + baaki cities dono par hain
- near-me par: **22** category pages + **137** brand pages = **159** URLs

---

## 5. Sitemaps

`scripts/generate-sitemaps.mjs` XML ko `master_tb_withoutbrand` aur `page_master_tb`
ke rows se banata hai — brand list se nahi. Isliye near-me-only brands ke sirf
near-me URLs hi sitemap me jaate hain, apne aap. Koi alag handling nahi chahiye.

Brands add karne ke baad chalana:

```bash
npm run sitemaps
```

---

## 6. Popular Cities block

near-me ka state deliberately **"India"** rakha gaya hai, aur us state me wahi
akeli city hai. Iska ek achha side effect hai — gurgaon ya kisi aur city ke page
par "Popular Cities Near Me" list me "Near me" ghusta nahi hai.

Lekin isi wajah se near-me ke apne pages par wo list **khaali** ho jaati thi. Iske
liye ek fallback hai: jab page ki state-wali city list khaali ho, tab shared
`PopularCities` block dikh jaata hai.

- List: `src/lib/popularCities.js` (29 cities — 27 state capitals + Gurgaon + Near me)
- Component: `src/app/components/popularCities/PopularCities.jsx`
- Lagta hai: homepage, `/{category}` pages, aur teeno near-me page types par

### Other Cities (admin se managed)

Homepage par Popular Cities ke neeche ek aur dropdown hai — **Other Cities** —
jiske links **Admin → Content → Other Cities** (`/admin/other_cities`) se add hote
hain. Ye `other_city_links_tb` table me store hote hain.

- Target kuchh bhi ho sakta hai: `/gurgaon/ac`, `/near-me`, ya poora `https://` URL
- `javascript:` jaise schemes reject ho jaate hain
- Order field se sequence control hoti hai, status se on/off
- Ek bhi active link na ho to block dikhta hi nahi
- Homepage 5 minute cache karta hai (`revalidate = 300`), to edit turant nahi dikhega

Table banane ke liye (ek baar): `node scripts/create-other-city-links-table.mjs --commit`

Nayi city **Popular Cities** block me add karni ho to sirf `popularCities.js` edit karo. **Dhyan
rahe:** jo bhi slug wahan daalo uska `city_tb` me row hona zaroori hai, warna wo
link 404 karega.

---

## 7. Brand add karna — Admin panel se (aasan tareeka)

**Admin → Catalogue → Add Brand** (`/admin/brand_rollout`)

Form me naam, slug aur category bharo, phir do me se ek chuno:

| Choice | Kya banta hai | Result |
|---|---|---|
| **Near Me only** | 1 page row (near-me) | Sirf `/near-me/{brand}/{cat}` par dikhega |
| **All cities** | 2,294 page rows | Har city par dikhega |

Submit se pehle screen batati hai ki kitne pages banenge, aur confirm maangti hai.
"All cities" me kuchh seconds lagte hain (2,294 rows chunks me jaati hain) — tab
tak tab band mat karna.

Kuchh baatein:

- Wahi brand dobara submit karo to **duplicate nahi banta** — sirf missing pages
  add hoti hain. Isliye pehle "Near Me only" karke baad me "All cities" karna
  bilkul safe hai.
- Jis category ka wording `src/lib/pageContent.js` me nahi hai wo dropdown me
  greyed out rahegi.
- Baad me `npm run sitemaps` chalana na bhoolna.

Content wahi template use karta hai jo CLI script use karti hai (dono
`src/lib/pageContent.js` se aate hain), to admin se bana brand aur script se bana
brand bilkul ek jaise hote hain.

---

## 7b. Future: sirf near-me ke liye naye brands add karna (CLI)

Bulk me (ek saath 50-100 brands) daalne ho to script tez hai.


Sabse aasan tareeka — script use karo.

**Step 1.** `scripts/near-me-copy.mjs` file ke end me `NEAR_ME_ONLY_BRANDS` list me
entries add karo:

```js
export const NEAR_ME_ONLY_BRANDS = [
  { brand_name: "Hitachi",  brand_url: "hitachi",  category_url: "air-purifier-repair" },
  { brand_name: "Symphony", brand_url: "symphony", category_url: "air-cooler" },
];
```

Rules:
- `brand_url` sirf `[a-z0-9-]` — script galat slug ko skip kar dega
- `category_url` `category_tb` ka slug ho, aur usi file ke `CATEGORY_COPY` me uski
  entry honi chahiye (warna content generate nahi hoga)
- Ek hi brand ka slug alag-alag categories me dobara use kar sakte ho

**Step 2.** Pehle dry run — kuchh likhta nahi, sirf batata hai kya hoga:

```bash
node scripts/seed-near-me-pages.mjs
```

**Step 3.** Sab theek lage to commit:

```bash
node scripts/seed-near-me-pages.mjs --commit
```

Script ye karti hai:
1. `brand_tb` me row dhoondhti hai (`brand_url` + `category_id`), nahi mili to banati hai
2. `page_master_tb` me **sirf near-me** ka ek row banati hai, content ke saath
3. Jo rows pehle se hain unhe chhedti nahi (`--force` doge tabhi overwrite karegi)

**Step 4.** Sitemaps:

```bash
npm run sitemaps
```

Script dobara chalana safe hai — jo rows exist karti hain wo `skipped` ho jaati hain.

### Content kahan se aata hai

Content `scripts/near-me-copy.mjs` ke `CATEGORY_COPY` se template ke through banta
hai — har category ke `service`, `thing`, `tasks`, `problems`, `interval`, `from`
fields se. Wording badalni ho to wahi file edit karo aur chalao:

```bash
node scripts/seed-near-me-pages.mjs --commit --force
```

Ek page ka output dekhna ho bina DB chhede:

```bash
node scripts/seed-near-me-pages.mjs --sample ac
```

---

## 8. Future: sabhi cities ke liye brand add karna

Ab ye **Admin → Add Brand** me "All cities" choose karke ho jaata hai (Section 7).
Wo 2,294 page rows chunks me bana deta hai.

Dhyan dene wali baat: har city ka page same template se banta hai jisme sirf city
ka naam badalta hai. Google iske bahut saare pages ko duplicate maan sakta hai.
Existing pages bhi isi tarah bane hain (1,355 AC pages, sirf 293 alag content
lengths), to ye site ka established pattern hai — par soch kar use karna.

Aur har naya all-cities brand sitemap me ~2,294 URLs add karega.

### Agar custom logic chahiye — script

`seed-near-me-pages.mjs` ko copy karke ek naya script banao jisme:

- City list `city_tb` se aaye (ek city, tier list, ya sab)
- Wahi `brandPage()` template function use ho, par `{city}` ka naam content me aaye
- Har city ke liye ek `page_master_tb` row banaye

Dhyan dene wali baatein:

- **Scale** — 2,294 cities × 1 brand = 2,294 rows, aur har row me ~5KB content.
  Batch me karo, ek-ek karke nahi.
- **Duplicate content** — har city ka page sirf city ka naam badal kar same content
  rakhega to Google usko duplicate maan sakta hai. Existing pages bhi isi tarah bane
  hain (1,355 AC pages, sirf 293 alag content lengths), to ye site ka established
  pattern hai — par dhyan me rakhna.
- **Sitemap size** — har naya all-cities brand ~2,294 URLs add karega.

### Option C — Pehle near-me, phir dheere-dheere expand

Practical rasta: brand pehle near-me par daalo (Section 7), performance dekho, phir
jin cities me demand dikhe unke liye rows add karo. Jaise-jaise rows add hote
jaayenge, brand un cities ki list me apne aap aata jaayega — kyunki visibility rows
se hi decide hoti hai.

---

## 9. Brand hataana ya chhupana

| Kya chahiye | Kaise |
|---|---|
| Brand poore site se hataana | `brand_tb.status = '0'` — list se turant gayab |
| Brand ek city se hataana | Us city ka `page_master_tb` row delete karo |
| Brand sirf near-me tak limit karna | Baaki cities ke page rows delete karo, near-me ka rakho |

Teeno case me koi broken link peeche nahi chhoota, kyunki list aur page dono ek hi
cheez (row ki presence) dekhte hain.

**Dhyan rahe:** jo page rows pehle se Google me indexed hain, unhe delete karne se
wo URLs 404 dene lagenge. Aise case me `src/app/api/redirects` wala redirect system
ya `/410` route use karna behtar hai, seedha delete karne se nahi.

---

## 10. Verify kaise karein

Server chalao (`npm run dev`), phir check karo:

```bash
# brand sirf near-me par dikhna chahiye
curl -s localhost:3000/near-me/ro-water-purifier | grep -c "AO Smith"   # > 0
curl -s localhost:3000/gurgaon/ro-water-purifier | grep -c "AO Smith"   # 0

# brand ka apna page khulna chahiye
curl -s -o /dev/null -w "%{http_code}" localhost:3000/near-me/ao-smith/ro-water-purifier   # 200
```

Broken links check karte waqt **ek baat zaroori hai**: `/{city}/{cat}` page par brand
links **relative** hain (`href="voltas/ac"`, leading slash ke bina). Sirf
`href="/..."` wale links check karoge to brand links chhoot jaayenge. Crawler me
`new URL(href, pageUrl)` se resolve karo.

---

## 11. Performance note

`page_master_tb` me 87,270 rows hain aur ye pages `force-dynamic` hain — yaani har
request par query chalti hai. Pehle in tables par PRIMARY ke alawa koi index nahi
tha, to har lookup full table scan tha.

Ab ye indexes lage hue hain (`scripts/add-indexes.mjs` se):

```
page_master_tb          idx_pm_city_cat   (city_id, category_id)
page_master_tb          idx_pm_cat_brand  (category_id, brand_id)
page_master_tb          idx_pm_brand      (brand_id)
master_tb_withoutbrand  idx_nb_city_cat   (city_id, category_id)
city_tb                 idx_city_url      (city_url)
city_tb                 idx_city_state    (state)
brand_tb                idx_brand_url     (brand_url)
brand_tb                idx_brand_category(category_id)
category_tb             idx_category_url  (category_url)
```

Script idempotent hai — jo index maujood hai use skip kar deti hai:

```bash
node scripts/add-indexes.mjs            # kya missing hai, sirf batayegi
node scripts/add-indexes.mjs --commit   # bana degi
```

---

## Files ki summary

| File | Kya hai |
|---|---|
| `scripts/near-me-copy.mjs` | Category-wise content source + `NEAR_ME_ONLY_BRANDS` list |
| `scripts/seed-near-me-pages.mjs` | near-me pages aur near-me-only brands banata hai |
| `scripts/add-indexes.mjs` | DB indexes |
| `scripts/generate-sitemaps.mjs` | Sitemaps (`npm run sitemaps`) |
| `src/lib/brandPageData.js` | `/{city}/{brand}/{cat}` ka data + gated brand list |
| `src/lib/cityCategoryPageData.js` | `/{city}/{cat}` ka data + gated brand list |
| `src/lib/pageContent.js` | Page wording + templates (script aur admin dono yahi use karte hain) |
| `src/lib/popularCities.js` | Popular Cities block ki fixed city list |
| `src/lib/otherCityLinks.js` | Other Cities block ke admin-managed links |
| `src/app/components/popularCities/PopularCities.jsx` | Popular Cities block |
| `src/app/components/popularCities/OtherCities.jsx` | Other Cities block |
| `src/app/(admin)/admin/brand_rollout/` | Admin "Add Brand" screen |
| `src/app/(admin)/admin/other_cities/` | Admin "Other Cities" screen |
| `src/app/api/admin/brand_rollout/route.js` | Brand + pages banane wali API |
| `src/app/api/admin/other_cities/route.js` | Other Cities CRUD API |
| `scripts/create-other-city-links-table.mjs` | `other_city_links_tb` banata hai (ek baar) |
