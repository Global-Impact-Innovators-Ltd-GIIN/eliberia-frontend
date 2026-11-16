"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, ChevronRight, Clock3, FilePlus2, HandHelping, Search, ShieldCheck, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { CategoryIcon, Skeleton, StatusBadge } from "@/components/ui";
import { api, Application, fmtDate, money, Service } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Citizen = { id: number; full_name: string; phone: string; nin?: string; expires_at?: string };
type Stats = { assisted_total: number; assisted_today: number; drafts: number; citizens: number; commission_usd: number; commission_rate_usd: number };

export default function AgentDesk() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [active, setActive] = useState<Citizen[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [awaiting, setAwaiting] = useState<Citizen | null>(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [serving, setServing] = useState<Citizen | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    api<Stats>("/api/agent/stats").then(setStats).catch(() => {});
    api<Application[]>("/api/agent/applications").then(setApps).catch(() => setApps([]));
    api<Citizen[]>("/api/agent/citizens").then(setActive).catch(() => {});
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "agent") { router.push(user.role === "citizen" ? "/dashboard" : "/staff"); return; }
    refresh();
    api<Service[]>("/api/services").then(setServices).catch(() => {});
  }, [user, loading, router, refresh]);

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); } catch (e: any) { setError(e.message); if (e.data?.needs_name) setNeedsName(true); } finally { setBusy(false); }
  }
  const start = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api("/api/agent/citizens/start", { method: "POST", json: { phone, full_name: needsName ? name : undefined } });
    setAwaiting(r.citizen); setDevOtp(r.dev_otp || ""); setOtp("");
    setInfo(r.created ? `${r.citizen.full_name} was registered. ${r.message}` : r.message);
  }); };
  const consent = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api("/api/agent/citizens/consent", { method: "POST", json: { phone: awaiting!.phone, otp } });
    setServing({ ...r.citizen, expires_at: r.expires_at }); setAwaiting(null); setPhone(""); setName(""); setNeedsName(false); setDevOtp("");
    setInfo(`Consent confirmed. You can now apply for ${r.citizen.full_name}.`); refresh();
  }); };
  const apply = (code: string) => run(async () => {
    const a = await api("/api/applications", { method: "POST", json: { service_code: code, citizen_id: serving!.id } });
    router.push(`/applications/${a.id}`);
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return services.filter((s) => !t || `${s.name} ${s.category} ${s.institution.name}`.toLowerCase().includes(t)).slice(0, t ? 14 : 6);
  }, [services, q]);
  const cards = [
    { icon: UserRoundCheck, label: "Served today", value: stats?.assisted_today, tint: "bg-navy-50 text-navy-800" },
    { icon: Users, label: "Citizens helped", value: stats?.citizens, tint: "bg-indigo-50 text-indigo-700" },
    { icon: Clock3, label: "Unfinished drafts", value: stats?.drafts, tint: "bg-amber-50 text-amber-700" },
    { icon: BadgeDollarSign, label: "Commission earned", value: stats ? money(stats.commission_usd).replace("Free", "$0.00") : undefined, tint: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="eyebrow">Agent desk</div><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{user?.full_name || "…"}</h1></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"><ShieldCheck size={14} /> Authorised eLiberia agent</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-3 !p-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.tint}`}><c.icon size={21} /></span>
            <div><div className="text-2xl font-extrabold leading-none">{c.value ?? "–"}</div><div className="mt-1 text-xs font-medium text-ink-500">{c.label}</div></div>
          </div>
        ))}
      </div>
      {error && <div className="alert alert-error mt-5" role="alert">{error}</div>}
      {info && <div className="alert alert-ok mt-5" role="status">{info}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="space-y-5 lg:col-span-3">
          {!serving ? (
            <div className="card">
              <h2 className="flex items-center gap-2 text-lg font-bold"><HandHelping size={20} /> Serve a citizen</h2>
              <p className="muted mt-1">The citizen must be with you. They will receive a code on their own phone and read it to you - that is their permission.</p>
              {!awaiting ? (
                <form onSubmit={start} className="mt-5 space-y-4">
                  <div>
                    <label className="label" htmlFor="cphone">Citizen&apos;s phone number</label>
                    <div className="flex">
                      <span className="flex items-center rounded-l-xl border border-r-0 border-ink-300 bg-slate-50 px-3 text-sm font-medium text-ink-700">+231</span>
                      <input id="cphone" className="input !rounded-l-none" inputMode="tel" placeholder="770 000 000" value={phone} onChange={(e) => { setPhone(e.target.value); setNeedsName(false); }} required />
                    </div>
                  </div>
                  {needsName && (
                    <div className="animate-rise">
                      <label className="label" htmlFor="cname">Citizen&apos;s full name <span className="font-normal text-ink-500">(new to eLiberia)</span></label>
                      <input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={3} required autoFocus />
                    </div>
                  )}
                  <button className="btn btn-lg" disabled={busy}>{needsName ? <><UserPlus size={18} /> Register and send code</> : <><Search size={18} /> Find citizen</>}</button>
                </form>
              ) : (
                <form onSubmit={consent} className="mt-5 space-y-4">
                  <div className="rounded-xl bg-navy-50 p-4"><div className="font-semibold">{awaiting.full_name}</div><div className="muted">{awaiting.phone}</div></div>
                  {devOtp && <div className="alert alert-warn">Pilot mode (no SMS gateway yet) - the citizen&apos;s code is <b className="tracking-widest">{devOtp}</b></div>}
                  <div>
                    <label className="label" htmlFor="ccode">Consent code read out by the citizen</label>
                    <input id="ccode" className="input h-14 text-center text-2xl font-bold tracking-[0.5em]" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required autoFocus />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-lg" disabled={busy || otp.length !== 6}>Confirm consent</button>
                    <button type="button" className="btn btn-ghost btn-lg" onClick={() => { setAwaiting(null); setInfo(""); }}>Cancel</button>
                  </div>
                </form>
              )}
              {!!active.length && !awaiting && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-ink-700">Continue with someone you are already helping</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {active.map((c) => <button key={c.id} className="chip" onClick={() => { setServing(c); setInfo(""); }}>{c.full_name}</button>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-900 p-4 text-white">
                <div><div className="text-xs text-navy-200">Now serving</div><div className="text-lg font-bold">{serving.full_name}</div><div className="text-sm text-navy-200">{serving.phone}</div></div>
                <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20" onClick={() => { setServing(null); setQ(""); }}>Finish</button>
              </div>
              <h2 className="mt-5 flex items-center gap-2 font-bold"><FilePlus2 size={18} /> Start an application for them</h2>
              <div className="relative mt-3">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                <input className="input !pl-10" placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search services" />
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {filtered.map((s) => (
                  <li key={s.code}>
                    <button disabled={busy} onClick={() => apply(s.code)} className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition hover:bg-slate-50">
                      <CategoryIcon category={s.category} size={38} />
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{s.name}</span><span className="muted block truncate">{s.institution.name}</span></span>
                      <span className="text-sm font-bold text-navy-800">{money(s.fee_usd)}</span>
                      <ChevronRight size={17} className="text-ink-500" />
                    </button>
                  </li>
                ))}
                {!filtered.length && <li className="muted py-3">No services match.</li>}
              </ul>
            </div>
          )}
        </section>

        <aside className="lg:col-span-2">
          <h2 className="mb-3 font-bold">Applications you assisted</h2>
          {apps === null && <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
          {apps?.length === 0 && <div className="card muted">Nothing yet. Applications you start for citizens appear here.</div>}
          <div className="space-y-3">
            {apps?.map((a) => (
              <Link key={a.id} href={`/applications/${a.id}`} className="card card-hover flex items-center gap-3 !p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.applicant.full_name}</div>
                  <div className="muted truncate">{a.service.name} · {fmtDate(a.created_at)}</div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
          {stats && <p className="muted mt-4">Commission is {money(stats.commission_rate_usd)} per submitted application (illustrative pilot rate).</p>}
        </aside>
      </div>
    </div>
  );
}
