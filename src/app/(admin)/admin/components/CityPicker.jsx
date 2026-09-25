"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/app/(admin)/admin/components/AdminUI";

/* Compact city search/picker (queries the create_page lookup endpoint). */
export default function CityPicker({ valueLabel, onPick, onClear }) {
  const [q, setQ] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => setQ(valueLabel || ""), [valueLabel]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/create_page?type=cities&q=${encodeURIComponent(q)}`);
        const d = await res.json();
        if (d.success) setResults(d.cities || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="adm-combo">
      <div className="adm-combo-row">
        <Input
          placeholder="Search city…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {onClear && q && (
          <button type="button" className="adm-combo-clear" aria-label="Clear" onClick={() => { setQ(""); onClear(); }}>
            <X size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="adm-combo-menu">
          {results.map((c) => (
            <li
              key={c.id}
              className="adm-combo-opt"
              onMouseDown={() => {
                onPick(c);
                setQ(c.city_name);
                setOpen(false);
              }}
            >
              {c.city_name} <small>/{c.city_url}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
