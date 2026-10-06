"use client";

// Admin → AI Content
//
// Single URL ya bulk (max 500) URLs se AI content generate karta hai, aur
// "Generated Content" tab me poori library dikhta hai.
//
// Har URL ek alag /api/admin/ai_content/generate request hai, jo ek controlled
// concurrency pool se chalti hai — isse 500 OpenAI calls ek saath fire nahi
// hoti aur har URL ka live status (Pending / Processing / Generated / Failed)
// dikhta hai. Ek URL fail ho to queue rukti nahi; "Retry failed" se dobara
// chala sakte ho.

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Link2,
  ListChecks,
  Library,
  Play,
  Square,
  RotateCw,
  RefreshCcw,
  Eye,
  Copy,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Info,
  Search as SearchIcon,
} from "lucide-react";
import {
  PageHead,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Tabs,
  Toast,
  FormCard,
  SectionTitle,
  Modal,
} from "@/app/(admin)/admin/components/AdminUI";
import AiContentLibrary from "@/app/(admin)/admin/components/AiContentLibrary";

const MAX_URLS = 500;
const DEFAULT_WORDS = 600;

const STATUS_META = {
  pending: { label: "Pending", color: "#64748b", bg: "#f1f5f9", Icon: Clock },
  processing: { label: "Processing", color: "#0369a1", bg: "#e0f2fe", Icon: Loader2 },
  done: { label: "Generated", color: "#15803d", bg: "#dcfce7", Icon: CheckCircle2 },
  failed: { label: "Failed", color: "#b91c1c", bg: "#fee2e2", Icon: XCircle },
};

/** Same page = same key, whether pasted as a full URL, a path or a slug. */
const urlKey = (raw) =>
  String(raw || "")
    .trim()
    .split(/[?#]/)[0]
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

/** Textarea → unique URL list (newline / comma / space separated). */
function parseList(text) {
  const seen = new Set();
  const urls = [];
  for (const token of String(text || "").split(/[\s,]+/)) {
    const t = token.trim();
    const key = urlKey(t);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    urls.push(t);
  }
  return urls;
}

const makeRow = (url) => ({
  url,
  status: "pending",
  version: null,
  words: 0,
  message: "",
  html: "",
  existing: null, // DB me pehle se kitne versions hain (null = check nahi hua)
});

function StatusPill({ status, count }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  const spin = status === "processing" && (count === undefined || count > 0);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        color: m.color,
        background: m.bg,
        opacity: count === 0 ? 0.45 : 1,
        whiteSpace: "nowrap",
      }}
    >
      <m.Icon size={13} className={spin ? "adm-spin" : undefined} />
      {m.label}
      {count !== undefined && <b style={{ fontVariantNumeric: "tabular-nums" }}>{count}</b>}
    </span>
  );
}

