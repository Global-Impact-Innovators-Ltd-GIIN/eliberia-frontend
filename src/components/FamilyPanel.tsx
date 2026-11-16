"use client";
import { useCallback, useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { api, fmtDate } from "@/lib/api";

export type Member = { id: number; full_name: string; relation: string; dob?: string | null };
export const RELATIONS = ["Child", "Parent", "Spouse", "Sibling", "Grandparent", "Ward", "Other"];

/** People the citizen applies for, saved once and picked on any service. */
export default function FamilyPanel() {
  const [rows, setRows] = useState<Member[]>([]);
  const [m, setM] = useState({ full_name: "", relation: "Child", dob: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<Member[]>("/api/family").then(setRows).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api("/api/family", { method: "POST", json: { ...m, dob: m.dob || undefined } });
      setMsg({ ok: true, text: `${m.full_name} added.` }); setM({ full_name: "", relation: "Child", dob: "" }); await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  async function remove(x: Member) {
    if (!window.confirm(`Remove ${x.full_name}? Applications already made for them are not affected.`)) return;
    await api(`/api/family/${x.id}`, { method: "DELETE" }).catch(() => {});
    await load();
  }

  return (
    <section className="card space-y-4 lg:col-span-2">
      <h2 className="flex items-center gap-2 font-bold"><Users size={18} /> Family members</h2>
      <p className="muted">Save the people you apply for, such as your children or elderly parents. Pick them when you start an application and their details are filled in.</p>
      {!!rows.length && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {rows.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1"><b>{x.full_name}</b> <span className="text-ink-500">· {x.relation}{x.dob ? ` · born ${fmtDate(x.dob)}` : ""}</span></div>
              <button className="rounded-lg p-1.5 text-flag-700 hover:bg-flag-50" onClick={() => remove(x)} aria-label={`Remove ${x.full_name}`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-end">
        <div><label className="label" htmlFor="fm-n">Full name</label><input id="fm-n" className="input" value={m.full_name} onChange={(e) => setM({ ...m, full_name: e.target.value })} required minLength={3} /></div>
        <div><label className="label" htmlFor="fm-r">Relationship</label>
          <select id="fm-r" className="input" value={m.relation} onChange={(e) => setM({ ...m, relation: e.target.value })}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div><label className="label" htmlFor="fm-d">Date of birth</label><input id="fm-d" className="input" type="date" value={m.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setM({ ...m, dob: e.target.value })} /></div>
        <button className="btn" disabled={busy}>Add</button>
      </form>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role="status">{msg.text}</div>}
    </section>
  );
}
