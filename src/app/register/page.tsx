"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Register() {
  const [f, setF] = useState({ full_name: "", phone: "", password: "", nin: "" });
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function register(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await api("/api/auth/register", { method: "POST", json: { ...f, nin: f.nin || undefined } });
      setDevOtp(r.dev_otp || ""); setStep("otp");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await api("/api/auth/verify-otp", { method: "POST", json: { phone: f.phone, otp } });
      login(r.token, r.user); router.push("/dashboard");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (step === "otp") return (
    <form onSubmit={verify} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Verify your phone</h1>
      <p className="text-sm text-slate-600">Enter the 6-digit code we sent by SMS to {f.phone}.</p>
      {devOtp && <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">Dev mode - code: <b>{devOtp}</b></p>}
      <input className="input tracking-widest" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>Verify</button>
    </form>
  );

  return (
    <form onSubmit={register} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Create account</h1>
      <div><label className="label">Full name</label><input className="input" value={f.full_name} onChange={set("full_name")} required /></div>
      <div><label className="label">Phone number</label><input className="input" inputMode="tel" placeholder="0770 000 000" value={f.phone} onChange={set("phone")} required /></div>
      <div><label className="label">National ID number (optional)</label><input className="input" value={f.nin} onChange={set("nin")} /></div>
      <div><label className="label">Password (min 8 characters)</label><input className="input" type="password" minLength={8} value={f.password} onChange={set("password")} required /></div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
    </form>
  );
}
