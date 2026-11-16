"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock3, FileText, FolderLock, RefreshCw, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { API, api, Certificate, fmtDate, getToken, homeFor } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Item = Certificate & { reference: string; application_id: number; renewal_code?: string | null };
type Saved = { id: number; label: string; filename: string; kind: string; size: number; created_at: string };

function expiryInfo(c: Item) {
  if (!c.expires_at) return null;
  const days = Math.ceil((new Date(c.expires_at + "Z").getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: `Expired ${fmtDate(c.expires_at)}`, tone: "text-flag-700", soon: true };
  if (days <= 60) return { text: `Expires in ${days} day${days === 1 ? "" : "s"}`, tone: "text-amber-700", soon: true };
  return { text: `Valid until ${fmtDate(c.expires_at)}`, tone: "text-ink-700", soon: false };
}

export default function Documents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [saved, setSaved] = useState<Saved[] | null>(null);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSaved = useCallback(() => api<Saved[]>("/api/locker").then(setSaved).catch(() => setSaved([])), []);
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "citizen") { router.push(homeFor(user.role)); return; }
    api<Item[]>("/api/certificates").then(setItems).catch(() => setItems([]));
    loadSaved();
  }, [user, loading, router, loadSaved]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setMsg({ ok: false, text: "Files must be 8 MB or smaller." }); return; }
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("label", label);
      await api("/api/locker", { method: "POST", body: fd });
      setMsg({ ok: true, text: `${label} saved. You can attach it to any application.` }); setLabel(""); setFile(null); await loadSaved();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  async function remove(s: Saved) {
    if (!window.confirm(`Remove "${s.label}" from your locker? Applications it was attached to keep their own copy.`)) return;
    try { await api(`/api/locker/${s.id}`, { method: "DELETE" }); await loadSaved(); } catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }
  async function open(s: Saved) {
    try {
      const r = await fetch(`${API}/api/locker/${s.id}/file`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error("Could not open the document.");
      window.open(URL.createObjectURL(await r.blob()), "_blank", "noopener");
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }

  return (
    <div className="container-x py-8">
      <div className="eyebrow">Document wallet</div>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">My documents</h1>

      <h2 className="mt-8 text-lg font-bold">Certificates issued to you</h2>
      <p className="muted mt-1">Ready to show, print or share. We remind you before anything expires.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items === null && [0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
        {items?.map((c) => {
          const exp = expiryInfo(c);
          return (
            <div key={c.number} className="card relative overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-1.5 ${c.revoked || c.expired ? "bg-flag-600" : "bg-gradient-to-r from-flag-600 via-white to-navy-800"}`} />
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.revoked || c.expired ? "bg-flag-50 text-flag-700" : "bg-emerald-50 text-emerald-700"}`}>{c.revoked || c.expired ? <ShieldAlert size={22} /> : <BadgeCheck size={22} />}</span>
              <h3 className="mt-3 font-bold leading-snug">{c.service_name}</h3>
              <p className="muted">{c.institution_name}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Holder</dt><dd className="text-right font-medium">{c.holder_name}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Issued</dt><dd className="font-medium">{fmtDate(c.issued_at)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-500">Number</dt><dd className="font-mono text-xs font-semibold">{c.number}</dd></div>
              </dl>
              {exp && <p className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${exp.tone}`}><Clock3 size={15} /> {exp.text}</p>}
              {c.revoked && <p className="mt-3 text-xs font-bold uppercase tracking-wide text-flag-700">Revoked</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/verify/${c.number}`} className="btn btn-ghost !py-2">View &amp; print</Link>
                {c.renewal_code && !c.revoked && (exp?.soon || c.expired) && <Link href={`/services/${c.renewal_code}`} className="btn btn-red !py-2"><RefreshCw size={15} /> Renew now</Link>}
              </div>
            </div>
          );
        })}
      </div>
      {items?.length === 0 && (
        <div className="card mt-2 max-w-md text-center">
          <FolderLock className="mx-auto text-ink-500" size={36} />
          <h3 className="mt-3 font-semibold">No certificates yet</h3>
          <p className="muted mt-1">When an application is approved, its certificate appears here.</p>
          <Link href="/services" className="btn mt-4">Browse services</Link>
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold">Saved documents</h2>
          <p className="muted mt-1">Upload your birth certificate, ID or photo once and attach it to any application. Stored encrypted; only you can see them.</p>
          <ul className="mt-4 space-y-2">
            {saved === null && [0, 1].map((i) => <Skeleton key={i} className="h-14" />)}
            {saved?.map((s) => (
              <li key={s.id} className="card flex items-center gap-3 !p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><FileText size={19} /></span>
                <button className="min-w-0 flex-1 text-left" onClick={() => open(s)}>
                  <span className="block truncate font-semibold hover:underline">{s.label}</span>
                  <span className="muted block truncate">{s.filename} · {s.kind?.toUpperCase()} · {(s.size / 1048576).toFixed(1)} MB · {fmtDate(s.created_at)}</span>
                </button>
                <button className="rounded-lg p-2 text-flag-700 hover:bg-flag-50" onClick={() => remove(s)} aria-label={`Remove ${s.label}`}><Trash2 size={16} /></button>
              </li>
            ))}
            {saved?.length === 0 && <li className="muted">Nothing saved yet.</li>}
          </ul>
        </div>
        <form onSubmit={upload} className="card h-fit space-y-3 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-bold"><UploadCloud size={18} /> Save a document</h3>
          <div><label className="label" htmlFor="lk-l">What is it?</label>
            <input id="lk-l" className="input" list="lk-names" placeholder="e.g. Birth certificate" value={label} onChange={(e) => setLabel(e.target.value)} required minLength={2} maxLength={80} />
            <datalist id="lk-names">{["Birth certificate", "National ID", "Passport bio page", "Passport-size photo", "Proof of address", "Driver's license"].map((n) => <option key={n} value={n} />)}</datalist></div>
          <div><label className="label" htmlFor="lk-f">File</label>
            <input id="lk-f" className="input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            <p className="mt-1 text-xs text-ink-500">PDF, JPG or PNG, up to 8 MB. Up to 20 documents.</p></div>
          {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role="status">{msg.text}</div>}
          <button className="btn" disabled={busy || !file || label.trim().length < 2}>{busy ? "Saving…" : "Save to my locker"}</button>
        </form>
      </div>
    </div>
  );
}
