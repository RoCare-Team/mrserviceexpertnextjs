"use client";

// Admin title / description / image (from /admin/services) for services whose
// data comes from backend APIs other than all_services.php — cart
// (view_cart_details / add_to_cart), checkout and the booking popup
// (getAllServices). They share the same service ids, so we look the overrides
// up by id and patch them in at render time. Price fields are never touched,
// and anything the admin left blank keeps the backend's value.

import { useEffect, useState } from "react";

// id → override ({} when the service has none), shared across components so
// the cart, checkout and popup don't refetch the same ids.
const cache = new Map();

async function loadOverrides(ids) {
  const missing = ids.filter((id) => !cache.has(id));
  if (!missing.length) return false;

  const res = await fetch(`/api/services/overrides?ids=${missing.join(",")}`);
  const data = await res.json();
  const overrides = data?.overrides || {};
  missing.forEach((id) => cache.set(id, overrides[id] || {}));
  return true;
}

/**
 * Returns `withOverride(service, idKey = "service_id")` → the service with the
 * admin's service_name / description / image applied.
 */
export default function useServiceOverrides(ids) {
  const [, setVersion] = useState(0);
  const key = [...new Set((ids || []).filter(Boolean).map(String))].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    loadOverrides(key.split(","))
      .then((changed) => {
        if (changed && !cancelled) setVersion((v) => v + 1);
      })
      .catch(() => {
        // Overrides are cosmetic; the backend values still render.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return (service, idKey = "service_id") => {
    const o = service && cache.get(String(service[idKey]));
    if (!o) return service;
    return {
      ...service,
      service_name: o.title ?? service.service_name,
      description: o.description ?? service.description,
      image: o.image ?? service.image,
    };
  };
}
