// lib/popularCities.js
//
// The city list behind the "Popular Cities" block on the homepage and on every
// /{category} landing page. It is the state capitals plus the cities we treat
// as flagship markets in their own right.
//
// Every slug here MUST have a city_tb row: the block links to /{city} from the
// homepage and to /{city}/{category} from a category page, and both routes
// 404 when the city slug does not resolve. Verified against the database when
// a slug is added — do not add one on the strength of the name alone.
//
// Ordered by state so the list reads geographically rather than alphabetically.

export const POPULAR_CITIES = [
  { city_name: "Amaravati", city_url: "amaravati" },
  { city_name: "Itanagar", city_url: "itanagar" },
  { city_name: "Dispur", city_url: "dispur" },
  { city_name: "Patna", city_url: "patna" },
  { city_name: "Raipur", city_url: "raipur" },
  { city_name: "Panaji", city_url: "panaji" },
  { city_name: "Gandhinagar", city_url: "gandhinagar" },
  { city_name: "Chandigarh", city_url: "chandigarh" },
  { city_name: "Gurgaon", city_url: "gurgaon" },
  { city_name: "Shimla", city_url: "shimla" },
  { city_name: "Ranchi", city_url: "ranchi" },
  { city_name: "Bengaluru", city_url: "bengaluru" },
  { city_name: "Thiruvananthapuram", city_url: "thiruvananthapuram" },
  { city_name: "Bhopal", city_url: "bhopal" },
  { city_name: "Mumbai", city_url: "mumbai" },
  { city_name: "Imphal", city_url: "imphal" },
  { city_name: "Shillong", city_url: "shillong" },
  { city_name: "Aizawl", city_url: "aizawl" },
  { city_name: "Kohima", city_url: "kohima" },
  { city_name: "Bhubaneswar", city_url: "bhubaneswar" },
  { city_name: "Jaipur", city_url: "jaipur" },
  { city_name: "Gangtok", city_url: "gangtok" },
  { city_name: "Chennai", city_url: "chennai" },
  { city_name: "Hyderabad", city_url: "hyderabad" },
  { city_name: "Agartala", city_url: "agartala" },
  { city_name: "Lucknow", city_url: "lucknow" },
  { city_name: "Dehradun", city_url: "dehradun" },
  { city_name: "Kolkata", city_url: "kolkata" },
  { city_name: "Near me", city_url: "near-me" },
];
