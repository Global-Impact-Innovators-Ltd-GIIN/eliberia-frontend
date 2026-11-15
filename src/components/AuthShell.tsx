import { BadgeCheck, ScanFace, Wallet } from "lucide-react";
import { Star } from "./ui";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-lift md:grid-cols-2">
        <div className="hero-bg relative hidden overflow-hidden p-10 text-white md:block">
          <Star size={220} className="absolute -bottom-12 -right-12 text-white/5" />
          <h2 className="text-2xl font-extrabold leading-tight">One account for every government service.</h2>
          <ul className="mt-8 space-y-5 text-sm text-navy-100">
            <li className="flex gap-3"><Wallet size={18} className="mt-0.5 shrink-0" /> Pay any application with mobile money.</li>
            <li className="flex gap-3"><ScanFace size={18} className="mt-0.5 shrink-0" /> Verify your identity from home.</li>
            <li className="flex gap-3"><BadgeCheck size={18} className="mt-0.5 shrink-0" /> Receive certificates anyone can verify.</li>
          </ul>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="muted mt-1">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PasswordInput({ value, onChange, show, toggle, id, autoComplete }: {
  value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; id: string; autoComplete: string;
}) {
  return (
    <div className="relative">
      <input id={id} className="input pr-16" type={show ? "text" : "password"} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} required />
      <button type="button" onClick={toggle} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-navy-50">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-4
}

export function StrengthMeter({ pw }: { pw: string }) {
  const s = strength(pw);
  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][s];
  const color = ["bg-slate-200", "bg-flag-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"][s];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= s ? color : "bg-slate-200"}`} />)}</div>
      <p className="mt-1 text-xs text-ink-500">{pw ? label : "At least 8 characters, with letters and numbers"}</p>
    </div>
  );
}
