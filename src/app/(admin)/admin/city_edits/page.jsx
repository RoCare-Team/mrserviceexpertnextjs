"use client";

import { useEffect, useState, useCallback } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

export default function CityEditPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // filters
  const [searchInput, setSearchInput] = useState(""); // immediate (typing)
  const [search, setSearch] = useState(""); // debounced (sent to API)
  const [status, setStatus] = useState("");
  const [state, setState] = useState("");
  const [states, setStates] = useState([]);

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // edit modal + confirm
  const [editing, setEditing] = useState(null); // a working copy of the city
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---- debounce the search box (reset to page 1 on change) ----
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ---- load distinct states once for the dropdown ----
  useEffect(() => {
    fetch("/api/admin/edit_city?type=states")
      .then((r) => r.json())
      .then((d) => d.success && setStates(d.states || []))
      .catch(() => {});
  }, []);

  // ---- fetch a page of cities whenever query inputs change ----
  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        state,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_city?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCities(data.data);
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
  }, [page, limit, search, status, state, sortBy, sortDir]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setState("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  // ---- edit handling ----
  const openEdit = (city) => setEditing({ ...city }); // edit a copy
  const setField = (field, value) =>
    setEditing((c) => ({ ...c, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_city", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchCities(); // refresh current page
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // windowed page numbers around the current page
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
        <h1 className="text-2xl sm:text-3xl font-bold">City Edit Panel</h1>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          {total} cities
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search (name or URL)
          </label>
          <input
            className="border w-full p-2 rounded-lg text-sm"
            placeholder="e.g. mumbai"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            className="border p-2 rounded-lg text-sm"
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

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
          <select
            className="border p-2 rounded-lg text-sm max-w-[200px]"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Per page</label>
          <select
            className="border p-2 rounded-lg text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("id")}
              >
                ID <SortIcon col="id" />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("city_name")}
              >
                City Name <SortIcon col="city_name" />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("city_url")}
              >
                URL <SortIcon col="city_url" />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("state")}
              >
                State <SortIcon col="state" />
              </th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No cities found.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{city.id}</td>
                  <td className="px-4 py-3 font-medium">{city.city_name}</td>
                  <td className="px-4 py-3 text-gray-600">{city.city_url}</td>
                  <td className="px-4 py-3 text-gray-600">{city.state}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        String(city.status) === "1"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {String(city.status) === "1" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(city)}
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
          <button
            disabled={page <= 1}
            onClick={() => setPage(1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            «
          </button>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            Prev
          </button>
          {pageNumbers().map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 border rounded-lg text-sm ${
                n === page ? "bg-blue-600 text-white border-blue-600" : ""
              }`}
            >
              {n}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            Next
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            »
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-40 p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-bold">
                Edit: {editing.city_name}{" "}
                <span className="text-sm font-normal text-gray-400">
                  (ID {editing.id})
                </span>
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City Name</label>
                <input
                  className="border w-full p-2 rounded-lg"
                  value={editing.city_name || ""}
                  onChange={(e) => setField("city_name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City URL</label>
                <input
                  className="border w-full p-2 rounded-lg"
                  value={editing.city_url || ""}
                  onChange={(e) => setField("city_url", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  className="border w-full p-2 rounded-lg"
                  value={editing.state || ""}
                  onChange={(e) => setField("state", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="border w-full p-2 rounded-lg"
                  value={String(editing.status)}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Title</label>
                <input
                  className="border w-full p-2 rounded-lg"
                  value={editing.meta_title || ""}
                  onChange={(e) => setField("meta_title", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                <textarea
                  rows={2}
                  className="border w-full p-2 rounded-lg"
                  value={editing.meta_keywords || ""}
                  onChange={(e) => setField("meta_keywords", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  className="border w-full p-2 rounded-lg"
                  value={editing.meta_description || ""}
                  onChange={(e) => setField("meta_description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">City Content</label>
                <TipTapEditorWithSEO
                  content={editing.city_content || ""}
                  onChange={(html) => setField("city_content", html)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
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
              Update <strong>{editing.city_name}</strong> (ID {editing.id})? This
              overwrites the existing record.
            </p>
            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                No, go back
              </button>
              <button
                disabled={saving}
                onClick={doUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Yes, save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}