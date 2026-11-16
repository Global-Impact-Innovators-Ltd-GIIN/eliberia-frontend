"use client";
import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, ShieldCheck, UserPlus, X } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { api, Institution, User } from "@/lib/api";

type Member = User & { institution?: string | null };
const ROLE_LABEL: Record<string, string> = { admin: "Platform admin", inst_admin: "Institution admin", officer: "Officer", agent: "Agent" };
const PERMS: [string, string, string][] = [
  ["services", "Service catalog", "Add and edit services for any institution"],
  ["institutions", "Institutions", "Onboard institutions and edit their profiles"],
  ["team", "Team", "Add agents, officers and institution admins"],
  ["support", "Citizen support", "Open applications and reply to citizens"],
  ["finance", "Finance", "See fees collected"],
  ["audit", "Audit log", "See the record of every action"],
];
type Msg = { ok: boolean; text: string } | null;

/** Team list and "add member" form. Platform admins can add every role; an institution admin adds its own officers. */
export function TeamPanel({ scope, insts, superAdmin }: { scope: "admin" | "institution"; insts: Institution[]; superAdmin?: boolean }) {
  const [rows, setRows] = useState<Member[] | null>(null);
  const [m, setM] = useState({ full_name: "", phone: "", password: "", role: scope === "admin" ? "agent" : "officer", institution_id: "", perms: [] as string[] });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const listUrl = scope === "admin" ? "/api/admin/team" : "/api/institution/team";
  const load = useCallback(() => api<Member[]>(listUrl).then(setRows).catch(() => setRows([])), [listUrl]);
  useEffect(() => { load(); }, [load]);
  const roles = scope === "admin" ? ["agent", "officer", "inst_admin", ...(superAdmin ? ["admin"] : [])] : ["officer"];
  const needsInst = m.role === "officer" || m.role === "inst_admin";

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const u = await api<User>(scope === "admin" ? "/api/admin/officers" : "/api/institution/team",
        { method: "POST", json: { ...m, institution_id: m.institution_id ? Number(m.institution_id) : undefined } });
      setMsg({ ok: true, text: `${u.full_name} was added as ${ROLE_LABEL[u.role].toLowerCase()}. Share the temporary password with them privately; they will confirm each sign-in with an SMS code.` });
      setM({ ...m, full_name: "", phone: "", password: "" }); await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-5">
      <form onSubmit={add} className="card space-y-4 lg:col-span-2 lg:self-start">
        <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus size={19} /> Add a team member</h2>
        {roles.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button key={r} type="button" onClick={() => setM({ ...m, role: r })} aria-pressed={m.role === r}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${m.role === r ? "border-navy-800 bg-navy-50 text-navy-800" : "border-ink-300 text-ink-700 hover:border-navy-400"}`}>{ROLE_LABEL[r]}</button>
            ))}
          </div>
        )}
        <div><label className="label" htmlFor="mn">Full name</label><input id="mn" className="input" value={m.full_name} onChange={(e) => setM({ ...m, full_name: e.target.value })} required minLength={3} /></div>
        <div><label className="label" htmlFor="mp">Phone number</label><input id="mp" className="input" inputMode="tel" placeholder="0770 000 000" value={m.phone} onChange={(e) => setM({ ...m, phone: e.target.value })} required /></div>
        <div><label className="label" htmlFor="mw">Temporary password</label><input id="mw" className="input" type="password" autoComplete="new-password" value={m.password} onChange={(e) => setM({ ...m, password: e.target.value })} required minLength={8} /><p className="mt-1 text-xs text-ink-500">8+ characters with letters and numbers.</p></div>
        {scope === "admin" && needsInst && (
          <div><label className="label" htmlFor="mi">Institution</label>
            <select id="mi" className="input" value={m.institution_id} onChange={(e) => setM({ ...m, institution_id: e.target.value })} required>
              <option value="">Choose…</option>{insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></div>
        )}
        {m.role === "admin" && (
          <fieldset>
            <legend className="label">What this administrator may do</legend>
            <div className="space-y-2">
              {PERMS.map(([k, l, hint]) => (
                <label key={k} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-800" checked={m.perms.includes(k)}
                    onChange={(e) => setM({ ...m, perms: e.target.checked ? [...m.perms, k] : m.perms.filter((x) => x !== k) })} />
                  <span><b>{l}</b><span className="block text-xs text-ink-500">{hint}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role="status">{msg.text}</div>}
        <button className="btn" disabled={busy}>Add {ROLE_LABEL[m.role].toLowerCase()}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:col-span-3 lg:self-start">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-semibold">{rows?.length ?? "…"} team members</div>
        {rows === null && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}</div>}
        <ul className="max-h-[36rem] divide-y divide-slate-100 overflow-y-auto">
          {rows?.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-bold text-navy-800">{u.full_name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}</span>
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{u.full_name}</div>
                <div className="muted truncate">{u.phone}{u.institution ? ` · ${u.institution}` : ""}{u.role === "admin" ? ` · ${u.perms?.includes("all") ? "all areas" : (u.perms || []).join(", ")}` : ""}</div></div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-flag-50 text-flag-700" : u.role === "inst_admin" ? "bg-violet-50 text-violet-700" : u.role === "agent" ? "bg-emerald-50 text-emerald-800" : "bg-navy-50 text-navy-800"}`}>{ROLE_LABEL[u.role]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function InstitutionForm({ value, onSave, onCancel, withIdentity }: {
  value: Partial<Institution>; withIdentity?: boolean; onCancel?: () => void;
  onSave: (v: Partial<Institution>) => Promise<void>;
}) {
  const [v, setV] = useState<Partial<Institution>>(value);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await onSave(v); setMsg({ ok: true, text: "Saved. Applicants see this on every one of your services." }); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="card space-y-4">
      {withIdentity && (
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div><label className="label" htmlFor="ic">Short code</label><input id="ic" className="input font-mono uppercase" placeholder="MOA" value={v.code || ""} onChange={(e) => setV({ ...v, code: e.target.value })} required minLength={2} maxLength={20} disabled={!!value.id} /></div>
          <div><label className="label" htmlFor="in">Official name</label><input id="in" className="input" placeholder="Ministry of Agriculture" value={v.name || ""} onChange={(e) => setV({ ...v, name: e.target.value })} required minLength={3} /></div>
        </div>
      )}
      <div><label className="label" htmlFor="id">What the institution does</label><input id="id" className="input" value={v.description || ""} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={500} /></div>
      <div><label className="label" htmlFor="ig">Guidelines for applicants</label>
        <textarea id="ig" className="input" rows={5} placeholder={"How your office works, e.g.\n- Documents must be in English or carry a certified translation\n- Bring the originals when you collect your certificate"} value={v.guidelines || ""} onChange={(e) => setV({ ...v, guidelines: e.target.value })} maxLength={2000} />
        <p className="mt-1 text-xs text-ink-500">Shown on each service page before a citizen starts.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="ip">Help-desk phone</label><input id="ip" className="input" inputMode="tel" value={v.contact_phone || ""} onChange={(e) => setV({ ...v, contact_phone: e.target.value })} /></div>
        <div><label className="label" htmlFor="ie">Help-desk email</label><input id="ie" type="email" className="input" value={v.contact_email || ""} onChange={(e) => setV({ ...v, contact_email: e.target.value })} /></div>
      </div>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role="status">{msg.text}</div>}
      <div className="flex gap-2"><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Close</button>}</div>
    </form>
  );
}

