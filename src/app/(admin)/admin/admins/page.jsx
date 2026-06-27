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

const EMPTY = { name: "", email: "", role: "admin", password: "" };

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

  const openCreate = () => {
    setForm(EMPTY);
    setModalMode("create");
  };
  const openEdit = (row) => {
    setForm({ id: row.id, name: row.name, email: row.email, role: row.role, status: String(row.status), password: "" });
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
            ...(form.password ? { password: form.password } : {}),
          }
        : { name: form.name, email: form.email, role: form.role, password: form.password };

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
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={7} loading={loading} emptyTitle="No admins yet" emptyHint="Add the first admin account." />
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
                      </span>
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
            {form.role === "super_admin" && (
              <p className="full adm-tabhint" style={{ margin: 0 }}>
                Super admins can manage other admins and access every section.
              </p>
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
