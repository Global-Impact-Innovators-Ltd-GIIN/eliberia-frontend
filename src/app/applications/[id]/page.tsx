"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FaceCapture from "@/components/FaceCapture";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { api, Application } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ApplicationPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<Application | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("orange_money");
  const [pending, setPending] = useState<string>("");
  const [centers, setCenters] = useState<string[]>([]);
  const [appt, setAppt] = useState({ center: "", slot: "" });

  const load = useCallback(async () => {
    try {
      const r = await api<Application>(`/api/applications/${params.id}`);
      setA(r); setData(r.data || {});
    } catch (e: any) { setError(e.message); }
  }, [params.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    load();
    api<string[]>("/api/centers").then(setCenters).catch(() => {});
  }, [user, loading, router, load]);

  async function run(fn: () => Promise<any>, ok = "") {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); if (ok) setInfo(ok); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const save = () => api(`/api/applications/${params.id}`, { method: "PUT", json: { data } });
  const upload = (docType: string, file: File) => {
    const fd = new FormData(); fd.append("file", file); fd.append("doc_type", docType);
    return run(() => api(`/api/applications/${params.id}/documents`, { method: "POST", body: fd }), "Document uploaded");
  };
  const pay = () => run(async () => {
    const p = await api(`/api/applications/${params.id}/pay`, { method: "POST", json: { method } });
    setPending(p.txn_ref);
  }, "Payment prompt sent to your phone. Approve it, then confirm below.");
  const confirm = () => run(async () => {
    await api(`/api/applications/payments/${pending}/confirm`, { method: "POST", json: {} }); setPending("");
  }, "Payment received");
  const submit = () => run(async () => { await save(); await api(`/api/applications/${params.id}/submit`, { method: "POST" }); }, "Application submitted");
  const sendFace = (blob: Blob, liveness: number) => run(async () => {
    const fd = new FormData(); fd.append("kind", "face"); fd.append("liveness", String(liveness));
    fd.append("image", blob, "face.jpg");
    await api(`/api/applications/${params.id}/biometrics`, { method: "POST", body: fd });
  }, "Identity verified - sent to the agency.");
  const book = () => run(() => api(`/api/applications/${params.id}/appointments`, { method: "POST", json: appt }), "Appointment booked");

  if (error && !a) return <p className="text-red-700">{error}</p>;
  if (!a || !a.service_detail) return <p>Loading...</p>;
  const s = a.service_detail;
  const editable = ["draft", "info_requested"].includes(a.status);
  const docsDone = (a.documents?.length || 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h1 className="text-2xl font-bold">{s.name}</h1>
            <div className="text-sm text-slate-500">Ref {a.reference} · {s.institution.name}</div></div>
          <StatusBadge status={a.status} />
        </div>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded bg-green-50 p-3 text-sm text-green-800">{info}</p>}

        {a.status === "info_requested" && a.events && (
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">Officer message: {a.events[a.events.length - 1].message}</p>
        )}

        <section className="card space-y-3">
          <h2 className="font-semibold">1. Your details</h2>
          {s.form_fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}{f.required && " *"}</label>
              {f.type === "select" ? (
                <select className="input" disabled={!editable} value={data[f.name] || ""} onChange={(e) => setData({ ...data, [f.name]: e.target.value })}>
                  <option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="input" disabled={!editable} type={f.type} value={data[f.name] || ""} onChange={(e) => setData({ ...data, [f.name]: e.target.value })} />
              )}
            </div>
          ))}
          {editable && <button className="btn btn-ghost" disabled={busy} onClick={() => run(save, "Saved")}>Save draft</button>}
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">2. Documents ({docsDone}/{s.required_documents.length})</h2>
          {s.required_documents.map((d, i) => (
            <div key={d} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{d} {a.documents?.[i] ? "✓" : ""}</span>
              {editable && <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => e.target.files?.[0] && upload(d, e.target.files[0])} />}
            </div>
          ))}
          {!!a.documents?.length && <ul className="text-xs text-slate-500">{a.documents.map((d) => <li key={d.id}>{d.filename}</li>)}</ul>}
        </section>

        {s.fee_usd > 0 && (
          <section className="card space-y-3">
            <h2 className="font-semibold">3. Payment - ${s.fee_usd.toFixed(2)} {a.paid && <span className="text-green-700">(paid ✓)</span>}</h2>
            {!a.paid && (
              <div className="flex flex-wrap gap-2">
                <select className="input max-w-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="orange_money">Orange Money</option><option value="mtn_momo">MTN MoMo</option>
                </select>
                {!pending ? <button className="btn" disabled={busy} onClick={pay}>Pay now</button>
                  : <button className="btn btn-red" disabled={busy} onClick={confirm}>I approved the payment</button>}
              </div>
            )}
            <p className="text-xs text-slate-500">Demo mode: payment is simulated.</p>
          </section>
        )}

        {editable && (
          <button className="btn btn-red" disabled={busy} onClick={submit}>Submit application</button>
        )}

        {a.status === "biometric_pending" && (
          <section className="card space-y-3 border-orange-300">
            <h2 className="font-semibold">Identity verification</h2>
            <p className="text-sm text-slate-600">Take a selfie from home. Make sure your face is well lit.</p>
            <FaceCapture onCapture={sendFace} />
            {s.requires_fingerprint && <p className="text-sm text-slate-600">Fingerprints require a certified scanner - book a visit below.</p>}
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold">Or book a service center visit</h3>
              <select className="input" value={appt.center} onChange={(e) => setAppt({ ...appt, center: e.target.value })}>
                <option value="">Choose a center</option>{centers.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="input" type="datetime-local" value={appt.slot} onChange={(e) => setAppt({ ...appt, slot: e.target.value })} />
              <button className="btn btn-ghost" disabled={busy || !appt.center || !appt.slot} onClick={book}>Book appointment</button>
            </div>
          </section>
        )}

        {a.status === "rejected" && <p className="rounded bg-red-50 p-3 text-sm text-red-800">Reason: {a.decision_note}</p>}
      </div>
      <aside className="card h-fit">
        <h2 className="mb-3 font-semibold">Progress</h2>
        <Timeline events={a.events || []} />
      </aside>
    </div>
  );
}
