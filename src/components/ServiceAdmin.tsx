"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { api, Field, money, Service } from "@/lib/api";

type Row = Service & { active: boolean; institution_id: number };
type Draft = {
  code: string; name: string; category: string; institution_id: string; fee_usd: string; sla_days: string;
  description: string; requires_face: boolean; requires_fingerprint: boolean; active: boolean; docs: string;
  fields: (Field & { opts: string })[];
};
const EMPTY: Draft = { code: "", name: "", category: "", institution_id: "", fee_usd: "0", sla_days: "5", description: "",
  requires_face: false, requires_fingerprint: false, active: true, docs: "", fields: [] };

export default function ServiceAdmin({ insts }: { insts: { id: number; name: string }[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // service code, or "" for a new one
  const [d, setD] = useState<Draft>(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api<Row[]>("/api/admin/services").then(setRows).catch(() => setRows([])), []);
  useEffect(() => { load(); }, [load]);
  const cats = useMemo(() => [...new Set((rows || []).map((r) => r.category))].sort(), [rows]);
  const list = (rows || []).filter((r) => !q || `${r.name} ${r.category} ${r.institution.name} ${r.code}`.toLowerCase().includes(q.toLowerCase()));

  function open(r?: Row) {
    setMsg(null);
    if (!r) { setD(EMPTY); setEditing(""); return; }
    setD({ code: r.code, name: r.name, category: r.category, institution_id: String(r.institution_id), fee_usd: String(r.fee_usd),
      sla_days: String(r.sla_days), description: r.description, requires_face: r.requires_face, requires_fingerprint: r.requires_fingerprint,
      active: r.active, docs: r.required_documents.join("\n"), fields: r.form_fields.map((f) => ({ ...f, opts: (f.options || []).join(", ") })) });
    setEditing(r.code);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const body = {
      code: d.code, name: d.name, category: d.category, institution_id: Number(d.institution_id), fee_usd: Number(d.fee_usd), sla_days: Number(d.sla_days),
      description: d.description, requires_face: d.requires_face, requires_fingerprint: d.requires_fingerprint, active: d.active,
      required_documents: d.docs.split("\n").map((x) => x.trim()).filter(Boolean),
      form_fields: d.fields.map((f) => ({ name: f.name || undefined, label: f.label, type: f.type, required: f.required,
        options: f.type === "select" ? f.opts.split(",").map((o) => o.trim()).filter(Boolean) : undefined })),
    };
    try {
      await api(editing ? `/api/admin/services/${editing}` : "/api/admin/services", { method: editing ? "PUT" : "POST", json: body });
      setMsg({ ok: true, text: editing ? "Service updated." : "Service created and live in the catalog." }); setEditing(null); await load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  const setField = (i: number, patch: Partial<Draft["fields"][number]>) => setD({ ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  if (editing !== null) return (
    <form onSubmit={save} className="card mt-6 space-y-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? `Edit ${d.name}` : "New service"}</h2>
        <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" onClick={() => setEditing(null)} aria-label="Close"><X size={19} /></button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!editing && <div><label className="label" htmlFor="sc">Code</label><input id="sc" className="input font-mono uppercase" placeholder="FISHING_LICENSE" value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} required minLength={3} /></div>}
        <div><label className="label" htmlFor="sn">Name</label><input id="sn" className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required minLength={3} /></div>
        <div><label className="label" htmlFor="sg">Category</label><input id="sg" className="input" list="cats" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} required />
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div><label className="label" htmlFor="si">Institution</label>
          <select id="si" className="input" value={d.institution_id} onChange={(e) => setD({ ...d, institution_id: e.target.value })} required>
            <option value="">Choose…</option>{insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
        <div><label className="label" htmlFor="sf">Fee (USD)</label><input id="sf" className="input" type="number" min={0} step="0.01" value={d.fee_usd} onChange={(e) => setD({ ...d, fee_usd: e.target.value })} required /></div>
        <div><label className="label" htmlFor="sd">Processing time (working days)</label><input id="sd" className="input" type="number" min={1} max={365} value={d.sla_days} onChange={(e) => setD({ ...d, sla_days: e.target.value })} required /></div>
      </div>
      <div><label className="label" htmlFor="sx">Description</label><textarea id="sx" className="input" rows={2} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {([["requires_face", "Needs a face check"], ["requires_fingerprint", "Needs fingerprints (one visit)"], ["active", "Visible to citizens"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-navy-800" checked={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.checked })} /> {l}</label>
        ))}
      </div>
      <div><label className="label" htmlFor="so">Required documents <span className="font-normal text-ink-500">(one per line)</span></label>
        <textarea id="so" className="input" rows={3} value={d.docs} onChange={(e) => setD({ ...d, docs: e.target.value })} /></div>
      <div>
        <div className="flex items-center justify-between"><span className="label !mb-0">Form questions</span>
          <button type="button" className="btn btn-soft !py-1.5" onClick={() => setD({ ...d, fields: [...d.fields, { name: "", label: "", type: "text", required: true, opts: "" }] })}><Plus size={15} /> Add question</button></div>
        <div className="mt-2 space-y-2">
          {d.fields.map((f, i) => (
            <div key={i} className="grid items-center gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1.5fr_7.5rem_1.3fr_auto_auto]">
              <input className="input" placeholder="Question label" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} required aria-label="Question label" />
              <select className="input" value={f.type} onChange={(e) => setField(i, { type: e.target.value })} aria-label="Answer type">{["text", "date", "number", "select"].map((t) => <option key={t}>{t}</option>)}</select>
              {f.type === "select" ? <input className="input" placeholder="Options, comma separated" value={f.opts} onChange={(e) => setField(i, { opts: e.target.value })} aria-label="Options" /> : <span className="hidden sm:block" />}
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-navy-800" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Required</label>
              <button type="button" className="rounded-lg p-2 text-flag-700 hover:bg-flag-50" onClick={() => setD({ ...d, fields: d.fields.filter((_, j) => j !== i) })} aria-label="Remove question"><Trash2 size={16} /></button>
            </div>
          ))}
          {!d.fields.length && <p className="muted">No questions yet. Applicants will only upload documents.</p>}
        </div>
      </div>
      {msg && !msg.ok && <div className="alert alert-error" role="alert">{msg.text}</div>}
      <div className="flex gap-2"><button className="btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create service"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>
  );

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input !pl-10" placeholder="Search the catalog" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search services" />
        </div>
        <button className="btn" onClick={() => open()}><Plus size={17} /> New service</button>
      </div>
      {msg?.ok && <div className="alert alert-ok mt-4" role="status">{msg.text}</div>}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {rows === null && <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11" />)}</div>}
        <ul className="divide-y divide-slate-100">
          {list.map((r) => (
            <li key={r.code} className="flex items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{r.name}</div><div className="muted truncate">{r.category} · {r.institution.name}</div></div>
              <span className="hidden text-sm text-ink-500 sm:block">{r.sla_days} days</span>
              <span className="w-16 text-right text-sm font-bold text-navy-800">{money(r.fee_usd)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-ink-500"}`}>{r.active ? "Live" : "Hidden"}</span>
              <button className="rounded-lg p-2 text-navy-800 hover:bg-navy-50" onClick={() => open(r)} aria-label={`Edit ${r.name}`}><Pencil size={16} /></button>
            </li>
          ))}
        </ul>
        {rows !== null && !list.length && <p className="muted p-5">No services match.</p>}
      </div>
      <p className="muted mt-3">{rows?.length ?? 0} services · changes apply immediately for citizens and agents.</p>
    </section>
  );
}
