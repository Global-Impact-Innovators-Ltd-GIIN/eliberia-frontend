"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell, { PasswordInput } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api("/api/auth/login", { method: "POST", json: { phone, password } });
      login(r.token, r.user);
      router.push(r.user.role === "citizen" ? "/dashboard" : "/staff");
    } catch (e: any) {
      setError(e.message);
      if (e.status === 403) router.push(`/register?verify=${encodeURIComponent(phone)}`);
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your phone number.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-ink-300 bg-slate-50 px-3 text-sm font-medium text-ink-700">+231</span>
            <input id="phone" className="input !rounded-l-none" inputMode="tel" autoComplete="tel" placeholder="770 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <PasswordInput id="pw" value={password} onChange={setPassword} show={show} toggle={() => setShow(!show)} autoComplete="current-password" />
        </div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted text-center">New to eLiberia? <Link className="font-semibold text-navy-800 hover:underline" href="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