/** The institution's own profile: its guidelines and help-desk contacts. */
export function InstitutionProfile() {
  const [inst, setInst] = useState<Institution | null>(null);
  useEffect(() => { api<Institution>("/api/institution/profile").then(setInst).catch(() => {}); }, []);
  if (!inst) return <Skeleton className="mt-6 h-72" />;
  return (
    <div className="mt-6 max-w-3xl">
      <div className="mb-4 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-white"><Building2 size={22} /></span>
        <div><h2 className="text-lg font-bold">{inst.name}</h2><p className="muted">Code {inst.code} · the official name is managed by the eLiberia platform team</p></div></div>
      <InstitutionForm value={inst} onSave={async (v) => { setInst(await api<Institution>("/api/institution/profile", { method: "PUT", json: v })); }} />
    </div>
  );
}

type InstRow = Institution & { services: number; staff: number };
/** Platform view of every institution, with onboarding of new ones. */
export function InstitutionsPanel({ canEdit, onChange }: { canEdit: boolean; onChange?: () => void }) {
  const [rows, setRows] = useState<InstRow[] | null>(null);
  const [edit, setEdit] = useState<Partial<Institution> | null>(null);
  const load = useCallback(() => api<InstRow[]>("/api/admin/institutions").then(setRows).catch(() => setRows([])), []);
  useEffect(() => { load(); }, [load]);

  if (edit) return (
    <div className="mt-6 max-w-3xl">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">{edit.id ? `Edit ${edit.name}` : "Onboard an institution"}</h2>
        <button className="rounded-lg p-1.5 hover:bg-slate-100" onClick={() => setEdit(null)} aria-label="Close"><X size={19} /></button></div>
      <InstitutionForm value={edit} withIdentity onCancel={() => setEdit(null)} onSave={async (v) => {
        const saved = await api<Institution>(edit.id ? `/api/admin/institutions/${edit.id}` : "/api/admin/institutions", { method: edit.id ? "PUT" : "POST", json: v });
        setEdit(saved); await load(); onChange?.();
      }} />
      {!edit.id && <p className="muted mt-3">Next: add an institution admin for it under Team. They set up its services, document rules and officers themselves.</p>}
    </div>
  );

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="muted">{rows?.length ?? "…"} institutions on the platform. Each one manages its own services, rules and officers.</p>
        {canEdit && <button className="btn shrink-0" onClick={() => setEdit({})}><Plus size={17} /> Onboard institution</button>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows === null && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        {rows?.map((i) => (
          <div key={i.id} className="card !p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xs font-extrabold text-navy-800">{i.code.slice(0, 4)}</span>
              <div className="min-w-0 flex-1"><div className="font-semibold leading-snug">{i.name}</div><div className="muted truncate">{i.description || "No description yet"}</div></div>
              {canEdit && <button className="rounded-lg p-1.5 text-navy-800 hover:bg-navy-50" onClick={() => setEdit(i)} aria-label={`Edit ${i.name}`}><Pencil size={15} /></button>}
            </div>
            <div className="mt-3 flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{i.services} services</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{i.staff} staff</span>
              {i.guidelines ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800"><ShieldCheck size={12} /> Guidelines set</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
