// Every service we offer, grouped, with a one-line pitch — used by the
// /our-services and /about-us pages. `url` is category_tb.category_url, so
// /{url} is the category landing page and /{city}/{url} the city page.
// Home care / handyman entries come from lib/homeCare.js so names stay in sync.

import { HOME_CARE_SERVICES, HANDYMAN_SERVICES } from "@/lib/homeCare";

export const APPLIANCE_SERVICES = [
  { name: "RO Water Purifier", url: "ro-water-purifier", image: "/assets/images/serviceBrands/ro-cat.webp", blurb: "RO service, filter and membrane change, installation and AMC for every purifier brand." },
  { name: "AC Repair & Service", url: "ac", image: "/assets/images/servicesImages/ac.png", blurb: "Split and window AC servicing, gas refilling, installation, uninstallation and repair." },
  { name: "Washing Machine Repair", url: "washing-machine-repair", image: "/assets/images/servicesImages/washing machine.png", blurb: "Front load, top load and semi-automatic machines — drum, motor, PCB and drainage fixes." },
  { name: "Refrigerator Repair", url: "refrigerator-repair", image: "/assets/images/servicesImages/refrigerator.png", blurb: "Cooling problems, gas charging, compressor and thermostat repair for single and double door fridges." },
  { name: "Geyser Repair", url: "geyser-repair", image: "/assets/images/serviceBrands/geyser icon 70x70.png", blurb: "Electric and gas geyser repair, element and thermostat replacement, installation." },
  { name: "Microwave Repair", url: "microwav-repair", image: "/assets/images/servicesImages/microWave.png", blurb: "Solo, grill and convection microwave repair — heating, turntable and panel issues." },
  { name: "LED TV Repair", url: "led-tv-repair", image: "/assets/images/servicesImages/led.png", blurb: "LED, LCD and smart TV repair — display, sound, power and board problems, wall mounting." },
  { name: "Kitchen Chimney Repair", url: "kitchen-chimney-repair", image: "/assets/images/servicesImages/kitchen chimney.png", blurb: "Chimney deep cleaning, suction and motor repair, filter change and installation." },
  { name: "Air Purifier Repair", url: "air-purifier-repair", image: "/assets/images/servicesImages/air cooler.png", blurb: "Air purifier servicing, filter replacement and fan or sensor repair." },
  { name: "Vacuum Cleaner Repair", url: "vacuum-cleaner-repair", image: "/assets/images/servicesImages/vacuum cleaner.png", blurb: "Suction loss, motor, battery and brush repair for upright, handheld and robot vacuums." },
];

const HOME_CARE_BLURBS = {
  "kitchen-cleaning-service": "Degreasing of slabs, tiles, cabinets, sink and appliances.",
  "home-deep-cleaning-service": "Top-to-bottom cleaning of every room, bathroom and kitchen.",
  "bathroom-cleaning-service": "Stain and scale removal for tiles, fittings and fixtures.",
  "sofa-cleaning-service": "Shampoo and vacuum cleaning for fabric and leather sofas.",
  "tank-cleaning": "Overhead and underground water tank cleaning and disinfection.",
  "pest-control": "Treatment for cockroaches, termites, bed bugs, ants and more.",
  plumber: "Leaks, taps, pipelines, flush tanks and bathroom fittings.",
  electrician: "Wiring, switchboards, fans, lights and appliance installation.",
  carpenter: "Furniture repair and assembly, doors, locks and fittings.",
  "house-painting": "Interior and exterior painting, texture and waterproofing.",
  "mason-service": "Tiling, plastering, brickwork and small civil repairs.",
};

const withBlurb = (list) => list.map((s) => ({ ...s, blurb: HOME_CARE_BLURBS[s.url] || "" }));

export const SERVICE_GROUPS = [
  { key: "appliance", title: "Home appliance repair", subtitle: "Doorstep repair, installation and AMC for every major brand", items: APPLIANCE_SERVICES },
  { key: "home-care", title: "Home care & cleaning", subtitle: "Trained professionals for a cleaner, safer home", items: withBlurb(HOME_CARE_SERVICES) },
  { key: "handyman", title: "Handyman services", subtitle: "Skilled help for everyday fixes around the house", items: withBlurb(HANDYMAN_SERVICES) },
];

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.items);

// Flagship cities (all verified in city_tb) for city-wise internal links.
export const TOP_CITIES = [
  { name: "Delhi", url: "delhi" },
  { name: "Mumbai", url: "mumbai" },
  { name: "Bangalore", url: "bangalore" },
  { name: "Hyderabad", url: "hyderabad" },
  { name: "Chennai", url: "chennai" },
  { name: "Kolkata", url: "kolkata" },
  { name: "Pune", url: "pune" },
  { name: "Gurgaon", url: "gurgaon" },
  { name: "Noida", url: "noida" },
  { name: "Jaipur", url: "jaipur" },
  { name: "Lucknow", url: "lucknow" },
  { name: "Ahmedabad", url: "ahmedabad" },
  { name: "Chandigarh", url: "chandigarh" },
  { name: "Indore", url: "indore" },
  { name: "Bhopal", url: "bhopal" },
  { name: "Patna", url: "patna" },
];
