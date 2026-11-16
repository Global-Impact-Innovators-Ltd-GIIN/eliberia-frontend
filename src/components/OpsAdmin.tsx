"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Download, PlayCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { API, api, fmtDateTime, getToken, money } from "@/lib/api";

type Check = { key: string; label: string; ok: boolean; detail: Record<string, any> };
const HOW: Record<string, string> = {
  sms: "Set SMS_PROVIDER (africastalking or twilio) and its keys on Render.",
  payments: "Set the MTN_MOMO_* keys for MTN MoMo, and PAYMENT_PROVIDER=live with PAYMENT_WEBHOOK_SECRET for Orange Money / aggregators.",
  storage: "Set STORAGE_BACKEND=s3 and the STORAGE_S3_* settings (Cloudflare R2 has a free tier).",
  codes_hidden: "Once SMS works, set EXPOSE_OTP=False so codes are only sent by SMS.",
  demo_accounts: "Set BOOTSTRAP_ADMIN_PHONE / _NAME / _PASSWORD, sign in and change the password, then set DEMO_MODE=False.",
  data_key: "Set DATA_KEY to the CURRENT SECRET_KEY value so the key can never change by accident. If this check fails, restore the previous key.",
  backups: "Set TASKS_SECRET on Render and add the secrets listed in .github/workflows/daily.yml to the backend repository.",
  database: "Move to a paid or non-expiring PostgreSQL (Render paid, Neon or Supabase) before real use.",
};

