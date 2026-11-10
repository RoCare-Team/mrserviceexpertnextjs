"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ShieldCheck, ShieldAlert, Trash2, KeyRound, Lock } from "lucide-react";
import {
  PageHead,
  Field,
  Input,
  Select,
  Button,
  StatusBadge,
  Dash,
  TableState,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";
import { MODULES, MODULE_KEYS, TEAMS } from "@/lib/adminAccess";

const EMPTY = { name: "", email: "", role: "admin", password: "", team: "other", modules: [] };

function TeamTag({ team }) {
  if (!TEAMS[team]) return null;
  const colors = { hr: ["#fdf2f8", "#be185d"], sales: ["#ecfdf5", "#047857"], seo: ["#eff6ff", "#1d4ed8"], other: ["#f4f4f5", "#52525b"] };
  const [bg, fg] = colors[team];
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: bg, color: fg, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
      {TEAMS[team].label}
    </span>
  );
}

export default function AdminsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) setRows(data.data);
      else showToast(data.message || "Failed to load.", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const pickTeam = (team) => setForm((f) => ({ ...f, team, modules: [...(TEAMS[team]?.modules || [])] }));
  const toggleModule = (m) =>
    setForm((f) => ({ ...f, modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m] }));

  const openCreate = () => {
    setForm(EMPTY);
    setModalMode("create");
  };
  const openEdit = (row) => {
    setForm({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: String(row.status),
      password: "",
      team: row.team || "other",
      // null = account from before access control → every section ticked.
      modules: row.modules === null || row.modules === undefined ? [...MODULE_KEYS] : row.modules,
    });
    setModalMode("edit");
  };
  const closeModal = () => {
    setModalMode(null);
    setConfirmOpen(false);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (modalMode === "create") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "A valid email is required.";
      if ((form.password || "").length < 8) return "Password must be at least 8 characters.";
    } else if (form.password && form.password.length < 8) {
      return "New password must be at least 8 characters.";
    }
    if (form.role === "admin" && form.modules.length === 0) return "Tick at least one section this admin can open.";
    return null;
  };

  const handleSaveClick = () => {
    const err = validate();
    if (err) return showToast(err, "error");
    setConfirmOpen(true);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const isEdit = modalMode === "edit";
      const payload = isEdit
        ? {
            id: form.id,
            name: form.name,
            role: form.role,
            status: form.status,
            team: form.team,
            modules: form.modules,
            ...(form.password ? { password: form.password } : {}),
          }
        : { name: form.name, email: form.email, role: form.role, password: form.password, team: form.team, modules: form.modules };

      const res = await fetch("/api/admin/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Saved.");
        closeModal();
        fetchRows();
      } else {
        showToast(data.message || "Failed.", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Admin deleted.");
        setDeleteTarget(null);
        fetchRows();
      } else showToast(data.message || "Delete failed.", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (denied) {
    return (
      <div>
        <PageHead eyebrow="Access" title="Admins" subtitle="Manage who can sign in to the console." />
        <div className="adm-tablecard" style={{ padding: 48, textAlign: "center" }}>
          <div className="adm-tablestate">
            <div className="ico">
              <Lock size={24} />
            </div>
            <b>Super admin access required</b>
            <span>Only a super admin can manage other admin accounts.</span>
          </div>
        </div>
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div>
      <PageHead
        eyebrow="Access"
        title="Admins"
        subtitle="Create accounts, set roles, and control who can sign in."
        count={rows.length}
        countLabel="admins"
      />

      <div className="adm-toolbar" style={{ justifyContent: "flex-end" }}>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={17} /> Add admin
        </Button>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={8} loading={loading} emptyTitle="No admins yet" emptyHint="Add the first admin account." />
              ) : (
                rows.map((u) => (
                  <tr key={u.id}>
                    <td className="col-id">{u.id}</td>
                    <td className="col-strong">{u.name}</td>
                    <td className="col-muted">{u.email}</td>
                    <td>
                      <span className={`adm-rolebadge ${u.role === "super_admin" ? "super" : "admin"}`}>
                        {u.role === "super_admin" ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                        {u.role === "super_admin" ? "Super admin" : "Admin"}
                      </span>{" "}
                      {u.role !== "super_admin" && <TeamTag team={u.team} />}
                    </td>
                    <td className="col-muted" style={{ fontSize: 12, maxWidth: 240 }}>
                      {u.role === "super_admin" || u.modules === null
                        ? "All sections"
                        : u.modules.length
                        ? u.modules.map((m) => MODULES[m]?.label.split(" (")[0]).join(", ")
                        : "None"}
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="col-muted">
                      {u.last_login ? new Date(u.last_login).toLocaleString("en-IN") : <Dash />}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                          <KeyRound size={14} /> Manage
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>
                          <Trash2 size={14} />
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

      {/* Create / Edit modal */}
      {modalMode && (
        <Modal
          title={modalMode === "create" ? "Add admin" : `Manage ${form.name}`}
          id={modalMode === "edit" ? form.id : undefined}
          onClose={closeModal}
          footer={
            <>
              <Button onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveClick}>
                {modalMode === "create" ? "Create admin" : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Full name" className="full">
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Priya Sharma" />
            </Field>
            <Field label="Email" className="full">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="admin@company.com"
                disabled={modalMode === "edit"}
              />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setField("role", e.target.value)}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </Select>
            </Field>
            {modalMode === "edit" && (
              <Field label="Status">
                <Select value={String(form.status)} onChange={(e) => setField("status", e.target.value)}>
                  <option value="1">Active</option>
                  <option value="0">Disabled</option>
                </Select>
              </Field>
            )}
            <Field label={modalMode === "create" ? "Password" : "Reset password (leave blank to keep)"} className="full">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder={modalMode === "create" ? "At least 8 characters" : "New password (optional)"}
                autoComplete="new-password"
              />
            </Field>
            {form.role === "super_admin" ? (
              <p className="full adm-tabhint" style={{ margin: 0 }}>
                Super admins can manage other admins and access every section.
              </p>
            ) : (
              <>
                <Field label="Team tag" className="full">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(TEAMS).map(([k, t]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => pickTeam(k)}
                        className={`adm-btn adm-btn-sm ${form.team === k ? "adm-btn-primary" : ""}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Sections this admin can open" className="full">
                  <div style={{ display: "grid", gap: 6 }}>
                    {MODULE_KEYS.map((m) => (
                      <label key={m} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
                        <input type="checkbox" checked={form.modules.includes(m)} onChange={() => toggleModule(m)} />
                        {MODULES[m].label}
                      </label>
                    ))}
                  </div>
                </Field>
                <p className="full adm-tabhint" style={{ margin: 0 }}>
                  Choosing a team ticks its usual sections (HR → Careers, Sales → Contact leads + Partners, SEO → Catalogue, Blogs, AI, Redirects). You can tick or untick any section. Hidden sections are blocked on the server too, not just removed from the menu.
                </p>
              </>
            )}
          </div>
        </Modal>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={modalMode === "create" ? "Create this admin?" : "Save changes?"}
          message={
            modalMode === "create"
              ? `${form.name} <${form.email}> will be able to sign in immediately.`
              : `Update ${form.name}'s account.`
          }
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this admin?"
          message={`${deleteTarget.name} <${deleteTarget.email}> will lose access permanently.`}
          tone="danger"
          confirmLabel="Yes, delete"
          saving={saving}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={doDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
