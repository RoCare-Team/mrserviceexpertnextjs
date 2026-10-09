// Home care categories (no brands, no "repair") — shared by the footer, the
// city+category page and <ServicePage>, so the three always agree.
// `url` is category_tb.category_url.

export const HOME_CARE_SERVICES = [
  { name: "Kitchen Cleaning", url: "kitchen-cleaning-service" },
  { name: "Home Deep Cleaning", url: "home-deep-cleaning-service" },
  { name: "House Painting", url: "house-painting" },
  { name: "Bathroom Cleaning", url: "bathroom-cleaning-service" },
  { name: "Sofa Cleaning", url: "sofa-cleaning-service" },
  { name: "Tank Cleaning", url: "tank-cleaning" },
  { name: "Mason Service", url: "mason-service" },
  { name: "Pest Control", url: "pest-control" },
];

const HOME_CARE_URLS = new Set(HOME_CARE_SERVICES.map((s) => s.url));

export const isHomeCare = (categoryUrl) =>
  HOME_CARE_URLS.has(String(categoryUrl || "").toLowerCase().trim());
