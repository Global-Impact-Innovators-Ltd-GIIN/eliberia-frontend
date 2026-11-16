"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlarmClock, Building2, ChevronRight, CircleDollarSign, FolderOpen, Hourglass, Inbox, Landmark, LayoutList, ScrollText, Search, Users } from "lucide-react";
import { InstitutionProfile, InstitutionsPanel, TeamPanel } from "@/components/OrgAdmin";
import ServiceAdmin from "@/components/ServiceAdmin";
import { Skeleton, StatusBadge } from "@/components/ui";
import { api, Application, can, fmtDate, fmtDateTime, Institution, isReviewer, STATUS_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Stats = { total: number; overdue: number; by_status: Record<string, number>; by_service?: { name: string; count: number }[]; users?: number; institutions?: number; revenue_usd?: number };
type Audit = { id: number; user_id: number | null; action: string; detail: string; ip: string; created_at: string };
type View = "queue" | "services" | "institutions" | "team" | "profile" | "audit";
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
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [insts, setInsts] = useState<Institution[]>([]);
  const [mine, setMine] = useState<Institution | null>(null);
  const [audit, setAudit] = useState<Audit[] | null>(null);

  const role = user?.role;
  const isAdmin = role === "admin";
  const isInstAdmin = role === "inst_admin";
  const views = useMemo(() => {
    const v: [View, string, any][] = [];
    if (!isReviewer(role)) return v;
    if (!isAdmin || can(user, "support")) v.push(["queue", "Applications", Inbox]);
    if (isInstAdmin || can(user, "services")) v.push(["services", "Services", LayoutList]);
    if (isAdmin) v.push(["institutions", "Institutions", Landmark]);
    if (isInstAdmin || can(user, "team")) v.push(["team", "Team", Users]);
    if (isInstAdmin) v.push(["profile", "Our institution", Building2]);
    if (can(user, "audit")) v.push(["audit", "Audit log", ScrollText]);
    return v;
  }, [user, role, isAdmin, isInstAdmin]);
  const active: View | null = view && views.some(([v]) => v === view) ? view : views[0]?.[0] ?? null;
  const loadInsts = useCallback(() => api<Institution[]>("/api/institutions").then(setInsts).catch(() => {}), []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!isReviewer(user.role)) { router.push(user.role === "agent" ? "/agent" : "/dashboard"); return; }
    api<Stats>("/api/admin/stats").then(setStats).catch(() => {});
    if (user.role === "admin") loadInsts();
    else api<Institution>("/api/institution/profile").then(setMine).catch(() => {});
  }, [user, loading, router, loadInsts]);
  useEffect(() => {
    if (active !== "queue") return;
    setApps(null);
    api<Application[]>(`/api/staff/applications?status=${status}`).then((r) => { setApps(r); setError(""); }).catch((e) => { setError(e.message); setApps([]); });
  }, [active, status]);
  useEffect(() => {
    if (active === "audit" && audit === null) api<Audit[]>("/api/admin/audit").then(setAudit).catch(() => setAudit([]));
  }, [active, audit]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (apps || []).filter((a) => !t || `${a.reference} ${a.applicant.full_name} ${a.applicant.phone} ${a.service.name}`.toLowerCase().includes(t));
  }, [apps, q]);
  const by = stats?.by_status || {};
  const cards = [
    { icon: Inbox, label: "Awaiting review", value: by.submitted || 0, tint: "bg-blue-50 text-blue-700" },
    { icon: Hourglass, label: "In review", value: by.in_review || 0, tint: "bg-indigo-50 text-indigo-700" },
    { icon: AlarmClock, label: "Overdue", value: stats?.overdue ?? 0, tint: stats?.overdue ? "bg-flag-50 text-flag-700" : "bg-emerald-50 text-emerald-700" },
    stats?.revenue_usd !== undefined ? { icon: CircleDollarSign, label: "Fees collected", value: `$${stats.revenue_usd.toFixed(2)}`, tint: "bg-emerald-50 text-emerald-700" }
      : { icon: FolderOpen, label: "All applications", value: stats?.total ?? 0, tint: "bg-navy-50 text-navy-800" },
  ];
  const tabCount = (s: string) => (s === "" ? (stats ? stats.total - (by.draft || 0) : undefined) : by[s] || 0);
  const top = stats?.by_service || [];
  const max = Math.max(1, ...top.map((x) => x.count));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">{isAdmin ? "eLiberia admin console" : "Institution portal"}</div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{isAdmin ? user?.full_name : mine?.name || "…"}</h1>
          <p className="muted mt-0.5">{isAdmin ? (can(user, "all") ? "Super administrator - all areas" : `Administrator - ${(user?.perms || []).join(", ")}`)
            : `${user?.full_name} · ${isInstAdmin ? "Institution administrator" : "Reviewing officer"}`}</p>
        </div>
        {views.length > 1 && (
          <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
            {views.map(([v, l, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={active === v} className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition ${active === v ? "bg-navy-800 text-white" : "text-ink-700 hover:bg-slate-100"}`}><Icon size={15} /> {l}</button>
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

      {active === "queue" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {TABS.map((s) => (
                <button key={s} className={`chip ${status === s ? "chip-on" : ""}`} onClick={() => setStatus(s)}>
                  {s ? STATUS_LABEL[s] : "All active"}
                  {tabCount(s) !== undefined && <span className={`rounded-full px-1.5 text-xs ${status === s ? "bg-white/20" : "bg-slate-100 text-ink-500"}`}>{tabCount(s)}</span>}
                </button>
              ))}
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
                        <div className="order-3 col-span-2 min-w-0 md:order-none md:col-span-1"><div className="truncate text-sm font-medium">{a.service.name}</div><div className="muted truncate font-mono text-xs">{a.reference}{isAdmin ? ` · ${a.service.institution}` : ""}</div></div>
                        <div className={`order-4 text-sm md:order-none ${d.late ? "font-semibold text-flag-700" : "text-ink-700"}`}>{d.text}</div>
                        <div className="justify-self-end text-right"><StatusBadge status={a.status} />
                          {a.status === "in_review" && a.stage && a.stage.total > 1 && <div className="mt-1 text-[11px] font-medium text-ink-500">Stage {a.stage.index + 1}/{a.stage.total} · {a.stage.name}</div>}</div>
                        <ChevronRight size={17} className="hidden text-ink-500 md:block" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <aside className="card h-fit">
            <h2 className="font-bold">Most requested</h2>
            <ul className="mt-3 space-y-3">
              {top.map((x) => (
                <li key={x.name} className="text-sm">
                  <div className="flex justify-between gap-2"><span className="truncate">{x.name}</span><b>{x.count}</b></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-navy-800" style={{ width: `${(x.count / max) * 100}%` }} /></div>
                </li>
              ))}
              {!top.length && <li className="muted">No submissions yet.</li>}
            </ul>
            {isAdmin && stats && <p className="muted mt-4 border-t border-slate-100 pt-3">{stats.users ?? 0} citizens · {stats.institutions ?? 0} institutions</p>}
          </aside>
        </section>
      )}

      {active === "services" && <ServiceAdmin insts={insts} scope={isAdmin ? "admin" : "institution"} />}
      {active === "institutions" && <InstitutionsPanel canEdit={can(user, "institutions")} onChange={loadInsts} />}
      {active === "team" && <TeamPanel scope={isAdmin ? "admin" : "institution"} insts={insts} superAdmin={can(user, "all")} />}
      {active === "profile" && <InstitutionProfile />}

      {active === "audit" && (
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

      {!views.length && isReviewer(role) && <div className="alert alert-warn mt-6">Your administrator account has no areas assigned yet. Ask a super administrator to grant you access.</div>}
    </div>
  );
}