/** What still stands between the pilot and real citizens. */
export function ReadinessPanel({ superAdmin }: { superAdmin: boolean }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [run, setRun] = useState<string>("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ checks: Check[] }>("/api/admin/system").then((r) => setChecks(r.checks)).catch(() => setChecks([])); }, []);
  const done = checks?.filter((c) => c.ok).length ?? 0;

  async function runDaily() {
    setBusy(true); setRun("");
    try {
      const r = await api<Record<string, number>>("/api/admin/tasks/daily", { method: "POST" });
      setRun(`Done: ${r.renewal_reminders} renewal reminders sent, ${r.expired_payments} stale payments closed, ${r.drafts_deleted} old drafts and ${r.notifications_deleted} old notifications deleted.`);
    } catch (e: any) { setRun(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-baseline justify-between"><h2 className="text-lg font-bold">Launch readiness</h2>
          {checks && <span className="text-sm font-semibold text-ink-500">{done} of {checks.length} ready</span>}</div>
        {checks && <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / Math.max(1, checks.length)) * 100}%` }} /></div>}
        <ul className="mt-4 space-y-2">
          {checks === null && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          {checks?.map((c) => (
            <li key={c.key} className={`flex gap-3 rounded-xl border p-3.5 ${c.ok ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/60"}`}>
              {c.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />}
              <div className="min-w-0">
                <div className="font-semibold">{c.label}</div>
                {!c.ok && <div className="text-sm text-ink-700">{HOW[c.key]}</div>}
                {!c.ok && c.detail?.missing?.length > 0 && <div className="mt-0.5 text-xs text-ink-500">Missing: {c.detail.missing.join(", ")}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card h-fit space-y-3">
        <h2 className="font-bold">Daily housekeeping</h2>
        <p className="muted">Sends renewal reminders, closes payments left pending for a day, and deletes drafts untouched for 90 days. It runs automatically once the scheduled job is set up.</p>
        {superAdmin ? <button className="btn btn-soft" onClick={runDaily} disabled={busy}><PlayCircle size={16} /> Run it now</button>
          : <p className="muted">Only a super administrator can run it by hand.</p>}
        {run && <p className="text-sm text-ink-700" role="status">{run}</p>}
      </aside>
    </section>
  );
}

type Row = { txn_ref: string; reference: string; bill_id: string; service: string; institution: string; applicant: string;
  method: string; provider: string; amount_usd: number; status: string; created_at: string; refund_reason?: string };
type Report = { from: string; to: string; count: number; totals: Record<string, number>; by_method: Record<string, number>; items: Row[] };
const METHOD: Record<string, string> = { orange_money: "Orange Money", mtn_momo: "MTN MoMo", agent_cash: "Agent cash", card: "Card", bank: "Bank" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Payments received, by method and status, with CSV export and refunds. */
export function PaymentsPanel() {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [status, setStatus] = useState("");
  const [rep, setRep] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [refunding, setRefunding] = useState<string>("");
  const [reason, setReason] = useState("");
  const qs = `from=${from}&to=${to}${status ? `&status=${status}` : ""}`;
  const load = useCallback(() => { setRep(null); api<Report>(`/api/staff/payments?${qs}`).then(setRep).catch((e) => { setError(e.message); setRep(null); }); }, [qs]);
  useEffect(() => { load(); }, [load]);

  async function csv() {
    setError("");
    try {
      const r = await fetch(`${API}/api/staff/payments?${qs}&format=csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error("Could not export the payments.");
      const a = document.createElement("a"); a.href = URL.createObjectURL(await r.blob()); a.download = `eliberia-payments-${from}-${to}.csv`; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) { setError(e.message); }
  }
  async function refund(ref: string) {
    setError("");
    try { await api(`/api/staff/payments/${ref}/refund`, { method: "POST", json: { reason } }); setRefunding(""); setReason(""); load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="pf">From</label><input id="pf" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="label" htmlFor="pt">To</label><input id="pt" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><label className="label" htmlFor="ps">Status</label>
          <select id="ps" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>{["success", "pending", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <button className="btn btn-ghost" onClick={csv}><Download size={16} /> Export CSV</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Received", rep?.totals.success], ["Pending", rep?.totals.pending], ["Refunded", rep?.totals.refunded], ["Failed", rep?.totals.failed]].map(([l, v]) => (
          <div key={String(l)} className="card !p-4"><div className="text-xs font-medium text-ink-500">{l}</div><div className="text-2xl font-extrabold">{rep ? money(Number(v || 0)).replace("Free", "$0.00") : "–"}</div></div>
        ))}
      </div>
      {rep && Object.keys(rep.by_method).length > 0 && (
        <p className="muted">Received by method: {Object.entries(rep.by_method).map(([m, v]) => `${METHOD[m] || m} ${money(v)}`).join(" · ")}</p>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {rep === null && !error && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}</div>}
        {rep?.count === 0 && <p className="muted p-5">No payments in this period.</p>}
        <ul className="divide-y divide-slate-100">
          {rep?.items.map((p) => (
            <li key={p.txn_ref} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.applicant} · {p.service}</div>
                  <div className="muted truncate font-mono text-xs">{p.txn_ref} · {p.reference} · {METHOD[p.method] || p.method} via {p.provider} · {fmtDateTime(p.created_at)}</div></div>
                <span className="font-bold">{money(p.amount_usd)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "success" ? "bg-emerald-50 text-emerald-800" : p.status === "refunded" ? "bg-violet-50 text-violet-700" : p.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-flag-50 text-flag-700"}`}>{p.status}</span>
                {p.status === "success" && refunding !== p.txn_ref && <button className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100" onClick={() => { setRefunding(p.txn_ref); setReason(""); }} aria-label={`Refund ${p.txn_ref}`} title="Refund"><RotateCcw size={15} /></button>}
              </div>
              {p.refund_reason && <p className="mt-1 text-xs text-violet-700">Refund reason: {p.refund_reason}</p>}
              {refunding === p.txn_ref && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input className="input max-w-sm" placeholder="Reason, e.g. Paid twice by mistake" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} aria-label="Refund reason" />
                  <button className="btn btn-red" disabled={reason.trim().length < 5} onClick={() => refund(p.txn_ref)}>Record refund</button>
                  <button className="btn btn-ghost" onClick={() => setRefunding("")}>Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="muted">Recording a refund marks it here and tells the citizen. Send the money back through the payment provider&apos;s merchant portal.</p>
    </section>
  );
}
