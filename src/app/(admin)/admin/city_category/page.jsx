"use client";

import { useEffect, useState, useCallback } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

function CityPicker({ valueLabel, onPick, onClear, placeholder = "Search city..." }) {
  const [q, setQ] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => setQ(valueLabel || ""), [valueLabel]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/edit_page?type=cities&q=${encodeURIComponent(q)}`
        );
        const d = await res.json();
        if (d.success) setResults(d.cities || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="relative">
      <div className="flex">
        <input
          className="border w-full p-2 rounded-lg text-sm"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {onClear && q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              onClear();
            }}
            className="ml-1 px-2 border rounded-lg text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto text-sm">
          {results.map((c) => (
            <li
              key={c.id}
              onMouseDown={() => {
                onPick(c);
                setQ(c.city_name);
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
            >
              {c.city_name}{" "}
              <span className="text-gray-400 text-xs">/{c.city_url}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Derive a readable label from an unknown service-type row shape.
const serviceTypeLabel = (row) =>
  row.service_type_name ||
  row.name ||
  row.title ||
  row.type ||
  `Type ${row.id}`;

export default function PageEditPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filterCity, setFilterCity] = useState(null); // { id, city_name }
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  // lookups
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // edit + confirm
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // load lookups once
  useEffect(() => {
    fetch("/api/admin/edit_page?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
    fetch("/api/admin/edit_page?type=brands")
      .then((r) => r.json())
      .then((d) => d.success && setBrands(d.brands || []))
      .catch(() => {});
    fetch("/api/admin/edit_page?type=service_types")
      .then((r) => r.json())
      .then((d) => d.success && setServiceTypes(d.service_types || []))
      .catch(() => {});
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        city_id: filterCity?.id ? String(filterCity.id) : "",
        category_id: categoryId,
        brand_id: brandId,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_page?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        showToast(data.message || "Failed to load", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, filterCity, categoryId, brandId, sortBy, sortDir]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setFilterCity(null);
    setCategoryId("");
    setBrandId("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const openEdit = (pg) => setEditing({ ...pg });
  const setField = (field, value) =>
    setEditing((p) => ({ ...p, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchPages();
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pageNumbers = () => {
    const span = 2;
    const start = Math.max(1, page - span);
    const end = Math.min(totalPages, page + span);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const SortIcon = ({ col }) =>
    sortBy === col ? (
      <span className="ml-1 text-blue-600">{sortDir === "ASC" ? "▲" : "▼"}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Page Edit Panel</h1>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          {total} pages
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end shadow-sm">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search (title or URL)
          </label>
          <input
            className="border w-full p-2 rounded-lg text-sm"
            placeholder="e.g. ro service"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
          <CityPicker
            valueLabel={filterCity?.city_name || ""}
            placeholder="All cities"
            onPick={(c) => {
              setFilterCity(c);
              setPage(1);
            }}
            onClear={() => {
              setFilterCity(null);
              setPage(1);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            className="border w-full p-2 rounded-lg text-sm"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
          <select
            className="border w-full p-2 rounded-lg text-sm"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            className="border w-full p-2 rounded-lg text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2">
          <select
            className="border w-full p-2 rounded-lg text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort("id")}>
                ID <SortIcon col="id" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort("page_title")}>
                Page Title <SortIcon col="page_title" />
              </th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No pages found.
                </td>
              </tr>
            ) : (
              pages.map((pg) => (
                <tr key={pg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{pg.id}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {pg.page_title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pg.city_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pg.category_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pg.brand_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        String(pg.status) === "1"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {String(pg.status) === "1" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(pg)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-sm text-gray-500">
          Showing {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">«</button>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Prev</button>
          {pageNumbers().map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 border rounded-lg text-sm ${n === page ? "bg-blue-600 text-white border-blue-600" : ""}`}
            >
              {n}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Next</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">»</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-40 p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-bold truncate pr-4">
                Edit: {editing.page_title}{" "}
                <span className="text-sm font-normal text-gray-400">(ID {editing.id})</span>
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Page Title</label>
                <input className="border w-full p-2 rounded-lg" value={editing.page_title || ""} onChange={(e) => setField("page_title", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Page URL</label>
                <input className="border w-full p-2 rounded-lg" value={editing.page_url || ""} onChange={(e) => setField("page_url", e.target.value)} />
              </div>

              {/* Relations */}
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <CityPicker
                  valueLabel={editing.city_name || ""}
                  onPick={(c) => setEditing((p) => ({ ...p, city_id: c.id, city_name: c.city_name }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className="border w-full p-2 rounded-lg" value={String(editing.category_id ?? "")} onChange={(e) => setField("category_id", e.target.value)}>
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <select className="border w-full p-2 rounded-lg" value={String(editing.brand_id ?? "")} onChange={(e) => setField("brand_id", e.target.value)}>
                  <option value="">— none —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.brand_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                {serviceTypes.length > 0 ? (
                  <select className="border w-full p-2 rounded-lg" value={String(editing.service_type_id ?? "")} onChange={(e) => setField("service_type_id", e.target.value)}>
                    <option value="">— none —</option>
                    {serviceTypes.map((s) => (
                      <option key={s.id} value={s.id}>{serviceTypeLabel(s)}</option>
                    ))}
                  </select>
                ) : (
                  <input className="border w-full p-2 rounded-lg" value={editing.service_type_id ?? ""} onChange={(e) => setField("service_type_id", e.target.value)} placeholder="service_type_id" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="border w-full p-2 rounded-lg" value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Title</label>
                <input className="border w-full p-2 rounded-lg" value={editing.meta_title || ""} onChange={(e) => setField("meta_title", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                <textarea rows={2} className="border w-full p-2 rounded-lg" value={editing.meta_keywords || ""} onChange={(e) => setField("meta_keywords", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <textarea rows={3} className="border w-full p-2 rounded-lg" value={editing.meta_description || ""} onChange={(e) => setField("meta_description", e.target.value)} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Page Content</label>
                <TipTapEditorWithSEO content={editing.page_content || ""} onChange={(html) => setField("page_content", html)} />
              </div>

              {/* FAQs */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold text-gray-800 mb-3">FAQs</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-gray-50 border rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Question {i}
                      </label>
                      <input
                        className="border w-full p-2 rounded-lg mb-2"
                        value={editing[`faqquestion${i}`] || ""}
                        onChange={(e) => setField(`faqquestion${i}`, e.target.value)}
                      />
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Answer {i}
                      </label>
                      <textarea
                        rows={2}
                        className="border w-full p-2 rounded-lg"
                        value={editing[`faqanswer${i}`] || ""}
                        onChange={(e) => setField(`faqanswer${i}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => setEditing(null)} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setConfirmOpen(true)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Save changes?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Update page <strong>#{editing.id}</strong>? This overwrites the existing record.
            </p>
            <div className="flex gap-3">
              <button disabled={saving} onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">No, go back</button>
              <button disabled={saving} onClick={doUpdate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving..." : "Yes, save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}