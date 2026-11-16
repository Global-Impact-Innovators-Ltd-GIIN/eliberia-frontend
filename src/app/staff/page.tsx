"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlarmClock, ChevronRight, CircleDollarSign, FolderOpen, Hourglass, Inbox, LayoutList, ScrollText, Search, UserPlus, Users } from "lucide-react";
import ServiceAdmin from "@/components/ServiceAdmin";
import { Skeleton, StatusBadge } from "@/components/ui";
import { api, Application, fmtDate, fmtDateTime, STATUS_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Stats = { total: number; overdue: number; by_status: Record<string, number>; users?: number; revenue_usd?: number };
type Audit = { id: number; user_id: number | null; action: string; detail: string; ip: string; created_at: string };
const TABS = ["", "submitted", "in_review", "info_requested", "biometric_pending", "approved", "ready_for_collection", "completed", "rejected"];
const OPEN = ["submitted", "in_review"];

function dueInfo(a: Application) {
  if (!a.due_at || !OPEN.includes(a.status)) return { text: fmtDate(a.due_at), late: false };
  const days = Math.ceil((new Date(a.due_at + "Z").getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: `${-days} day${days === -1 ? "" : "s"} overdue`, late: true };
  return { text: days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`, late: false };
}

export default function Staff() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"queue" | "services" | "team" | "audit">("queue");
  const [error, setError] = useState("");
  const [member, setMember] = useState({ full_name: "", phone: "", password: "", role: "agent", institution_id: "" });
  const [insts, setInsts] = useState<{ id: number; name: string }[]>([]);
  const [memberMsg, setMemberMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [audit, setAudit] = useState<Audit[] | null>(null);
  const isStaff = user && (user.role === "officer" || user.role === "admin");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "officer" && user.role !== "admin") { router.push(user.role === "agent" ? "/agent" : "/dashboard"); return; }
    api<Stats>("/api/admin/stats").then(setStats).catch(() => {});
    if (user.role === "admin") api("/api/institutions").then(setInsts).catch(() => {});
  }, [user, loading, router]);
  useEffect(() => {
    if (!isStaff) return;
    setApps(null);
    api<Application[]>(`/api/staff/applications?status=${status}`).then((r) => { setApps(r); setError(""); }).catch((e) => { setError(e.message); setApps([]); });
  }, [isStaff, status]);
  useEffect(() => {
    if (view === "audit" && isAdmin && audit === null) api<Audit[]>("/api/admin/audit").then(setAudit).catch(() => setAudit([]));
  }, [view, isAdmin, audit]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault(); setMemberMsg(null);
    try {
      const u = await api("/api/admin/officers", { method: "POST", json: { ...member, institution_id: member.institution_id ? Number(member.institution_id) : undefined } });
      setMemberMsg({ ok: true, text: `${u.full_name} was added as ${u.role === "agent" ? "an agent" : "an officer"}. Share the temporary password with them privately.` });
      setMember({ ...member, full_name: "", phone: "", password: "" });
    } catch (e: any) { setMemberMsg({ ok: false, text: e.message }); }
  }

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (apps || []).filter((a) => !t || `${a.reference} ${a.applicant.full_name} ${a.applicant.phone} ${a.service.name}`.toLowerCase().includes(t));
  }, [apps, q]);
  const by = stats?.by_status || {};
  const cards = [
    { icon: Inbox, label: "Awaiting review", value: by.submitted || 0, tint: "bg-blue-50 text-blue-700" },
    { icon: Hourglass, label: "In review", value: by.in_review || 0, tint: "bg-indigo-50 text-indigo-700" },
    { icon: AlarmClock, label: "Overdue", value: stats?.overdue ?? 0, tint: stats?.overdue ? "bg-flag-50 text-flag-700" : "bg-emerald-50 text-emerald-700" },
    isAdmin ? { icon: CircleDollarSign, label: "Fees collected", value: `$${(stats?.revenue_usd ?? 0).toFixed(2)}`, tint: "bg-emerald-50 text-emerald-700" }
      : { icon: FolderOpen, label: "All applications", value: stats?.total ?? 0, tint: "bg-navy-50 text-navy-800" },
  ];
  const tabCount = (s: string) => (s === "" ? (stats ? stats.total - (by.draft || 0) : undefined) : by[s] || 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="eyebrow">{isAdmin ? "Administration" : "Staff desk"}</div><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{user?.full_name || "…"}</h1></div>
        {isAdmin && (
          <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
            {([["queue", "Queue", Inbox], ["services", "Services", LayoutList], ["team", "Team", Users], ["audit", "Audit log", ScrollText]] as const).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${view === v ? "bg-navy-800 text-white" : "text-ink-700 hover:bg-slate-100"}`}><Icon size={15} /> {l}</button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-3 !p-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.tint}`}><c.icon size={21} /></span>
            <div><div className="text-2xl font-extrabold leading-none">{stats ? c.value : "–"}</div><div className="mt-1 text-xs font-medium text-ink-500">{c.label}</div></div>
          </div>
        ))}
      </div>

      {view === "queue" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {TABS.map((s) => (
                <button key={s} className={`chip ${status === s ? "chip-on" : ""}`} onClick={() => setStatus(s)}>
                  {s ? STATUS_LABEL[s] : "All active"}
                  {tabCount(s) !== undefined && <span className={`rounded-full px-1.5 text-xs ${status === s ? "bg-white/20" : "bg-slate-100 text-ink-500"}`}>{tabCount(s)}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-4 max-w-md">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input className="input !pl-10" placeholder="Search by reference, name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" />
          </div>
          {error && <div className="alert alert-error mt-4">{error}</div>}
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="hidden grid-cols-[1.4fr_1.6fr_1fr_auto_24px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500 md:grid">
              <span>Applicant</span><span>Service</span><span>Deadline</span><span>Status</span><span />
            </div>
            {apps === null && <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
            {apps !== null && !list.length && (
              <div className="p-10 text-center"><Inbox className="mx-auto text-ink-500" size={34} /><p className="mt-2 font-semibold">{q ? "No applications match your search" : "Nothing in this queue"}</p><p className="muted">{q ? "Try a different reference or name." : "New submissions will appear here."}</p></div>
            )}
            <ul className="divide-y divide-slate-100">
              {list.map((a) => {
                const d = dueInfo(a);
                return (
                  <li key={a.id}>
                    <Link href={`/staff/${a.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition hover:bg-navy-50/50 md:grid-cols-[1.4fr_1.6fr_1fr_auto_24px]">
                      <div className="min-w-0"><div className="truncate font-semibold">{a.applicant.full_name}</div><div className="muted truncate">{a.applicant.phone}{a.assisted ? " · agent assisted" : ""}</div></div>
                      <div className="order-3 col-span-2 min-w-0 md:order-none md:col-span-1"><div className="truncate text-sm font-medium">{a.service.name}</div><div className="muted truncate font-mono text-xs">{a.reference}</div></div>
                      <div className={`order-4 text-sm md:order-none ${d.late ? "font-semibold text-flag-700" : "text-ink-700"}`}>{d.text}</div>
                      <div className="justify-self-end"><StatusBadge status={a.status} /></div>
                      <ChevronRight size={17} className="hidden text-ink-500 md:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {view === "team" && isAdmin && (
        <form onSubmit={addMember} className="card mt-6 max-w-2xl space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus size={19} /> Add a team member</h2>
          <p className="muted">Agents serve citizens in person. Officers review applications for one institution.</p>
          <div className="grid grid-cols-2 gap-2">
            {(["agent", "officer"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setMember({ ...member, role: r })} aria-pressed={member.role === r}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${member.role === r ? "border-navy-800 bg-navy-50 text-navy-800" : "border-ink-300 text-ink-700 hover:border-navy-400"}`}>{r}</button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="mn">Full name</label><input id="mn" className="input" value={member.full_name} onChange={(e) => setMember({ ...member, full_name: e.target.value })} required minLength={3} /></div>
            <div><label className="label" htmlFor="mp">Phone number</label><input id="mp" className="input" inputMode="tel" placeholder="0770 000 000" value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} required /></div>
            <div><label className="label" htmlFor="mw">Temporary password</label><input id="mw" className="input" type="password" autoComplete="new-password" value={member.password} onChange={(e) => setMember({ ...member, password: e.target.value })} required minLength={8} /><p className="mt-1 text-xs text-ink-500">8+ characters with letters and numbers.</p></div>
            {member.role === "officer" && (
              <div><label className="label" htmlFor="mi">Institution</label>
                <select id="mi" className="input" value={member.institution_id} onChange={(e) => setMember({ ...member, institution_id: e.target.value })} required>
                  <option value="">Choose…</option>{insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select></div>
            )}
          </div>
          {memberMsg && <div className={`alert ${memberMsg.ok ? "alert-ok" : "alert-error"}`} role="status">{memberMsg.text}</div>}
          <button className="btn">Add {member.role}</button>
        </form>
      )}

      {view === "services" && isAdmin && <ServiceAdmin insts={insts} />}

      {view === "audit" && isAdmin && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-semibold">Last 200 recorded actions</div>
          {audit === null && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9" />)}</div>}
          {audit?.length === 0 && <p className="muted p-5">No activity recorded yet.</p>}
          <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto text-sm">
            {audit?.map((r) => (
              <li key={r.id} className="grid grid-cols-[1fr_auto] gap-x-4 px-5 py-2.5 sm:grid-cols-[11rem_1fr_auto]">
                <span className="font-semibold">{r.action.replace(/_/g, " ")}</span>
                <span className="order-3 col-span-2 truncate text-ink-700 sm:order-none sm:col-span-1">{r.detail || "—"}</span>
                <span className="text-right text-xs text-ink-500">{fmtDateTime(r.created_at)} · {r.ip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
