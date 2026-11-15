"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    <form onSubmit={submit} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Sign in</h1>
      <div><label className="label">Phone number</label>
        <input className="input" inputMode="tel" placeholder="0770 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
      <div><label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      <p className="text-center text-sm">New here? <Link className="text-lib-blue underline" href="/register">Create an account</Link></p>
    </form>
  );
}
