"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell, { PasswordInput, strength, StrengthMeter } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Forgot() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await api("/api/auth/forgot", { method: "POST", json: { phone } });
      setDevOtp(r.dev_otp || ""); setStep("reset");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function reset(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await api("/api/auth/reset", { method: "POST", json: { phone, otp, new_password: pw } });
      login(r.token, r.user);
      router.push(r.user.role === "citizen" ? "/dashboard" : r.user.role === "agent" ? "/agent" : "/staff");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (step === "reset") return (
    <AuthShell title="Choose a new password" subtitle={`Enter the code sent by SMS to ${phone}.`}>
      <form onSubmit={reset} className="space-y-4">
        {devOtp && <div className="alert alert-warn">Pilot mode (no SMS gateway yet) - your code is <b className="tracking-widest">{devOtp}</b></div>}
        <div><label className="label" htmlFor="code">6-digit code</label>
          <input id="code" className="input text-center text-xl font-bold tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required /></div>
        <div><label className="label" htmlFor="npw">New password</label>
          <PasswordInput id="npw" value={pw} onChange={setPw} show={show} toggle={() => setShow(!show)} autoComplete="new-password" />
          <StrengthMeter pw={pw} /></div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy || otp.length !== 6 || strength(pw) < 2}>{busy ? "Saving…" : "Set password and sign in"}</button>
      </form>
    </AuthShell>
  );

  return (
    <AuthShell title="Reset your password" subtitle="Also use this if an agent registered you and you have never set a password.">
      <form onSubmit={send} className="space-y-4">
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-ink-300 bg-slate-50 px-3 text-sm font-medium text-ink-700">+231</span>
            <input id="phone" className="input !rounded-l-none" inputMode="tel" autoComplete="tel" placeholder="770 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? "Sending…" : "Send reset code"}</button>
        <p className="muted text-center"><Link className="font-semibold text-navy-800 hover:underline" href="/login">Back to sign in</Link></p>
      </form>
    </AuthShell>
  );
}
