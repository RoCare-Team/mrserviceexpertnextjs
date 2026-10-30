"use client";

import IconGrid from "@/app/components/public/IconGrid";

// Appliance categories (category_tb.category_url). Links are relative to the
// current page, so on /delhi they go to /delhi/{service}.
const APPLIANCES = [
  { name: "RO Water Purifier", image: "/assets/images/serviceBrands/ro-cat.webp", url: "ro-water-purifier" },
  { name: "Air Conditioner", image: "/assets/images/servicesImages/ac.png", url: "ac" },
  { name: "Washing Machine", image: "/assets/images/servicesImages/washing machine.png", url: "washing-machine-repair" },
  { name: "Refrigerator", image: "/assets/images/servicesImages/refrigerator.png", url: "refrigerator-repair" },
  { name: "Geyser", image: "/assets/images/serviceBrands/geyser icon 70x70.png", url: "geyser-repair" },
  { name: "Microwave", image: "/assets/images/servicesImages/microWave.png", url: "microwav-repair" },
  { name: "LED TV", image: "/assets/images/servicesImages/led.png", url: "led-tv-repair" },
  { name: "Kitchen Chimney", image: "/assets/images/servicesImages/kitchen chimney.png", url: "kitchen-chimney-repair" },
  { name: "Air Purifier", image: "/assets/images/servicesImages/air cooler.png", url: "air-purifier-repair" },
  { name: "Vacuum Cleaner", image: "/assets/images/servicesImages/vacuum cleaner.png", url: "vacuum-cleaner-repair" },
];

export default function ServiceSection({ title = "Home appliance repair", eyebrow = "What we fix", subtitle = "Doorstep repair, installation and AMC plans for every major brand." }) {
  return <IconGrid id="appliances" eyebrow={eyebrow} title={title} subtitle={subtitle} items={APPLIANCES} />;
}
