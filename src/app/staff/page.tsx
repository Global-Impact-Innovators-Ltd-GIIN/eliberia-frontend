"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api, Application } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Staff() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role === "citizen") { router.push("/login"); return; }
    api("/api/admin/stats").then(setStats).catch(() => {});
  }, [user, loading, router]);
  useEffect(() => {
    if (!user || user.role === "citizen") return;
    api<Application[]>(`/api/staff/applications?status=${status}`).then(setApps).catch((e) => setError(e.message));
  }, [user, status]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Staff desk</h1>
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="card"><div className="text-sm text-slate-500">Total</div><div className="text-2xl font-bold">{stats.total}</div></div>
          <div className="card"><div className="text-sm text-slate-500">In review</div><div className="text-2xl font-bold">{stats.by_status.in_review || 0}</div></div>
          <div className="card"><div className="text-sm text-slate-500">Overdue (SLA)</div><div className="text-2xl font-bold text-lib-red">{stats.overdue}</div></div>
          {stats.revenue_usd !== undefined && <div className="card"><div className="text-sm text-slate-500">Revenue</div><div className="text-2xl font-bold">${stats.revenue_usd}</div></div>}
        </div>
      )}
      <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All active</option>
        {["submitted", "in_review", "info_requested", "biometric_pending", "approved", "rejected", "ready_for_collection", "completed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
      {error && <p className="text-red-700">{error}</p>}
      <div className="space-y-2">
        {apps.map((a) => (
          <Link key={a.id} href={`/staff/${a.id}`} className="card flex items-center justify-between hover:border-lib-blue">
            <div><div className="font-semibold">{a.service.name}</div>
              <div className="text-xs text-slate-500">{a.reference} · {a.applicant.full_name} · due {a.due_at ? new Date(a.due_at).toLocaleDateString() : "-"}</div></div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
        {!apps.length && <p className="text-slate-500">Nothing in the queue.</p>}
      </div>
    </div>
  );
}
