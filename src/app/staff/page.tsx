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
  const [member, setMember] = useState({ full_name: "", phone: "", password: "", role: "agent", institution_id: "" });
  const [insts, setInsts] = useState<{ id: number; name: string }[]>([]);
  const [memberMsg, setMemberMsg] = useState("");
  async function addMember(e: React.FormEvent) {
    e.preventDefault(); setMemberMsg("");
    try {
      const u = await api("/api/admin/officers", { method: "POST", json: { ...member, institution_id: member.institution_id ? Number(member.institution_id) : undefined } });
      setMemberMsg(`${u.full_name} added as ${u.role}.`); setMember({ ...member, full_name: "", phone: "", password: "" });
    } catch (e: any) { setMemberMsg(e.message); }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "officer" && user.role !== "admin") { router.push(user.role === "agent" ? "/agent" : "/dashboard"); return; }
    api("/api/admin/stats").then(setStats).catch(() => {});
    if (user.role === "admin") api("/api/institutions").then(setInsts).catch(() => {});
  }, [user, loading, router]);
  useEffect(() => {
    if (!user || (user.role !== "officer" && user.role !== "admin")) return;
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
      {user?.role === "admin" && (
        <form onSubmit={addMember} className="card space-y-3">
          <h2 className="font-bold">Add an agent or officer</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select className="input" value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })} aria-label="Role"><option value="agent">Agent</option><option value="officer">Officer</option></select>
            <input className="input" placeholder="Full name" value={member.full_name} onChange={(e) => setMember({ ...member, full_name: e.target.value })} required minLength={3} />
            <input className="input" placeholder="Phone (0770…)" inputMode="tel" value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} required />
            <input className="input" type="password" placeholder="Temporary password" autoComplete="new-password" value={member.password} onChange={(e) => setMember({ ...member, password: e.target.value })} required minLength={8} />
            {member.role === "officer"
              ? <select className="input" value={member.institution_id} onChange={(e) => setMember({ ...member, institution_id: e.target.value })} required aria-label="Institution"><option value="">Institution…</option>{insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
              : <button className="btn">Add agent</button>}
          </div>
          {member.role === "officer" && <button className="btn">Add officer</button>}
          {memberMsg && <p className="muted" role="status">{memberMsg}</p>}
        </form>
      )}
    </div>
  );
}
