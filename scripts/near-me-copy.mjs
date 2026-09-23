// scripts/near-me-copy.mjs
//
// Per-category source copy for the /near-me/* pages. Everything the generator
// writes is composed from this file, so editing the wording here and re-running
//
//   node scripts/seed-near-me-pages.mjs --commit --force
//
// is how you revise the pages later.
//
//   service  : natural service phrase ("AC Service", "Washing Machine Repair")
//   thing    : the noun a customer would use ("air conditioner")
//   tasks    : what the visit covers -> "What ... Covers" list + FAQ 2
//   problems : symptoms we fix       -> "Common Problems" list + FAQ 3
//   interval : how often to service  -> FAQ 4
//   from     : starting price in INR -> intro line + FAQ 5

export const PHONE = "9311587715";

export const CATEGORY_COPY = {
  "ro-water-purifier": {
    service: "RO Water Purifier Service", thing: "RO water purifier",
    interval: "every 3 to 4 months", from: 399,
    tasks: ["Filter and sediment cartridge replacement", "RO membrane cleaning or replacement", "TDS check and adjustment", "Storage tank cleaning and sanitisation", "Leakage and pump fault repair", "New purifier installation and uninstallation"],
    problems: ["Water tastes salty or has a bad odour", "Purifier is not filling the tank", "Continuous water leakage from the housing", "Motor runs but no water comes out", "Purifier shuts off automatically", "TDS level is too high or too low"],
  },
  ac: {
    service: "AC Service", thing: "air conditioner",
    interval: "every 3 to 6 months", from: 449,
    tasks: ["Wet and dry servicing of split and window ACs", "Gas charging and leak detection", "Cooling coil and condenser cleaning", "PCB, compressor and fan motor repair", "AC installation and uninstallation", "Annual maintenance contracts"],
    problems: ["AC is running but not cooling", "Water dripping from the indoor unit", "Ice forming on the cooling coil", "Unusual noise or vibration from the outdoor unit", "AC trips the MCB or switches off on its own", "Bad smell when the AC starts"],
  },
  "washing-machine-repair": {
    service: "Washing Machine Repair", thing: "washing machine",
    interval: "once every 6 months", from: 399,
    tasks: ["Drum and tub deep cleaning", "Motor, belt and gearbox repair", "Drain pump and inlet valve replacement", "PCB and control panel repair", "Door lock and gasket replacement", "Installation and demo of a new machine"],
    problems: ["Machine is not spinning or draining", "Excessive shaking during the spin cycle", "Water not filling into the drum", "Error code showing on the display", "Door not locking or not opening", "Water leaking from under the machine"],
  },
  "geyser-repair": {
    service: "Geyser Repair", thing: "geyser",
    interval: "once a year before winter", from: 349,
    tasks: ["Heating element replacement", "Thermostat testing and replacement", "Tank descaling and flushing", "Leakage and pressure valve repair", "Wiring and MCB fault checks", "Geyser installation and relocation"],
    problems: ["Geyser is not heating water at all", "Water takes too long to heat", "Water leaking from the bottom of the tank", "Geyser trips the MCB when switched on", "Water gets too hot or too cold", "Rust coloured water from the outlet"],
  },
  "refrigerator-repair": {
    service: "Refrigerator Repair", thing: "refrigerator",
    interval: "once a year", from: 399,
    tasks: ["Gas charging and leak sealing", "Compressor and relay repair", "Thermostat and sensor replacement", "Defrost system and timer repair", "Door gasket replacement", "Deep cleaning and deodorising"],
    problems: ["Fridge is running but not cooling", "Freezer works but the lower section does not", "Excessive ice build up in the freezer", "Water collecting at the bottom of the fridge", "Compressor is noisy or too hot", "Fridge switches on and off repeatedly"],
  },
  "kitchen-chimney-repair": {
    service: "Kitchen Chimney Repair", thing: "kitchen chimney",
    interval: "every 3 months", from: 449,
    tasks: ["Baffle and mesh filter deep cleaning", "Suction motor repair and replacement", "Auto clean mechanism servicing", "Duct cleaning and re routing", "Switch, panel and light repair", "Chimney installation and demo"],
    problems: ["Chimney suction has become weak", "Oil dripping from the filter", "Motor makes a loud noise", "Auto clean button not working", "Chimney lights not turning on", "Smoke not clearing from the kitchen"],
  },
  "microwav-repair": {
    service: "Microwave Repair", thing: "microwave oven",
    interval: "once a year", from: 399,
    tasks: ["Magnetron testing and replacement", "Turntable motor and coupler repair", "Door switch and latch replacement", "Control panel and display repair", "Fuse and capacitor replacement", "Full internal cleaning"],
    problems: ["Microwave runs but does not heat", "Sparking inside the cavity", "Turntable is not rotating", "Buttons or touch panel not responding", "Door not closing properly", "Loud humming while cooking"],
  },
  "vacuum-cleaner-repair": {
    service: "Vacuum Cleaner Repair", thing: "vacuum cleaner",
    interval: "once a year", from: 349,
    tasks: ["Suction motor repair and replacement", "HEPA and dust filter replacement", "Hose and brush head unblocking", "Switch and wiring repair", "Dust bag and canister cleaning", "Battery replacement for cordless models"],
    problems: ["Suction power has dropped", "Vacuum switches off while running", "Burning smell during use", "Brush roll is not spinning", "Dust leaking back out of the unit", "Cordless unit not holding charge"],
  },
  "air-purifier-repair": {
    service: "Air Purifier Service", thing: "air purifier",
    interval: "every 6 months", from: 399,
    tasks: ["HEPA and carbon filter replacement", "Fan motor repair", "Air quality sensor cleaning and calibration", "Control panel and display repair", "Full internal dust cleaning", "Installation and placement advice"],
    problems: ["Purifier shows a filter warning constantly", "Air flow has become very weak", "Sensor always shows poor air quality", "Unit is louder than it used to be", "Purifier turns off by itself", "Bad smell coming from the outlet"],
  },
  "sofa-cleaning-service": {
    service: "Sofa Cleaning", thing: "sofa",
    interval: "every 6 months", from: 499,
    tasks: ["Vacuum and dry dust extraction", "Shampoo and foam deep cleaning", "Stain and spot treatment", "Fabric safe deodorising", "Leather conditioning", "Dining chair and ottoman cleaning"],
    problems: ["Food and drink stains on the fabric", "Sofa smells musty or damp", "Dust causing sneezing and allergies", "Pet hair stuck deep in the fabric", "Colour looks dull and patchy", "Leather is drying out and cracking"],
  },
  "led-tv-repair": {
    service: "LED TV Repair", thing: "LED TV",
    interval: "once a year", from: 449,
    tasks: ["Panel and backlight strip replacement", "Motherboard and power supply repair", "Display and picture quality correction", "Sound and speaker repair", "Smart TV software and app issues", "Wall mounting and demounting"],
    problems: ["Screen has lines or patches", "Sound works but no picture", "TV is not turning on at all", "Backlight is flickering or dim", "HDMI ports not detecting devices", "Smart apps keep crashing"],
  },
  "bathroom-cleaning-service": {
    service: "Bathroom Cleaning", thing: "bathroom",
    interval: "every 2 to 3 months", from: 499,
    tasks: ["Floor and wall tile scrubbing", "Hard water and lime scale removal", "Toilet and washbasin deep cleaning", "Glass partition and mirror polishing", "Drain and trap cleaning", "Disinfection and odour treatment"],
    problems: ["Yellow hard water stains on tiles", "Black fungus in the tile grouting", "Persistent bad smell from the drain", "Tap and shower heads are choked", "Glass partition has permanent water marks", "Floor has become slippery"],
  },
  "home-deep-cleaning-service": {
    service: "Home Deep Cleaning", thing: "home",
    interval: "twice a year", from: 2499,
    tasks: ["Room by room dusting and scrubbing", "Kitchen and bathroom deep cleaning", "Floor scrubbing and polishing", "Window, grill and balcony cleaning", "Fan, light and switchboard cleaning", "Pre and post move in cleaning"],
    problems: ["Dust settled in corners and behind furniture", "Kitchen surfaces feel greasy", "Bathroom tiles have stubborn stains", "Cobwebs on ceilings and corners", "Floors look dull despite mopping", "House smells stuffy and closed"],
  },
  "kitchen-cleaning-service": {
    service: "Kitchen Cleaning", thing: "kitchen",
    interval: "every 3 months", from: 999,
    tasks: ["Degreasing of platform and backsplash", "Cabinet cleaning inside and out", "Chimney and hob external cleaning", "Sink and drain descaling", "Tile and grout scrubbing", "Appliance exterior cleaning"],
    problems: ["Sticky oil film on cabinets and tiles", "Sink drains slowly or smells", "Cockroaches around the platform", "Burnt stains on the hob and slab", "Grease dripping from the chimney", "Cabinet shelves are stained"],
  },
  "pest-control": {
    service: "Pest Control", thing: "home",
    interval: "every 6 months", from: 799,
    tasks: ["General cockroach and ant treatment", "Termite pre and post construction treatment", "Bed bug treatment", "Rodent control and baiting", "Mosquito fogging and larvicide", "Herbal and child safe treatment options"],
    problems: ["Cockroaches in the kitchen and drains", "Termite mud lines on walls or furniture", "Bed bug bites and stains on the mattress", "Rats damaging wiring and food packets", "Mosquitoes despite closed windows", "Ant trails on the kitchen platform"],
  },
  "tank-cleaning": {
    service: "Water Tank Cleaning", thing: "water tank",
    interval: "every 6 months", from: 999,
    tasks: ["Complete draining and sludge removal", "High pressure jet wall scrubbing", "Vacuum extraction of settled dirt", "Anti bacterial disinfection", "Underground and overhead tank cleaning", "Post cleaning water quality check"],
    problems: ["Water has a strange smell or colour", "Visible sediment at the bottom of the tank", "Algae growing on the tank walls", "Insects or worms found in stored water", "Frequent stomach complaints at home", "Tank has not been cleaned in over a year"],
  },
  "house-painting": {
    service: "House Painting", thing: "home",
    interval: "every 4 to 5 years", from: 4999,
    tasks: ["Interior wall painting and putty work", "Exterior weatherproof painting", "Wood and metal polishing and enamel", "Texture, stencil and accent walls", "Waterproofing and crack filling", "Free colour consultation and site visit"],
    problems: ["Paint is peeling or flaking off", "Damp patches and seepage on walls", "Hairline cracks across the plaster", "Colour has faded unevenly", "Fungus growth in humid corners", "Old wood and grills need repolishing"],
  },
  plumber: {
    service: "Plumber Service", thing: "plumbing",
    interval: "as and when needed", from: 299,
    tasks: ["Tap, mixer and shower installation", "Pipe leakage detection and repair", "Blocked drain and sink clearing", "Toilet and flush tank repair", "Water motor and pump fitting", "Bathroom fitting replacement"],
    problems: ["Tap is dripping continuously", "Low water pressure in the bathroom", "Drain or sink is blocked", "Flush tank keeps running", "Wall is damp due to a hidden leak", "Water motor is not pulling water"],
  },
  carpenter: {
    service: "Carpenter Service", thing: "furniture",
    interval: "as and when needed", from: 349,
    tasks: ["Door and window repair and alignment", "Modular kitchen and wardrobe fitting", "Bed, sofa and chair repair", "Drawer channel and hinge replacement", "Curtain rod and shelf installation", "Custom furniture work"],
    problems: ["Door is not closing or is jammed", "Wardrobe hinges have come loose", "Drawer channels are stuck", "Bed frame is creaking or wobbly", "Kitchen shutter has sagged", "Wood has swollen due to water"],
  },
  electrician: {
    service: "Electrician Service", thing: "electrical",
    interval: "as and when needed", from: 299,
    tasks: ["Switchboard and socket repair", "Fan, light and chandelier installation", "MCB, fuse and wiring fault fixing", "Inverter and stabiliser installation", "Doorbell and exhaust fan fitting", "Full house wiring checks"],
    problems: ["MCB trips again and again", "Switch or socket is sparking", "Fan runs slow or makes noise", "Lights flicker at night", "Inverter is not charging", "Burning smell from the switchboard"],
  },
  "air-cooler": {
    service: "Air Cooler Service", thing: "air cooler",
    interval: "once before every summer", from: 349,
    tasks: ["Cooling pad replacement", "Water pump repair and replacement", "Fan motor servicing", "Tank cleaning and descaling", "Wiring and switch repair", "Full pre summer servicing"],
    problems: ["Cooler is throwing warm air", "Water pump is not circulating water", "Foul smell from the water tank", "Fan is noisy or runs slowly", "Water leaking from the body", "Cooling pads have hardened"],
  },
  "mason-service": {
    service: "Mason Service", thing: "masonry",
    interval: "as and when needed", from: 999,
    tasks: ["Tile laying and replacement", "Wall plastering and crack repair", "Brickwork and partition walls", "Waterproofing of terrace and bathrooms", "Concrete and flooring work", "Site visit and estimate"],
    problems: ["Tiles have come loose or cracked", "Plaster is falling off the wall", "Terrace leaks during the rains", "Cracks widening near door frames", "Uneven or sunken flooring", "Bathroom floor holds water"],
  },
};
