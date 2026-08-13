"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Trash2, Copy, RefreshCw, ExternalLink, Eye, Code2 } from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import {
  PageHead,
  Field,
  SearchInput,
  Select,
  Button,
  SortHeader,
  Dash,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const fmtTs = (v) => (v ? new Date(v).toLocaleString("en-IN") : "—");

function VersionChips({ versions, latest }) {
  if (!versions?.length) return <Dash />;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {versions.map((v) => (
        <span
          key={v}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 999,
            background: v === latest ? "#ede9fe" : "#f1f5f9",
            color: v === latest ? "#6d28d9" : "#64748b",
          }}
        >
          c{v}
        </span>
      ))}
    </div>
  );
}

export default function AiContentLibraryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // filters / sorting
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState("DESC");

  // detail modal
  const [editing, setEditing] = useState(null); // { row, versions, nextVersion }
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeVersion, setActiveVersion] = useState(null);
  const [draft, setDraft] = useState("");
  const [showHtml, setShowHtml] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  // confirms
  const [confirm, setConfirm] = useState(null); // { kind, ... }

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/ai_content?${qs.toString()}`);
      const d = await res.json();
      if (d.success) {
        setRows(d.data);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      } else {
        showToast(d.message || "Failed to load", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDir]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  /* ── open one record ─────────────────────────────────────────── */
  const openRow = async (row) => {
    setEditing({ row, versions: [], nextVersion: null });
    setActiveVersion(null);
    setDraft("");
    setShowHtml(false);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/ai_content?id=${row.id}`);
      const d = await res.json();
      if (d.success) {
        setEditing({ row: d.row, versions: d.versions, nextVersion: d.nextVersion });
        const first = d.versions[d.versions.length - 1]; // newest first-selected
        setActiveVersion(first?.version ?? null);
        setDraft(first?.html || "");
      } else {
        showToast(d.message || "Failed to load record", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const pickVersion = (v) => {
    setActiveVersion(v.version);
    setDraft(v.html || "");
  };

  const refreshDetail = async (id) => {
    const res = await fetch(`/api/admin/ai_content?id=${id}`);
    const d = await res.json();
    if (d.success) {
      setEditing((p) => (p ? { ...p, versions: d.versions, nextVersion: d.nextVersion } : p));
      return d;
    }
    return null;
  };

  /* ── actions ─────────────────────────────────────────────────── */
  const saveVersion = async () => {
    if (!editing || !activeVersion) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai_content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.row.id, version: activeVersion, html: draft }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Version ${activeVersion} saved (${d.words} words)`);
        await refreshDetail(editing.row.id);
        fetchRows();
      } else {
        showToast(d.message || "Save failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async (url, id) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai_content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
      const d = await res.json();
      const r = d?.results?.[0];
      if (d.success && r?.ok) {
        showToast(`New version saved as content${r.version}`);
        if (id && editing?.row?.id === id) {
          const fresh = await refreshDetail(id);
          const newest = fresh?.versions?.[fresh.versions.length - 1];
          if (newest) {
            setActiveVersion(newest.version);
            setDraft(newest.html);
          }
        }
        fetchRows();
      } else {
        showToast(r?.reason || d.message || "Generation failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  // The live page is never written to from here — copying the HTML out is how
  // content moves onto a page, and only if the admin chooses to paste it.
  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(draft || "");
      showToast("HTML copied to clipboard");
    } catch {
      showToast("Could not copy — use the Raw HTML view and copy manually.", "error");
    }
  };

  const deleteVersion = async () => {
    if (!editing || !activeVersion) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/ai_content?id=${editing.row.id}&version=${activeVersion}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (d.success) {
        showToast(d.message);
        const fresh = await refreshDetail(editing.row.id);
        const next = fresh?.versions?.[fresh.versions.length - 1];
        setActiveVersion(next?.version ?? null);
        setDraft(next?.html || "");
        fetchRows();
      } else {
        showToast(d.message || "Delete failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const deleteRow = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai_content?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        showToast("Record deleted");
        if (editing?.row?.id === id) setEditing(null);
        fetchRows();
      } else {
        showToast(d.message || "Delete failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="AI"
        title="AI Content Library"
        subtitle="Every URL that has AI-generated content, with all of its versions. Stored separately from the live pages — nothing here changes what visitors see."
        count={total}
        countLabel="URLs"
      />

      <div className="adm-toolbar">
        <Field label="Search by URL or slug" grow>
          <SearchInput
            placeholder="e.g. delhi/ro-water-purifier"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Field>

        <Field label="Per page">
          <Select
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
          </Select>
        </Field>

        <Button onClick={fetchRows}>
          <RefreshCw size={16} /> Refresh
        </Button>
        <Link href="/admin/ai_content" className="adm-btn adm-btn-primary">
          <Sparkles size={17} /> Generate content
        </Link>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="URL" col="url" {...sortProps} />
                <SortHeader label="Slug" col="slug" {...sortProps} />
                <SortHeader label="Versions" col="versions" sortable={false} />
                <SortHeader label="First generated" col="date" {...sortProps} />
                <SortHeader label="Last updated" col="updated_at" {...sortProps} />
                <SortHeader label="Actions" col="actions" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={loading}
                  emptyTitle="Nothing generated yet"
                  emptyHint="Use the AI Content Generator to create copy for a URL."
                />
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-id">{r.id}</td>
                    <td className="col-strong">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-truncate"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 300 }}
                        title={r.url}
                      >
                        <span className="adm-truncate">{r.url}</span>
                        <ExternalLink size={13} />
                      </a>
                    </td>
                    <td className="col-muted">{r.slug}</td>
                    <td>
                      <VersionChips versions={r.versions} latest={r.latestVersion} />
                    </td>
                    <td className="col-muted">{fmtTs(r.date)}</td>
                    <td className="col-muted">{fmtTs(r.updated_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" onClick={() => openRow(r)}>
                          <Eye size={15} /> View / Edit
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          title="Generate one more version for this URL"
                          onClick={() => setConfirm({ kind: "regen", url: r.url, id: r.id })}
                        >
                          <Sparkles size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          title="Delete this record"
                          onClick={() => setConfirm({ kind: "deleteRow", id: r.id, url: r.url })}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      {/* ── Detail / edit modal ───────────────────────────────── */}
      {editing && (
        <Modal
          title={editing.row.slug || "AI content"}
          id={editing.row.id}
          size="wide"
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Close</Button>
              <Button
                disabled={busy || detailLoading}
                onClick={() => setConfirm({ kind: "regen", url: editing.row.url, id: editing.row.id })}
              >
                <Sparkles size={16} /> Generate version {editing.nextVersion || "+1"}
              </Button>
              <Button disabled={!activeVersion} onClick={copyHtml}>
                <Copy size={16} /> Copy HTML
              </Button>
              <Button variant="primary" disabled={saving || !activeVersion} onClick={saveVersion}>
                {saving ? "Saving…" : "Save version"}
              </Button>
            </>
          }
        >
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            <a href={editing.row.url} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
              {editing.row.url}
            </a>
            <span> · first generated {fmtTs(editing.row.date)} · last updated {fmtTs(editing.row.updated_at)}</span>
          </div>

          {detailLoading && <p className="adm-tabhint">Loading versions…</p>}

          {!detailLoading && editing.versions.length === 0 && (
            <p className="adm-tabhint">
              This record has no content yet. Use “Generate version” above.
            </p>
          )}

          {editing.versions.length > 0 && (
            <>
              {/* version switcher */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {editing.versions.map((v) => (
                  <button
                    key={v.version}
                    type="button"
                    className={`adm-btn ${v.version === activeVersion ? "adm-btn-primary" : ""}`}
                    onClick={() => pickVersion(v)}
                  >
                    content{v.version}
                    <span style={{ opacity: 0.75, fontSize: 11 }}>· {v.words}w</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="adm-btn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setShowHtml((s) => !s)}
                  title="Toggle raw HTML"
                >
                  <Code2 size={15} /> {showHtml ? "Rich editor" : "Raw HTML"}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-danger"
                  disabled={busy || !activeVersion}
                  onClick={() => setConfirm({ kind: "deleteVersion" })}
                  title="Delete this version"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {showHtml ? (
                <textarea
                  className="adm-textarea"
                  style={{ minHeight: 420, fontFamily: "monospace", fontSize: 12.5 }}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              ) : (
                <TipTapEditorWithSEO
                  // Remount when the selected version changes so the editor
                  // loads that version's HTML instead of keeping the old one.
                  key={`${editing.row.id}-v${activeVersion}`}
                  content={draft}
                  onChange={(html) => setDraft(html)}
                />
              )}
            </>
          )}
        </Modal>
      )}

      {/* ── Confirms ──────────────────────────────────────────── */}
      {confirm?.kind === "regen" && (
        <ConfirmDialog
          title="Generate another version?"
          message={`A NEW version will be added for ${confirm.url}. Existing versions are never overwritten.`}
          saving={busy}
          confirmLabel="Yes, generate"
          onCancel={() => setConfirm(null)}
          onConfirm={() => regenerate(confirm.url, confirm.id)}
        />
      )}
      {confirm?.kind === "deleteVersion" && (
        <ConfirmDialog
          title={`Delete content${activeVersion}?`}
          message="This version will be cleared. Other versions stay untouched."
          saving={busy}
          confirmLabel="Yes, delete"
          tone="danger"
          onCancel={() => setConfirm(null)}
          onConfirm={deleteVersion}
        />
      )}
      {confirm?.kind === "deleteRow" && (
        <ConfirmDialog
          title="Delete this record?"
          message={`Every AI version stored for ${confirm.url} will be removed. The live page is not affected.`}
          saving={busy}
          confirmLabel="Yes, delete"
          tone="danger"
          onCancel={() => setConfirm(null)}
          onConfirm={() => deleteRow(confirm.id)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
