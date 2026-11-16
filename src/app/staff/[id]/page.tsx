"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { api, Application } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ACTIONS: Record<string, { action: string; label: string; note?: boolean; red?: boolean }[]> = {
  submitted: [{ action: "start_review", label: "Start review" }, { action: "reject", label: "Reject", note: true, red: true }],
  in_review: [
    { action: "approve", label: "Approve" },
    { action: "request_biometrics", label: "Request identity check" },
    { action: "request_info", label: "Request more info", note: true },
    { action: "reject", label: "Reject", note: true, red: true },
  ],
  approved: [{ action: "ready", label: "Mark ready" }],
  ready_for_collection: [{ action: "complete", label: "Mark delivered" }],
};

export default function StaffDetail({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<Application | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => api<Application>(`/api/staff/applications/${params.id}`).then(setA).catch((e) => setError(e.message)), [params.id]);
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "officer" && user.role !== "admin") { router.push(user.role === "agent" ? "/agent" : "/dashboard"); return; }
    load();
  }, [user, loading, router, load]);

  async function act(action: string) {
    setError("");
    try { await api(`/api/staff/applications/${params.id}/action`, { method: "POST", json: { action, note } }); setNote(""); await load(); }
    catch (e: any) { setError(e.message); }
  }

  if (!a) return <p>{error || "Loading..."}</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">{a.service.name}</h1>
            <div className="text-sm text-slate-500">{a.reference} · {a.applicant.full_name} · {a.applicant.phone}</div></div>
          <StatusBadge status={a.status} />
        </div>
        <section className="card"><h2 className="mb-2 font-semibold">Submitted details</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(a.data || {}).map(([k, v]) => <div key={k}><dt className="text-slate-500">{k.replace(/_/g, " ")}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl></section>
        <section className="card"><h2 className="mb-2 font-semibold">Documents &amp; verification</h2>
          <ul className="text-sm">{a.documents?.map((d) => <li key={d.id}>{d.doc_type}: {d.filename}</li>)}</ul>
          <ul className="mt-2 text-sm">{a.biometrics?.map((b) => <li key={b.id}>{b.kind} ({b.source}) - {b.status}</li>)}
            {!a.biometrics?.length && <li className="text-slate-500">No biometric evidence yet.</li>}</ul></section>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="card space-y-3">
          <h2 className="font-semibold">Decision</h2>
          <textarea className="input" rows={2} placeholder="Note to applicant (required for reject / request info)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {(ACTIONS[a.status] || []).map((x) => <button key={x.action} className={`btn ${x.red ? "btn-red" : ""}`} onClick={() => act(x.action)}>{x.label}</button>)}
            {!ACTIONS[a.status] && <span className="text-sm text-slate-500">No actions available in this state.</span>}
          </div>
        </section>
      </div>
      <aside className="card h-fit"><h2 className="mb-3 font-semibold">History</h2><Timeline events={a.events || []} /></aside>
    </div>
  );
}
