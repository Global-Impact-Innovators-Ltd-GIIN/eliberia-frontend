"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import AuthShell, { PasswordInput } from "@/components/AuthShell";
import { api, homeFor } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"password" | "code">("password");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const finish = (r: any) => { login(r.token, r.user); router.push(homeFor(r.user.role)); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api("/api/auth/login", { method: "POST", json: { phone, password } });
      if (r.two_factor) { setDevOtp(r.dev_otp || ""); setOtp(""); setStep("code"); } else finish(r);
    } catch (e: any) {
      setError(e.message);
      if (e.status === 403) router.push(`/register?verify=${encodeURIComponent(phone)}`);
    } finally { setBusy(false); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try { finish(await api("/api/auth/login/verify", { method: "POST", json: { phone, otp } })); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (step === "code") return (
    <AuthShell title="Confirm it's you" subtitle="Staff and agent accounts need a second step.">
      <form onSubmit={verify} className="space-y-4">
        <div className="alert alert-info"><ShieldCheck size={17} className="mt-0.5 shrink-0" /> We sent a 6-digit sign-in code by SMS to {phone}.</div>
        {devOtp && <div className="alert alert-warn">Pilot mode (no SMS gateway yet) - your code is <b className="tracking-widest">{devOtp}</b></div>}
        <div><label className="label" htmlFor="code">Sign-in code</label>
          <input id="code" className="input h-14 text-center text-2xl font-bold tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required autoFocus /></div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy || otp.length !== 6}>{busy ? "Checking…" : "Sign in"}</button>
        <button type="button" className="mx-auto block text-sm font-semibold text-navy-800 hover:underline" onClick={() => { setStep("password"); setError(""); }}>Use a different account</button>
      </form>
    </AuthShell>
  );

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
          <div className="flex items-baseline justify-between"><label className="label" htmlFor="pw">Password</label>
            <Link href="/forgot" className="text-xs font-semibold text-navy-800 hover:underline">Forgot password?</Link></div>
          <PasswordInput id="pw" value={password} onChange={setPassword} show={show} toggle={() => setShow(!show)} autoComplete="current-password" />
        </div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted text-center">New to eLiberia? <Link className="font-semibold text-navy-800 hover:underline" href="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