export default function AiContentGeneratePage() {
  const [tab, setTab] = useState("single"); // single | bulk | library

  const [singleUrl, setSingleUrl] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [preview, setPreview] = useState(null); // "Check URL" result
  const [checkingUrl, setCheckingUrl] = useState(false);

  const [words, setWords] = useState(DEFAULT_WORDS);
  const [concurrency, setConcurrency] = useState(3);
  const [instructions, setInstructions] = useState("");
  const [skipExisting, setSkipExisting] = useState(false);

  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [viewing, setViewing] = useState(null);
  const stopRef = useRef(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const stats = useMemo(() => {
    const s = { total: rows.length, pending: 0, processing: 0, done: 0, failed: 0 };
    for (const r of rows) s[r.status] += 1;
    return s;
  }, [rows]);
  const progress = stats.total
    ? Math.round(((stats.done + stats.failed) / stats.total) * 100)
    : 0;

  const bulkCount = useMemo(() => parseList(bulkText).length, [bulkText]);
  const existingCount = rows.filter((r) => r.existing > 0 && r.status !== "done").length;

  const patchRow = useCallback((index, changes) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));
  }, []);

  /* ── DB me pehle se kitne versions hain ─────────────────────────── */
  const fetchExisting = useCallback(async (urls) => {
    const res = await fetch("/api/admin/ai_content/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.message || "Existing content check failed");
    return d.counts || {};
  }, []);

  const checkExisting = useCallback(
    async (list = rows) => {
      if (!list.length) return null;
      setChecking(true);
      try {
        const counts = await fetchExisting(list.map((r) => r.url));
        setRows(list.map((r) => ({ ...r, existing: counts[r.url] ?? 0 })));
        const already = list.filter((r) => (counts[r.url] ?? 0) > 0).length;
        showToast(
          already
            ? `${already} URL(s) ka content pehle se hai — naya content next version me jaayega`
            : "Kisi bhi URL ka content abhi tak generate nahi hua"
        );
        return counts;
      } catch (e) {
        showToast(e.message, "error");
        return null;
      } finally {
        setChecking(false);
      }
    },
    [rows, fetchExisting, showToast]
  );

  // Jin URLs ka content pehle se likha hai unhe list (aur textarea) se hatao.
  // Is run me abhi generate hue rows rehne do taaki unka preview na khoye.
  const removeExisting = useCallback(
    (list = rows, counts = null) => {
      const count = (r) => (counts ? counts[r.url] ?? 0 : r.existing ?? 0);
      const kept = list
        .filter((r) => !(count(r) > 0 && r.status !== "done"))
        .map((r) => (counts ? { ...r, existing: count(r) } : r));
      const removed = list.length - kept.length;
      if (!removed) {
        showToast("Hatane ke liye koi pehle se likha URL nahi mila");
        return;
      }
      setRows(kept);
      setBulkText(kept.map((r) => r.url).join("\n"));
      showToast(`${removed} pehle se likhe URL(s) hata diye — ${kept.length} bache`);
    },
    [rows, showToast]
  );

  const loadBulkUrls = useCallback(async () => {
    const urls = parseList(bulkText);
    if (!urls.length) {
      showToast("Koi URL nahi mila", "error");
      return;
    }
    const truncated = Math.max(0, urls.length - MAX_URLS);
    const list = urls.slice(0, MAX_URLS).map(makeRow);
    setRows(list);
    if (truncated) showToast(`Max ${MAX_URLS} URLs — ${truncated} extra hata diye`, "error");

    const counts = await checkExisting(list);
    if (skipExisting && counts) removeExisting(list, counts);
  }, [bulkText, checkExisting, skipExisting, removeExisting, showToast]);

  /* ── Ek URL generate ────────────────────────────────────────────── */
  const generateOne = useCallback(
    async (index, url) => {
      patchRow(index, { status: "processing", message: "" });
      try {
        const res = await fetch("/api/admin/ai_content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [url], words, instructions }),
        });
        const d = await res.json().catch(() => ({}));
        const r = d?.results?.[0];
        if (!res.ok || !d.success || !r?.ok) {
          throw new Error(r?.reason || d?.message || `Request failed (HTTP ${res.status})`);
        }
        patchRow(index, {
          status: "done",
          version: r.version,
          existing: r.version,
          words: r.words || 0,
          html: r.html || "",
          message: `${r.words || 0} words · ${r.pageType}`,
        });
      } catch (e) {
        patchRow(index, { status: "failed", message: e.message || "Generation failed" });
      }
    },
    [patchRow, words, instructions]
  );

  /* ── Concurrency pool ───────────────────────────────────────────── */
  // `concurrency` lanes parallel chalti hain, har lane ek time par ek URL.
  const runQueue = useCallback(
    async (targets) => {
      if (!targets.length) {
        showToast("Process karne ke liye kuch nahi hai");
        return;
      }
      stopRef.current = false;
      setRunning(true);

      let cursor = 0;
      const lane = async () => {
        while (!stopRef.current) {
          const i = cursor++;
          if (i >= targets.length) return;
          await generateOne(targets[i].index, targets[i].url);
        }
      };

      try {
        await Promise.all(
          Array.from({ length: Math.max(1, Math.min(concurrency, targets.length)) }, lane)
        );
      } finally {
        setRunning(false);
        if (stopRef.current) showToast("Generation rok di gayi — jo ban chuka wo saved hai");
        else showToast("Generation complete");
      }
    },
    [concurrency, generateOne, showToast]
  );

  const startAll = () =>
    runQueue(
      rows
        .map((r, index) => ({ index, url: r.url, status: r.status }))
        .filter((t) => t.status === "pending" || t.status === "failed")
    );

  const retryFailed = () =>
    runQueue(
      rows
        .map((r, index) => ({ index, url: r.url, status: r.status }))
        .filter((t) => t.status === "failed")
    );

  // Sabke liye ek aur version — purana kabhi overwrite nahi hota.
  const regenerateAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "pending", message: "" })));
    runQueue(rows.map((r, index) => ({ index, url: r.url })));
  };

  const handleSingleGenerate = async () => {
    const url = singleUrl.trim();
    if (!url) return;
    const list = [makeRow(url)];
    setRows(list);
    try {
      const counts = await fetchExisting([url]);
      setRows([{ ...list[0], existing: counts[url] ?? 0 }]);
    } catch {
      /* status check optional hai — generation phir bhi chalegi */
    }
    runQueue([{ index: 0, url }]);
  };

  // Free check — sirf DB lookup, koi OpenAI call nahi.
  const checkUrl = async () => {
    if (!singleUrl.trim()) return;
    setCheckingUrl(true);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/admin/ai_content/generate?url=${encodeURIComponent(singleUrl.trim())}`
      );
      const d = await res.json();
      if (d.success) setPreview(d);
      else showToast(d.message || "Could not read this URL", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setCheckingUrl(false);
    }
  };

  const downloadReport = () => {
    const header = "url,status,version,words,message\n";
    const body = rows
      .map((r) =>
        [r.url, r.status, r.version ? `content${r.version}` : "", r.words, r.message]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai-content-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyHtml = async (html) => {
    try {
      await navigator.clipboard.writeText(html || "");
      showToast("HTML copy ho gaya");
    } catch {
      showToast("Copy nahi ho paaya", "error");
    }
  };

  const switchTab = (key) => {
    if (running) {
      showToast("Generation chal rahi hai — pehle Stop karo", "error");
      return;
    }
    setTab(key);
  };

  return (
    <div>
      <PageHead
        eyebrow="AI"
        title="AI Content"
        subtitle="Generate fresh page copy from a URL's meta title, description, keywords and existing content. Content is never overwritten — every run goes into the next free version."
      />

      <Tabs
        tabs={[
          { key: "single", label: "Single URL", icon: Link2 },
          { key: "bulk", label: `Bulk URLs (max ${MAX_URLS})`, icon: ListChecks },
          { key: "library", label: "Generated Content", icon: Library },
        ]}
        active={tab}
        onChange={switchTab}
      />

      {tab === "library" ? (
        <div className="adm-tabpanel">
          <AiContentLibrary embedded />
        </div>
      ) : (
        <FormCard className="adm-tabpanel">
          {tab === "single" ? (
            <>
              <SectionTitle>Generate for one URL</SectionTitle>
              <Field label="Page URL or slug" className="full">
                <Input
                  placeholder="https://www.mrserviceexpert.com/delhi/ro-water-purifier  —  or just  delhi/ro-water-purifier"
                  value={singleUrl}
                  disabled={running}
                  onChange={(e) => {
                    setSingleUrl(e.target.value);
                    setPreview(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !running && handleSingleGenerate()}
                />
              </Field>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <Button onClick={checkUrl} disabled={checkingUrl || running || !singleUrl.trim()}>
                  {checkingUrl ? <Loader2 size={16} className="adm-spin" /> : <SearchIcon size={16} />}
                  {checkingUrl ? "Checking…" : "Check URL"}
                </Button>
                <Button
                  variant="primary"
                  disabled={running || !singleUrl.trim()}
                  onClick={handleSingleGenerate}
                >
                  {running ? <Loader2 size={16} className="adm-spin" /> : <Sparkles size={16} />}
                  {running ? "Generating…" : "Generate content"}
                </Button>
              </div>

              {running && (
                <p className="adm-note checking" style={{ marginTop: 12 }}>
                  <Loader2 size={14} className="adm-spin" /> Content likha ja raha hai — usually
                  10-30 seconds. Page band mat karo.
                </p>
              )}

              {preview && <UrlPreview preview={preview} />}
            </>
          ) : (
            <>
              <SectionTitle>Generate for many URLs</SectionTitle>
              <Field
                label={`One URL per line — ${bulkCount} detected (max ${MAX_URLS})`}
                className="full"
              >
                <Textarea
                  rows={10}
                  placeholder={`https://www.mrserviceexpert.com/delhi/ro-water-purifier\ndelhi/ac\nmumbai/kent/ro-water-purifier`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  disabled={running}
                />
              </Field>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 14,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <label
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={skipExisting}
                    onChange={(e) => setSkipExisting(e.target.checked)}
                    disabled={running}
                  />
                  Skip already written URLs
                </label>
                <div style={{ flex: 1 }} />
                <Button onClick={loadBulkUrls} disabled={running || checking || !bulkCount}>
                  <ListChecks size={16} /> Load URLs
                </Button>
                <Button
                  variant="primary"
                  onClick={startAll}
                  disabled={running || rows.length === 0}
                >
                  {running ? <Loader2 size={16} className="adm-spin" /> : <Play size={16} />}
                  {running
                    ? `Generating ${stats.done + stats.failed}/${stats.total}…`
                    : "Generate Bulk Content"}
                </Button>
              </div>

              {bulkCount > MAX_URLS && (
                <p className="adm-note err" style={{ marginTop: 10 }}>
                  {bulkCount} URLs — sirf pehle {MAX_URLS} load honge.
                </p>
              )}
            </>
          )}

          {/* Options */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid #eef0f4",
            }}
          >
            <Field label="Target length (words)">
              <Input
                type="number"
                min={200}
                max={2000}
                step={50}
                value={words}
                disabled={running}
                onChange={(e) => setWords(Number(e.target.value) || DEFAULT_WORDS)}
              />
            </Field>
            <Field label="Parallel requests">
              <Select
                value={concurrency}
                disabled={running}
                onChange={(e) => setConcurrency(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} at a time
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Extra instructions (optional)">
              <Input
                value={instructions}
                disabled={running}
                placeholder="e.g. AMC plans par focus karo"
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Field>
          </div>

          <p className="adm-tabhint" style={{ marginTop: 12, display: "flex", gap: 6 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Page ka meta title, description, keywords aur existing content DB se AI ko diya
              jaata hai. Content <b>kabhi overwrite nahi hota</b> — pehli baar{" "}
              <code>content1</code>, dobara <code>content2</code>, phir <code>content3</code>…
            </span>
          </p>
        </FormCard>
      )}

      {/* ── Progress + actions ─────────────────────────────────── */}
      {tab !== "library" && rows.length > 0 && (
        <FormCard className="adm-tabpanel" >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, marginRight: 4 }}>
              {stats.total} URL{stats.total === 1 ? "" : "s"}
            </span>
            <StatusPill status="done" count={stats.done} />
            <StatusPill status="processing" count={stats.processing} />
            <StatusPill status="pending" count={stats.pending} />
            <StatusPill status="failed" count={stats.failed} />
            <div style={{ flex: 1 }} />

            {running ? (
              <Button size="sm" variant="danger" onClick={() => (stopRef.current = true)}>
                <Square size={15} /> Stop
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={() => checkExisting()} disabled={checking}>
                  <RefreshCcw size={15} className={checking ? "adm-spin" : undefined} /> Check
                  existing
                </Button>
                {tab === "bulk" && (
                  <Button
                    size="sm"
                    onClick={() => removeExisting()}
                    disabled={checking || existingCount === 0}
                    title="Jin URLs ka AI content pehle se likha hai unhe list se hatao"
                  >
                    <Trash2 size={15} /> Remove already written ({existingCount})
                  </Button>
                )}
                <Button size="sm" onClick={retryFailed} disabled={stats.failed === 0}>
                  <RotateCw size={15} /> Retry failed ({stats.failed})
                </Button>
                <Button
                  size="sm"
                  onClick={regenerateAll}
                  title="Sabhi URLs ke liye ek aur version banao"
                >
                  <Sparkles size={15} /> Generate next version
                </Button>
                <Button size="sm" onClick={downloadReport}>
                  <Download size={15} /> CSV
                </Button>
                <Button size="sm" onClick={() => setRows([])}>
                  <Trash2 size={15} /> Clear
                </Button>
              </>
            )}
          </div>

          <div
            style={{
              height: 8,
              marginTop: 14,
              borderRadius: 999,
              background: "#e9e6f5",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg,#7c3aed,#a855f7)",
                transition: "width .25s ease",
              }}
            />
          </div>
        </FormCard>
      )}

      {/* ── Per-URL status table ───────────────────────────────── */}
      {tab !== "library" && rows.length > 0 && (
        <div className="adm-tablecard" style={{ marginTop: 18 }}>
          <div className="adm-tablescroll" style={{ maxHeight: 560, overflowY: "auto" }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 46 }}>#</th>
                  <th>URL</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 120 }}>Saved in</th>
                  <th>Details</th>
                  <th style={{ width: 90 }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.url}-${i}`}>
                    <td className="col-id">{i + 1}</td>
                    <td className="col-strong">
                      <span className="adm-truncate" style={{ display: "block", maxWidth: 380 }} title={r.url}>
                        {r.url}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={r.status} />
                    </td>
                    <td className="col-muted">
                      {r.version ? (
                        <code>content{r.version}</code>
                      ) : r.existing > 0 ? (
                        `has ${r.existing} version${r.existing === 1 ? "" : "s"}`
                      ) : r.existing === 0 ? (
                        "none"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="col-muted" style={r.status === "failed" ? { color: "#dc2626" } : undefined}>
                      {r.message || "—"}
                    </td>
                    <td>
                      <Button size="sm" disabled={!r.html} onClick={() => setViewing(r)}>
                        <Eye size={15} /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewing && (
        <Modal
          title={`Preview — content${viewing.version}`}
          size="wide"
          onClose={() => setViewing(null)}
          footer={
            <>
              <Button onClick={() => copyHtml(viewing.html)}>
                <Copy size={16} /> Copy HTML
              </Button>
              <Button variant="primary" onClick={() => setViewing(null)}>
                Close
              </Button>
            </>
          }
        >
          <p className="adm-tabhint" style={{ marginBottom: 12, wordBreak: "break-all" }}>
            {viewing.url} · {viewing.words} words
          </p>
          <div
            className="pageContent"
            style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}
            dangerouslySetInnerHTML={{ __html: viewing.html }}
          />
          <p className="adm-label" style={{ marginTop: 16 }}>
            Raw HTML
          </p>
          <textarea
            readOnly
            className="adm-textarea"
            rows={8}
            value={viewing.html}
            style={{ fontFamily: "monospace", fontSize: 12.5 }}
          />
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function UrlPreview({ preview }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 14,
        borderRadius: 12,
        background: preview.resolved ? "#f5f3ff" : "#fef2f2",
        border: `1px solid ${preview.resolved ? "#ddd6fe" : "#fecaca"}`,
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      {preview.resolved ? (
        <>
          <div>
            <b>Slug:</b> {preview.slug} &nbsp;·&nbsp; <b>Type:</b> {preview.pageType}
          </div>
          <div>
            {preview.cityName && (
              <>
                <b>City:</b> {preview.cityName}&nbsp;·&nbsp;
              </>
            )}
            {preview.brandName && (
              <>
                <b>Brand:</b> {preview.brandName}&nbsp;·&nbsp;
              </>
            )}
            {preview.categoryName && (
              <>
                <b>Category:</b> {preview.categoryName}
              </>
            )}
          </div>
          <div>
            <b>Meta title:</b> {preview.metaTitle || "—"}
          </div>
          <div>
            <b>Meta description:</b> {preview.metaDescription || "—"}
          </div>
          <div>
            <b>Meta keywords:</b> {preview.metaKeywords || "—"}
          </div>
          <div style={{ marginTop: 6 }}>
            <b>Existing AI versions:</b> {preview.existingVersions} → next will be saved as{" "}
            <code>content{preview.nextVersion}</code>
          </div>
        </>
      ) : (
        <div>
          <b>Not resolvable:</b> {preview.reason}
        </div>
      )}
    </div>
  );
}
