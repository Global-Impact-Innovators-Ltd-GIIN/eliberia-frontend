"use client";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { api, AppEvent } from "@/lib/api";

export default function Track() {
  const [ref, setRef] = useState("");
  const [res, setRes] = useState<{ reference: string; service: string; status: string; events: AppEvent[] } | null>(null);
  const [error, setError] = useState("");

  async function go(e: React.FormEvent) {
    e.preventDefault(); setError(""); setRes(null);
    try { setRes(await api(`/api/applications/track/${encodeURIComponent(ref.trim())}`)); }
    catch (e: any) { setError(e.message); }
  }
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Track an application</h1>
      <form onSubmit={go} className="flex gap-2">
        <input className="input" placeholder="e.g. LR-2611-AB12CD" value={ref} onChange={(e) => setRef(e.target.value)} required />
        <button className="btn">Track</button>
      </form>
      {error && <p className="text-red-700">{error}</p>}
      {res && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between"><b>{res.service}</b><StatusBadge status={res.status} /></div>
          <Timeline events={res.events} />
        </div>
      )}
    </div>
  );
}
