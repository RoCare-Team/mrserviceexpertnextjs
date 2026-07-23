import React from "react";

/**
 * Store locator section for a city (or city + category) page.
 * Renders the physical Mr Service Expert branches linked to this city
 * (stores, populated by getStoresByCityId in lib/storeLocatorData.js).
 * Pass `category` on a city/category page to make the heading category-aware.
 */
const StoreLocator = ({ stores = [], city = "", category = "" }) => {
  if (!stores || stores.length === 0) return null;

  return (
    <div className="common-spacing">
      <div className="bg-white aboutStyle">
        <h3 className="catgoreyTitle">
          Mr. Service Expert {category ? `${category} ` : ""}Store
          {stores.length > 1 ? "s" : ""} in {city}
        </h3>

        <div className="flex flex-wrap gap-4 mt-4">
          {stores.map((s) => {
            const mapsQuery = encodeURIComponent(`${s.business_name}, ${s.address}`);
            const telHref = `tel:${(s.phone || "").replace(/[^+\d]/g, "")}`;
            return (
              <div
                key={s.id}
                className="flex-1 min-w-[280px] border border-gray-200 rounded-xl p-4 shadow-sm"
                itemScope
                itemType="https://schema.org/LocalBusiness"
              >
                <h4 className="font-semibold text-lg mb-1" itemProp="name">
                  {s.business_name}
                </h4>
                {s.locality && (
                  <p className="text-sm text-gray-500 mb-2">
                    {s.locality}
                    {s.state ? `, ${s.state}` : ""}
                  </p>
                )}
                <p className="text-sm mb-2" itemProp="address">
                  {s.address}
                </p>
                <p className="text-sm mb-1">
                  <strong>Hours:</strong> {s.hours}
                </p>
                {s.phone && (
                  <p className="text-sm mb-3">
                    <strong>Call:</strong>{" "}
                    <a href={telHref} className="text-blue-600" itemProp="telephone">
                      {s.phone}
                    </a>
                  </p>
                )}
                <div className="flex gap-3">
                  {s.phone && (
                    <a
                      href={telHref}
                      className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      Call now
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-blue-600 text-blue-600 text-sm px-4 py-2 rounded-lg"
                  >
                    Get directions
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreLocator;
