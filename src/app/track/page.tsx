"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Timeline from "@/components/Timeline";
import { StatusBadge } from "@/components/ui";
import { api, AppEvent, fmtDate, money } from "@/lib/api";

type Res = { reference: string; service: string; institution: string; status: string; paid: boolean; fee_usd: number; due_at: string | null; events: AppEvent[] };

export default function Track() {
  const [ref, setRef] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault(); setError(""); setRes(null); setBusy(true);
    try { setRes(await api(`/api/applications/track/${encodeURIComponent(ref.trim())}`)); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <div className="eyebrow">Find applications</div>
          <h1 className="mt-1 text-3xl font-extrabold">Track an application</h1>
          <p className="muted mt-2">Enter the application reference or the bill ID. No sign-in needed.</p>
        </div>
        <form onSubmit={go} className="mt-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          <input className="w-full bg-transparent px-3 py-2 font-mono text-base uppercase placeholder:font-sans placeholder:normal-case focus:outline-none" placeholder="e.g. LR-2611-AB12CD or 880012345678" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference or bill ID" required />
          <button className="btn btn-lg shrink-0" disabled={busy}><Search size={17} /> Track</button>
        </form>
        {error && <div className="alert alert-error mt-4" role="alert">{error}</div>}
        {res && (
          <div className="card mt-6 animate-rise space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-lg font-bold">{res.service}</div><div className="muted">{res.institution} · {res.reference}</div></div>
              <StatusBadge status={res.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-ink-500">Payment</div><div className="font-semibold">{res.fee_usd > 0 ? `${money(res.fee_usd)} · ${res.paid ? "paid" : "unpaid"}` : "Free"}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-ink-500">Expected by</div><div className="font-semibold">{fmtDate(res.due_at)}</div></div>
            </div>
            <Timeline events={res.events} />
          </div>
        )}
      </div>
    </div>
  );
}
