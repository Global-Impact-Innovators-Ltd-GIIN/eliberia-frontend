"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import AuthShell, { PasswordInput, strength, StrengthMeter } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function RegisterForm() {
  const params = useSearchParams();
  const pending = params.get("verify") || "";
  const [f, setF] = useState({ full_name: "", phone: pending, password: "", nin: "" });
  const [step, setStep] = useState<"form" | "otp">(pending ? "otp" : "form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();
  const router = useRouter();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function register(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await api("/api/auth/register", { method: "POST", json: { ...f, nin: f.nin || undefined, accept_terms: agree } });
      setDevOtp(r.dev_otp || ""); setStep("otp");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function verify(code: string) {
    setBusy(true); setError("");
    try {
      const r = await api("/api/auth/verify-otp", { method: "POST", json: { phone: f.phone, otp: code } });
      login(r.token, r.user); router.push("/dashboard");
    } catch (e: any) { setError(e.message); setOtp(["", "", "", "", "", ""]); boxes.current[0]?.focus(); } finally { setBusy(false); }
  }
  async function resend() {
    setError(""); setInfo("");
    try {
      const r = await api("/api/auth/resend-otp", { method: "POST", json: { phone: f.phone } });
      setDevOtp(r.dev_otp || ""); setInfo("A new code was sent.");
    } catch (e: any) { setError(e.message); }
  }
  function typeDigit(i: number, v: string) {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) { // paste
      const next = digits.slice(0, 6).split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(next);
      if (digits.length >= 6) verify(next.join(""));
      return;
    }
    const next = [...otp]; next[i] = digits; setOtp(next);
    if (digits && i < 5) boxes.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  }

  if (step === "otp") return (
    <AuthShell title="Verify your phone" subtitle={`Enter the 6-digit code sent by SMS to ${f.phone}.`}>
      <div className="space-y-5">
        {devOtp && <div className="alert alert-warn">Pilot mode (no SMS gateway yet) - your code is <b className="tracking-widest">{devOtp}</b></div>}
        <div className="flex justify-between gap-2">
          {otp.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`}
              onChange={(e) => typeDigit(i, e.target.value)} disabled={busy}
              onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) boxes.current[i - 1]?.focus(); }}
              className="input h-14 !px-0 text-center text-2xl font-bold" maxLength={6} />
          ))}
        </div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {info && <div className="alert alert-ok">{info}</div>}
        <button type="button" onClick={resend} className="text-sm font-semibold text-navy-800 hover:underline">Didn&apos;t get it? Send a new code</button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell title="Create your account" subtitle="It takes about a minute.">
      <form onSubmit={register} className="space-y-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" value={f.full_name} onChange={set("full_name")} minLength={3} required /></div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-ink-300 bg-slate-50 px-3 text-sm font-medium text-ink-700">+231</span>
            <input id="phone" className="input !rounded-l-none" inputMode="tel" autoComplete="tel" placeholder="770 000 000" value={f.phone} onChange={set("phone")} required />
          </div>
        </div>
        <div><label className="label" htmlFor="nin">National ID number <span className="font-normal text-ink-500">(optional)</span></label><input id="nin" className="input" value={f.nin} onChange={set("nin")} /></div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <PasswordInput id="pw" value={f.password} onChange={(v) => setF({ ...f, password: v })} show={show} toggle={() => setShow(!show)} autoComplete="new-password" />
          <StrengthMeter pw={f.password} />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-ink-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-navy-800" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>I have read and accept the <Link href="/terms" target="_blank" className="font-semibold text-navy-800 underline">terms of use</Link> and the <Link href="/privacy" target="_blank" className="font-semibold text-navy-800 underline">privacy notice</Link>.</span>
        </label>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-lg w-full" disabled={busy || !agree || strength(f.password) < 2}>{busy ? "Creating…" : "Create account"}</button>
        <p className="muted text-center">Already registered? <Link className="font-semibold text-navy-800 hover:underline" href="/login">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}

export default function Register() {
  return <Suspense><RegisterForm /></Suspense>;
}
