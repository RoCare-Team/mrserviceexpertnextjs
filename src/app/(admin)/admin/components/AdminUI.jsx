"use client";

/**
 * Shared presentational primitives for the admin console.
 * Logic (state, fetching) lives in each page; these only handle look & feel
 * so every page reads consistently and feels premium.
 */

import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Pencil,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

/* ---- Page header ---------------------------------------------------- */
export function PageHead({ eyebrow, title, subtitle, count, countLabel }) {
  return (
    <div className="adm-pagehead">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="adm-pill">
          <span className="num">{Number(count).toLocaleString("en-IN")}</span>
          {countLabel}
        </span>
      )}
    </div>
  );
}

/* ---- Form bits ------------------------------------------------------ */
export function Field({ label, children, grow = false, className = "" }) {
  return (
    <div className={`adm-field ${grow ? "grow" : ""} ${className}`}>
      {label && <label className="adm-label">{label}</label>}
      {children}
    </div>
  );
}

export function Input(props) {
  return <input {...props} className={`adm-input ${props.className || ""}`} />;
}

export function SearchInput(props) {
  return (
    <div className="adm-inputwrap">
      <Search size={16} className="adm-inputicon" />
      <input {...props} className={`adm-input ${props.className || ""}`} />
    </div>
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`adm-select ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea {...props} className={`adm-textarea ${props.className || ""}`} />;
}

export function Button({ variant = "default", size, children, className = "", ...props }) {
  const v =
    variant === "primary"
      ? "adm-btn-primary"
      : variant === "ghost"
      ? "adm-btn-ghost"
      : variant === "danger"
      ? "adm-btn-danger"
      : "";
  return (
    <button {...props} className={`adm-btn ${v} ${size === "sm" ? "adm-btn-sm" : ""} ${className}`}>
      {children}
    </button>
  );
}

/* ---- Table ---------------------------------------------------------- */
export function SortHeader({ label, col, sortBy, sortDir, onSort, sortable = true }) {
  if (!sortable) return <th>{label}</th>;
  const active = sortBy === col;
  return (
    <th className="adm-th-sort" onClick={() => onSort(col)}>
      <span className="adm-th-inner">
        {label}
        <span className={`adm-sorticon ${active ? "on" : ""}`}>
          {!active ? (
            <ChevronsUpDown size={13} />
          ) : sortDir === "ASC" ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}
        </span>
      </span>
    </th>
  );
}

export function StatusBadge({ status }) {
  const active = String(status) === "1";
  return <span className={`adm-badge ${active ? "ok" : "off"}`}>{active ? "Active" : "Inactive"}</span>;
}

/** Generic badge. tone: ok | off | info | warn. Add "code" for mono numerals. */
export function Badge({ tone = "off", code = false, children }) {
  return <span className={`adm-badge ${tone} ${code ? "code" : ""}`}>{children}</span>;
}

export const Dash = () => <span className="adm-dash">—</span>;

export function EditButton({ onClick }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="Edit">
      <Pencil size={15} /> Edit
    </Button>
  );
}

export function TableState({ colSpan, loading, emptyTitle, emptyHint }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="adm-tablestate">
          {loading ? (
            <>
              <div className="ico">
                <Loader2 size={24} className="adm-spin" />
              </div>
              <b>Loading…</b>
              <span>Fetching the latest records.</span>
            </>
          ) : (
            <>
              <div className="ico">
                <Inbox size={24} />
              </div>
              <b>{emptyTitle || "Nothing here yet"}</b>
              <span>{emptyHint || "Try adjusting your filters or search."}</span>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ---- Pagination ----------------------------------------------------- */
export function Pagination({ page, totalPages, from, to, total, onPage }) {
  const span = 2;
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, page + span);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="adm-pagebar">
      <p className="count">
        Showing <b>{from}</b>–<b>{to}</b> of <b>{Number(total).toLocaleString("en-IN")}</b>
      </p>
      <div className="adm-pagenav">
        <button className="adm-pagebtn" disabled={page <= 1} onClick={() => onPage(1)} aria-label="First page">
          <ChevronsLeft />
        </button>
        <button className="adm-pagebtn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            className={`adm-pagebtn ${n === page ? "active" : ""}`}
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        ))}
        <button className="adm-pagebtn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </button>
        <button
          className="adm-pagebtn"
          disabled={page >= totalPages}
          onClick={() => onPage(totalPages)}
          aria-label="Last page"
        >
          <ChevronsRight />
        </button>
      </div>
    </div>
  );
}

/* ---- Modal ---------------------------------------------------------- */
export function Modal({ title, id, onClose, children, footer, size }) {
  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`adm-modal ${size || ""}`} role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <h2>
            {title}
            {id !== undefined && <span className="id">ID {id}</span>}
          </h2>
          <button className="adm-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, saving, onCancel, onConfirm, confirmLabel = "Yes, save", tone }) {
  const danger = tone === "danger";
  return (
    <div className="adm-modal-overlay" style={{ alignItems: "center", zIndex: 70 }}>
      <div className="adm-modal narrow" role="alertdialog" aria-modal="true">
        <div className={`adm-confirm ${danger ? "danger" : ""}`}>
          <div className="warn">
            <AlertTriangle size={24} />
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="row">
            <Button onClick={onCancel} disabled={saving}>
              No, go back
            </Button>
            <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="adm-spin" /> Working…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Toast ---------------------------------------------------------- */
export function Toast({ toast }) {
  if (!toast) return null;
  const ok = toast.type !== "error";
  return (
    <div className={`adm-toast ${ok ? "ok" : "error"}`} role="status">
      <span className="ico">{ok ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}</span>
      {toast.message}
    </div>
  );
}
