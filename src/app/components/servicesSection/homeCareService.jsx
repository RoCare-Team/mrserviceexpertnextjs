"use client";

import IconGrid from "@/app/components/public/IconGrid";
import { HOME_CARE_SERVICES } from "@/lib/homeCare";

/**
 * Icon grid for a service group. Defaults to Home Care; the home and city
 * pages also render it with the Handyman list.
 */
export default function HomeCareService({ title = "Home care services", services = HOME_CARE_SERVICES, eyebrow, subtitle, id }) {
  return (
    <IconGrid
      id={id || (services === HOME_CARE_SERVICES ? "home-care" : "handyman")}
      eyebrow={eyebrow ?? (services === HOME_CARE_SERVICES ? "Clean and pest-free" : "Skilled trades")}
      title={title}
      subtitle={subtitle ?? (services === HOME_CARE_SERVICES ? "Deep cleaning, tank cleaning and pest control by trained crews." : "Verified plumbers, electricians, carpenters, painters and masons.")}
      items={services}
    />
  );
}
