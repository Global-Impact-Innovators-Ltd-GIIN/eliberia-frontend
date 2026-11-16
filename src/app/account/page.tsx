"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, IdCard, KeyRound, LockKeyhole, LogOut, MonitorSmartphone, UserRound } from "lucide-react";
import IdentityField from "@/components/IdentityField";
import { identityState, useIdentityMeta } from "@/lib/identity";
import { PasswordInput, StrengthMeter, strength } from "@/components/AuthShell";
import { api, fmtDateTime, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Act = { action: string; ip: string; created_at: string };
const ACTION_LABEL: Record<string, string> = {
  login: "Signed in", register: "Account created", verify_phone: "Phone verified", password_change: "Password changed",
  logout_all: "Signed out everywhere", account_locked: "Account locked", profile_update: "Profile updated",
  application_create: "Started an application", application_submit: "Submitted an application",
  payment_initiate: "Started a payment", payment_success: "Payment confirmed", biometric_verified: "Identity verified",
};

export default function Account() {
  const { user, loading, logout, login } = useAuth();
  const router = useRouter();
  const [p, setP] = useState({ full_name: "", email: "", county: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [show, setShow] = useState(false);
  const [acts, setActs] = useState<Act[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [idv, setIdv] = useState<Record<string, string>>({});
  const meta = useIdentityMeta();
  const idField = { name: "id_number", label: "Identity document", type: "identity", required: false };

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    setP({ full_name: user.full_name, email: user.email || "", county: user.county || "" });
    setIdv({ id_number: user.id_number || "", id_number__country: user.nationality || "", id_number__doc: user.id_doc_type || "" });
    api<Act[]>("/api/auth/activity").then(setActs).catch(() => {});
  }, [user, loading, router]);

  async function run(fn: () => Promise<string>) {
    setBusy(true); setMsg(null);
    try { setMsg({ ok: true, text: await fn() }); } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  const saveProfile = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const u = await api("/api/auth/me", { method: "PATCH", json: p });
    login(localStorage.getItem("eliberia_token") || "", u); return "Profile saved.";
  }); };
  const changePw = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api("/api/auth/change-password", { method: "POST", json: pw });
    setToken(r.token); setPw({ current_password: "", new_password: "" });
    return "Password changed. Other devices were signed out.";
  }); };
  const saveIdentity = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const st = identityState(idField, idv, meta);
    const u = await api("/api/auth/me", { method: "PATCH", json: { nationality: st.country, id_doc_type: st.doc, id_number: st.number } });
    login(localStorage.getItem("eliberia_token") || "", u); return "Identity document saved. We will fill it in for you on future applications.";
  }); };
  const exportData = () => run(async () => {
    const blob = new Blob([JSON.stringify(await api("/api/me/export"), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-eliberia-data.json"; a.click();
    URL.revokeObjectURL(a.href); return "Your data file was downloaded.";
  });
  const logoutAll = () => run(async () => { await api("/api/auth/logout-all", { method: "POST" }); logout(); router.push("/login"); return "Signed out."; });

  if (!user) return null;
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Account &amp; security</h1>
      <p className="muted mt-1">{user.phone} · {user.role}</p>
      {msg && <div className={`alert mt-5 ${msg.ok ? "alert-ok" : "alert-error"}`} role="status">{msg.text}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4">
          <h2 className="flex items-center gap-2 font-bold"><UserRound size={18} /> Profile</h2>
          <div><label className="label" htmlFor="fn">Full name</label><input id="fn" className="input" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required minLength={3} /></div>
          <div><label className="label" htmlFor="em">Email <span className="font-normal text-ink-500">(optional)</span></label><input id="em" type="email" className="input" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
          <div><label className="label" htmlFor="co">County</label><input id="co" className="input" value={p.county} onChange={(e) => setP({ ...p, county: e.target.value })} /></div>
          <button className="btn" disabled={busy}>Save profile</button>
        </form>

        <form onSubmit={changePw} className="card space-y-4">
          <h2 className="flex items-center gap-2 font-bold"><KeyRound size={18} /> Change password</h2>
          <div><label className="label" htmlFor="cp">Current password</label>
            <PasswordInput id="cp" value={pw.current_password} onChange={(v) => setPw({ ...pw, current_password: v })} show={show} toggle={() => setShow(!show)} autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="np">New password</label>
            <PasswordInput id="np" value={pw.new_password} onChange={(v) => setPw({ ...pw, new_password: v })} show={show} toggle={() => setShow(!show)} autoComplete="new-password" />
            <StrengthMeter pw={pw.new_password} /></div>
          <button className="btn" disabled={busy || strength(pw.new_password) < 2}>Change password</button>
        </form>

        {user.role === "citizen" && (
          <form onSubmit={saveIdentity} className="card space-y-4 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-bold"><IdCard size={18} /> Identity document</h2>
            <p className="muted">Save it once. Services that ask for your National ID or passport will fill it in for you, and it is checked against your country&apos;s format.</p>
            <div className="grid sm:grid-cols-2"><IdentityField field={idField} data={idv} meta={meta} onChange={(patch) => setIdv({ ...idv, ...patch })} /></div>
            <button className="btn" disabled={busy || (!!idv.id_number && !identityState(idField, idv, meta).valid)}>Save identity document</button>
          </form>
        )}

        {user.role === "citizen" && (
          <div className="card flex flex-wrap items-center gap-4 lg:col-span-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole size={22} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Your data, under your control</h2>
              <p className="muted">Your answers, documents and photos are encrypted. Each application shows which official opened it. You can download everything eLiberia holds about you.</p>
            </div>
            <button className="btn btn-ghost" onClick={exportData} disabled={busy}><Download size={16} /> Download my data</button>
          </div>
        )}

        <div className="card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold"><MonitorSmartphone size={18} /> Recent activity</h2>
            <button className="btn btn-ghost !text-flag-700" onClick={logoutAll} disabled={busy}><LogOut size={16} /> Sign out of all devices</button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {acts.map((a, i) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span className="font-medium">{ACTION_LABEL[a.action] || a.action.replace(/_/g, " ")}</span>
                <span className="text-ink-500">{fmtDateTime(a.created_at)} · {a.ip}</span>
              </li>
            ))}
            {!acts.length && <li className="muted py-2">No activity yet.</li>}
          </ul>
          <p className="muted mt-3">See something you don&apos;t recognise? Change your password - it signs out every other device.</p>
        </div>
      </div>
    </div>
  );
}
