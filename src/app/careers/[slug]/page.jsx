import { permanentRedirect } from "next/navigation";

// Jobs have no page of their own — they open in a popup on /careers, so an
// ended job never leaves a dead URL behind. Any /careers/<anything> link
// (old shares, typos) permanently redirects to the careers page. This route
// also stops /careers/<x> from being caught by the [city]/[cat] pages.
export default async function CareerSlugRedirect() {
  permanentRedirect("/careers");
}
