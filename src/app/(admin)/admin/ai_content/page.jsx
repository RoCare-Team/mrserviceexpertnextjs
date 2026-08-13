"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Link2,
  ListOrdered,
  CheckCircle2,
  XCircle,
  Loader2,
  Search as SearchIcon,
  Library,
} from "lucide-react";
import {
  PageHead,
  Field,
  Input,
  Textarea,
  Button,
  Tabs,
  Toast,
  FormCard,
  SectionTitle,
} from "@/app/(admin)/admin/components/AdminUI";

// The API accepts at most 10 URLs per call; keep the chunk smaller so each
// request stays comfortably under any proxy timeout.
const CHUNK = 5;
const MAX_URLS = 500;

const parseList = (text) =>
  text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

function StatRow({ done, total, ok, failed }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ margin: "14px 0 6px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        <span>
          {done} / {total} processed
        </span>
        <span style={{ color: "#16a34a" }}>
          {ok} generated{" "}
          {failed > 0 && <span style={{ color: "#dc2626" }}>· {failed} failed</span>}
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#e9e6f5",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg,#7c3aed,#a855f7)",
            transition: "width .25s ease",
          }}
        />
      </div>
    </div>
  );
}

function ResultTable({ results }) {
  if (!results.length) return null;
  return (
    <div className="adm-tablecard" style={{ marginTop: 18 }}>
      <div className="adm-tablescroll" style={{ maxHeight: 420, overflowY: "auto" }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 46 }}>#</th>
              <th>URL</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 90 }}>Version</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={`${r.input}-${i}`}>
                <td className="col-id">{i + 1}</td>
                <td className="col-strong">
                  <span className="adm-truncate" style={{ display: "block", maxWidth: 380 }}>
                    {r.slug || r.input}
                  </span>
                </td>
                <td>
                  {r.ok ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        color: "#16a34a",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      <CheckCircle2 size={14} /> Done
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      <XCircle size={14} /> Failed
                    </span>
                  )}
                </td>
                <td className="col-muted">{r.ok ? `content${r.version}` : "—"}</td>
                <td className="col-muted">
                  {r.ok ? `${r.words} words · ${r.pageType}` : r.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AiContentGeneratePage() {
  const [tab, setTab] = useState("single");

  // single
  const [singleUrl, setSingleUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(false);

  // bulk
  const [bulkText, setBulkText] = useState("");

  // shared run state
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const stopRef = useRef(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const bulkUrls = parseList(bulkText);
  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;

  const checkUrl = async () => {
    if (!singleUrl.trim()) return;
    setChecking(true);
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
      setChecking(false);
    }
  };

  /** Runs a list of URLs through the API in chunks, streaming results in. */
  const run = async (urls) => {
    if (!urls.length) return;
    if (urls.length > MAX_URLS) {
      showToast(`Maximum ${MAX_URLS} URLs at a time.`, "error");
      return;
    }

    stopRef.current = false;
    setRunning(true);
    setResults([]);
    setDone(0);
    setTotal(urls.length);

    let generated = 0;
    let errored = 0;

    for (let i = 0; i < urls.length; i += CHUNK) {
      if (stopRef.current) break;
      const chunk = urls.slice(i, i + CHUNK);
      try {
        const res = await fetch("/api/admin/ai_content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: chunk }),
        });
        const d = await res.json();
        if (d.success) {
          generated += d.generated;
          errored += d.failed;
          setResults((prev) => [...prev, ...d.results]);
        } else {
          errored += chunk.length;
          setResults((prev) => [
            ...prev,
            ...chunk.map((u) => ({ input: u, ok: false, reason: d.message || "Request failed" })),
          ]);
        }
      } catch (e) {
        errored += chunk.length;
        setResults((prev) => [
          ...prev,
          ...chunk.map((u) => ({ input: u, ok: false, reason: e.message })),
        ]);
      }
      setDone(Math.min(i + chunk.length, urls.length));
    }

    setRunning(false);
    if (stopRef.current) showToast(`Stopped — ${generated} generated, ${errored} failed.`);
    else if (errored) showToast(`${generated} generated, ${errored} failed.`, errored > generated ? "error" : "success");
    else showToast(`${generated} URL${generated === 1 ? "" : "s"} generated.`);
  };

  return (
    <div>
      <PageHead
        eyebrow="AI"
        title="AI Content Generator"
        subtitle="Generate fresh page copy from a URL's meta title, description, keywords and existing content. The live page is never touched — everything is stored in ai_content for you to use manually."
      />

      <div className="adm-toolbar" style={{ justifyContent: "flex-end" }}>
        <Link href="/admin/ai_content/library" className="adm-btn">
          <Library size={17} /> Generated content library
        </Link>
      </div>

      <Tabs
        tabs={[
          { key: "single", label: "Single URL", icon: Link2 },
          { key: "bulk", label: `Bulk (max ${MAX_URLS})`, icon: ListOrdered },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Single URL ─────────────────────────────────────────── */}
      {tab === "single" && (
        <FormCard className="adm-tabpanel">
          <SectionTitle>Generate for one URL</SectionTitle>
          <Field label="Page URL or slug" className="full">
            <Input
              placeholder="https://www.mrserviceexpert.com/delhi/ro-water-purifier  —  or just  delhi/ro-water-purifier"
              value={singleUrl}
              onChange={(e) => {
                setSingleUrl(e.target.value);
                setPreview(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && checkUrl()}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Button onClick={checkUrl} disabled={checking || running || !singleUrl.trim()}>
              {checking ? <Loader2 size={16} className="adm-spin" /> : <SearchIcon size={16} />}
              {checking ? "Checking…" : "Check URL"}
            </Button>
            <Button
              variant="primary"
              disabled={running || !singleUrl.trim()}
              onClick={() => run([singleUrl.trim()])}
            >
              {running ? <Loader2 size={16} className="adm-spin" /> : <Sparkles size={16} />}
              {running ? "Generating…" : "Generate content"}
            </Button>
          </div>

          {preview && (
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
          )}
        </FormCard>
      )}

      {/* ── Bulk ───────────────────────────────────────────────── */}
      {tab === "bulk" && (
        <FormCard className="adm-tabpanel">
          <SectionTitle>Generate for many URLs</SectionTitle>
          <Field
            label={`One URL per line — ${bulkUrls.length} detected (max ${MAX_URLS})`}
            className="full"
          >
            <Textarea
              rows={12}
              placeholder={`https://www.mrserviceexpert.com/delhi/ro-water-purifier\ndelhi/ac\nmumbai/kent/ro-water-purifier`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={running}
            />
          </Field>

          <p className="adm-tabhint" style={{ marginTop: 10 }}>
            URLs are processed {CHUNK} at a time so a long list never times out. You can stop
            mid-run — everything already generated stays saved.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Button
              variant="primary"
              disabled={running || !bulkUrls.length || bulkUrls.length > MAX_URLS}
              onClick={() => run(bulkUrls)}
            >
              {running ? <Loader2 size={16} className="adm-spin" /> : <Sparkles size={16} />}
              {running ? "Generating…" : `Generate ${bulkUrls.length || ""} URLs`}
            </Button>
            {running && (
              <Button
                onClick={() => {
                  stopRef.current = true;
                }}
              >
                Stop after current batch
              </Button>
            )}
            {!running && bulkText && <Button onClick={() => setBulkText("")}>Clear list</Button>}
          </div>

          {bulkUrls.length > MAX_URLS && (
            <p className="adm-note err" style={{ marginTop: 10 }}>
              {bulkUrls.length} URLs — remove {bulkUrls.length - MAX_URLS} to stay within the{" "}
              {MAX_URLS} limit.
            </p>
          )}
        </FormCard>
      )}

      {(running || results.length > 0) && (
        <div style={{ marginTop: 20 }}>
          <StatRow done={done} total={total} ok={ok} failed={failed} />
          <ResultTable results={results} />
          {!running && ok > 0 && (
            <p className="adm-tabhint" style={{ marginTop: 12 }}>
              Open the{" "}
              <Link href="/admin/ai_content/library" style={{ color: "#7c3aed", fontWeight: 600 }}>
                content library
              </Link>{" "}
              to read, edit or copy any version.
            </p>
          )}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
