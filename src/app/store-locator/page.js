'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * StoreLocator — drop-in search + filter UI for your store/location data.
 *
 * Usage:
 *   import StoreLocator from './StoreLocator';
 *
 *   // Option 1: you already fetch the data yourself, just pass it in
 *   <StoreLocator stores={apiResponse.data} />
 *
 *   // Option 2: let the component fetch it (defaults to /api/stores,
 *   // change the default below or pass apiUrl as a prop)
 *   <StoreLocator apiUrl="/api/stores" />
 *
 * Expects each store object in the exact shape your API already returns:
 * { id, store_code, business_name, city_id, city_url, locality, state,
 *   address, postal_code, phone, website, primary_category,
 *   additional_categories, latitude, longitude, hours, description, status }
 *
 * Only requirement: Tailwind CSS set up in the host project.
 * No other dependencies — every icon below is inline SVG.
 */

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function toTitleCase(str) {
  return (str || '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// city_url is a slug ("delhi", "sasaram"); locality is the neighbourhood
// ("Ashok Vihar"). The city filter should group by the actual city, so we
// derive a display name from city_url and fall back to locality if needed.
function getCityName(store) {
  return toTitleCase(store.city_url) || store.locality || '';
}

function getDirectionsUrl(store) {
  if (store.latitude && store.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
  }
  const query = store.address || [store.locality, store.state].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function telHref(phone) {
  return `tel:${(phone || '').replace(/[^\d+]/g, '')}`;
}

function parseCategories(str) {
  return (str || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// icons (inline, so this file has zero icon-library dependency)
// ---------------------------------------------------------------------------

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconSearch = (props) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconMapPin = (props) => (
  <svg {...base} {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone = (props) => (
  <svg {...base} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);
const IconClock = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </svg>
);
const IconExternalLink = (props) => (
  <svg {...base} {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconX = (props) => (
  <svg {...base} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevronDown = (props) => (
  <svg {...base} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconNavigation = (props) => (
  <svg {...base} {...props}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

// ---------------------------------------------------------------------------
// small sub-views
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-5 w-24 rounded-full bg-gray-100" />
          <div className="mt-4 h-5 w-3/4 rounded bg-gray-100" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-4 h-4 w-full rounded bg-gray-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-gray-100" />
          <div className="mt-5 h-9 w-full rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
      <p className="font-medium text-gray-900">Couldn&apos;t load stores</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center rounded-lg bg-[#6e11b0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a0e92]"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ebfb] text-[#6e11b0]">
        <IconMapPin className="h-6 w-6" />
      </div>
      <p className="mt-4 font-medium text-gray-900">No stores match your search</p>
      <p className="mt-1 text-sm text-gray-500">Try a different city, or clear your filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 inline-flex items-center rounded-lg border border-[#6e11b0] px-4 py-2 text-sm font-medium text-[#6e11b0] transition-colors hover:bg-[#f4ebfb]"
      >
        Clear filters
      </button>
    </div>
  );
}

function StoreCard({ store }) {
  const categories = parseCategories(store.additional_categories);
  const cityName = getCityName(store);

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#f4ebfb] px-2.5 py-1 text-xs font-medium text-[#6e11b0]">
          {store.primary_category || 'Store'}
        </span>
        {store.status === '1' && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-gray-900">
        {store.business_name}
      </h3>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
        <IconMapPin className="h-3.5 w-3.5 shrink-0" />
        <span>
          {store.locality}
          {cityName && cityName !== store.locality ? `, ${cityName}` : ''}, {store.state}
        </span>
      </p>

      <p className="mt-3 line-clamp-2 text-sm text-gray-600">{store.address}</p>

      <div className="mt-4 space-y-1.5 text-sm text-gray-600">
        {store.phone && (
          <a
            href={telHref(store.phone)}
            className="flex items-center gap-2 transition-colors hover:text-[#6e11b0]"
          >
            <IconPhone className="h-4 w-4 shrink-0 text-[#6e11b0]" />
            {store.phone}
          </a>
        )}
        {store.hours && (
          <p className="flex items-center gap-2">
            <IconClock className="h-4 w-4 shrink-0 text-[#6e11b0]" />
            {store.hours}
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500"
            >
              {c}
            </span>
          ))}
          {categories.length > 3 && (
            <span className="px-1 py-0.5 text-[11px] text-gray-400">
              +{categories.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
        <a
          href={getDirectionsUrl(store)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#6e11b0] py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a0e92]"
        >
          <IconNavigation className="h-4 w-4" />
          Directions
        </a>
        {store.website && (
          <a
            href={store.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${store.business_name} website`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-[#6e11b0] hover:text-[#6e11b0]"
          >
            <IconExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// main component
// ---------------------------------------------------------------------------

export default function StoreLocator({ stores: storesProp, apiUrl = '/api/stores' }) {
  const [stores, setStores] = useState(storesProp || []);
  const [loading, setLoading] = useState(!storesProp);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    if (storesProp) {
      setStores(storesProp);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setStores(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, storesProp, retryCount]);

  const states = useMemo(
    () => Array.from(new Set(stores.map((s) => s.state).filter(Boolean))).sort(),
    [stores]
  );

  const cities = useMemo(() => {
    const pool = selectedState ? stores.filter((s) => s.state === selectedState) : stores;
    return Array.from(new Set(pool.map((s) => getCityName(s)).filter(Boolean))).sort();
  }, [stores, selectedState]);

  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      if (selectedState && s.state !== selectedState) return false;
      if (selectedCity && getCityName(s) !== selectedCity) return false;
      if (!q) return true;
      const haystack = [
        s.business_name,
        s.locality,
        getCityName(s),
        s.state,
        s.address,
        s.postal_code,
        s.primary_category,
        s.additional_categories,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [stores, query, selectedState, selectedCity]);

  const visibleStores = filteredStores.slice(0, visibleCount);
  const hasMore = filteredStores.length > visibleCount;
  const hasActiveFilters = Boolean(query || selectedState || selectedCity);

  function clearFilters() {
    setQuery('');
    setSelectedState('');
    setSelectedCity('');
    setVisibleCount(9);
  }

  return (
    <div className="max-w-7xl mx-auto py-4">
      {/* Search + filter header */}
      <div
        className="rounded-2xl px-6 py-10 text-white sm:px-10 sm:py-12"
        style={{ background: 'linear-gradient(135deg, #6e11b0 0%, #3d0f5f 100%)' }}
      >
        <h2 className="text-2xl font-bold sm:text-3xl">Find a Store Near You</h2>
        <p className="mt-2 max-w-xl text-white/80">
          Search by city, locality or pincode to find your nearest location.
        </p>

        <div className="relative mt-6">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(9);
            }}
            placeholder="Search by city, locality or pincode"
            aria-label="Search stores"
            className="w-full rounded-xl bg-white/95 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/70"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('');
                setVisibleCount(9);
              }}
              aria-label="Filter by state"
              className="cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-2.5 pl-3.5 pr-9 text-sm text-white outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="" className="text-gray-900">
                All States
              </option>
              {states.map((s) => (
                <option key={s} value={s} className="text-gray-900">
                  {s}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setVisibleCount(9);
              }}
              aria-label="Filter by city"
              className="cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-2.5 pl-3.5 pr-9 text-sm text-white outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="" className="text-gray-900">
                All Cities
              </option>
              {cities.map((c) => (
                <option key={c} value={c} className="text-gray-900">
                  {c}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-white/25 px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              <IconX className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading
            ? 'Loading stores…'
            : `Showing ${visibleStores.length} of ${filteredStores.length} store${
                filteredStores.length === 1 ? '' : 's'
              }`}
        </p>
      </div>

      {loading && <SkeletonGrid />}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      )}

      {!loading && !error && filteredStores.length === 0 && <EmptyState onClear={clearFilters} />}

      {!loading && !error && filteredStores.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 9)}
                className="rounded-xl border border-[#6e11b0] px-6 py-2.5 text-sm font-medium text-[#6e11b0] transition-colors hover:bg-[#f4ebfb]"
              >
                Show more stores
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}