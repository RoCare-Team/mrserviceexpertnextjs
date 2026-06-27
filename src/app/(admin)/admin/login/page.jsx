"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        // honour ?next= if present, else go to the dashboard
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get("next") || "/admin";
        // full reload so middleware sees the fresh cookie
        window.location.assign(nextUrl.startsWith("/admin") ? nextUrl : "/admin");
      } else {
        setError(data.message || "Login failed.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-login-brand">
          <div className="adm-login-mark">MS</div>
          <div>
            <b>Mr. Service Expert</b>
            <span>Admin Console</span>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="sub">Use the email and password issued to your account.</p>

        <form onSubmit={submit}>
          {error && (
            <div className="adm-login-err">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="adm-field">
            <label className="adm-label">Email</label>
            <input
              className="adm-input"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Password</label>
            <div className="adm-passwrap">
              <input
                className="adm-input"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="adm-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn size={17} /> Sign in
              </>
            )}
          </button>
        </form>

        <p className="adm-login-foot">Authorised personnel only · sessions expire after 12 hours</p>
      </div>
    </div>
  );
}
