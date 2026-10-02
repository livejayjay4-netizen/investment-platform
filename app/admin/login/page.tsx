"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "login" | "2fa" | "setup";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{secret:string; otpauth:string} | null>(null);
  const router = useRouter();

  const api = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { response, data } = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return setError(data.error || "Sign-in failed.");
      setStep(data.requires2fa ? "2fa" : "setup");
    } catch {
      setError("Network error. Please check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSetup() {
    setError("");
    try {
      const { response, data } = await api("/api/admin/setup-2fa");
      if (!response.ok) return setError(data.error || "Could not create setup details.");
      setSetup({ secret: data.secret, otpauth: data.otpauth });
    } catch {
      setError("Could not load two-factor setup details.");
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = step === "2fa" ? "/api/admin/verify-2fa" : "/api/admin/setup-2fa";
      const { response, data } = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (!response.ok) return setError(data.error || "Verification failed.");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const normalizedCode = code.replace(/\D/g, "").slice(0, 6);

  if (step === "setup") return (
    <div className="card form">
      <div className="brand"><span className="brandMark">IP</span>Admin Security</div>
      <h1>Protect the admin portal</h1>
      <p className="muted">Administrator access requires a password and authenticator-based two-factor authentication.</p>
      <div className="notice">
        <b>1.</b> Open Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.<br/>
        <b>2.</b> Add <b>Investment Platform</b> using the setup secret below.<br/>
        <b>3.</b> Enter the current 6-digit code to activate 2FA.
      </div>
      {!setup ? (
        <button className="btn secondary" type="button" onClick={loadSetup}>Show setup details</button>
      ) : (
        <div className="notice" style={{wordBreak:"break-all"}}>
          <b>Account:</b> {email || "Administrator"}<br/>
          <b>Secret:</b> {setup.secret}<br/>
          <b>Manual setup URI:</b> {setup.otpauth}
        </div>
      )}
      <form onSubmit={verify}>
        <label className="label">6-digit authenticator code</label>
        <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
          placeholder="000000" autoFocus={!!setup} required />
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy || normalizedCode.length !== 6 || !setup}>
          {busy ? "Verifying…" : "Enable 2FA & enter admin portal"}
        </button>
      </form>
    </div>
  );

  if (step === "2fa") return (
    <div className="card form">
      <div className="brand"><span className="brandMark">IP</span>Admin Security</div>
      <h1>Two-factor verification</h1>
      <p className="muted">Enter the current 6-digit code from your authenticator app.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={verify}>
        <label className="label">Authentication code</label>
        <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
          placeholder="000000" autoFocus required />
        <button className="btn" disabled={busy || normalizedCode.length !== 6}>
          {busy ? "Verifying…" : "Continue to Admin Portal"}
        </button>
      </form>
      <button className="btn secondary" type="button" style={{marginTop:10}} onClick={()=>{setStep("login");setCode("");setError("");}}>
        Start again
      </button>
    </div>
  );

  return (
    <div className="card form">
      <div className="brand"><span className="brandMark">IP</span>Administrator Access</div>
      <h1>Admin portal</h1>
      <p className="muted">Separate administrator authentication for the investment platform.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={start}>
        <label className="label">Admin email</label>
        <input className="input" type="email" autoComplete="username" value={email}
          onChange={e=>setEmail(e.target.value)} required />
        <label className="label">Admin password</label>
        <input className="input" type="password" autoComplete="current-password" value={password}
          onChange={e=>setPassword(e.target.value)} required />
        <button className="btn" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
      </form>
    </div>
  );
}
