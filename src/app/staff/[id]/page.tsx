"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, Eye, FileText, Fingerprint, HandHelping, Phone, ScanFace, UserRound, Wallet, XCircle } from "lucide-react";
import Messages from "@/components/Messages";
import Timeline from "@/components/Timeline";
import { Skeleton, StatusBadge } from "@/components/ui";
import { API, api, Application, fmtDate, getToken, isReviewer, money } from "@/lib/api";
import { displayAnswer, useIdentityMeta } from "@/lib/identity";
import { useAuth } from "@/lib/auth";

type Act = { action: string; label: string; hint: string; note?: "required" | "optional"; tone?: "red" | "ghost" };
const ACTIONS: Record<string, Act[]> = {
  submitted: [
    { action: "start_review", label: "Start review", hint: "Assign this application to yourself." },
    { action: "reject", label: "Reject", hint: "Needs a reason the applicant will see.", note: "required", tone: "red" },
  ],
  in_review: [
    { action: "approve", label: "Approve & issue certificate", hint: "Issues a signed e-certificate.", note: "optional" },
    { action: "request_biometrics", label: "Request identity check", hint: "Applicant takes a selfie or books a visit.", note: "optional", tone: "ghost" },
    { action: "request_info", label: "Ask for more information", hint: "Sends it back to the applicant to edit.", note: "required", tone: "ghost" },
    { action: "reject", label: "Reject", hint: "Needs a reason the applicant will see.", note: "required", tone: "red" },
  ],
  approved: [{ action: "ready", label: "Mark ready for collection", hint: "Notifies the applicant.", note: "optional" }],
  ready_for_collection: [{ action: "complete", label: "Mark delivered", hint: "Closes the application." }],
};
const WAITING: Record<string, string> = {
  info_requested: "Waiting for the applicant to provide more information.",
  biometric_pending: "Waiting for the applicant to complete the identity check.",
  completed: "This application is closed.", rejected: "This application was rejected.", draft: "The applicant has not submitted yet.",
};

export default function StaffDetail({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<Application | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const meta = useIdentityMeta();
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState("");
  async function revoke() {
    setError(""); setInfo(""); setBusy(true);
    try {
      await api(`/api/staff/certificates/${a!.certificate!.number}/revoke`, { method: "POST", json: { reason } });
      setRevoking(false); setReason(""); setInfo("Certificate revoked. Anyone who checks it will now see it is invalid."); await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const load = useCallback(() => api<Application>(`/api/staff/applications/${params.id}`).then(setA).catch((e) => setError(e.message)), [params.id]);
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!isReviewer(user.role)) { router.push(user.role === "agent" ? "/agent" : "/dashboard"); return; }
    load();
  }, [user, loading, router, load]);

  async function act(x: Act) {
    setError(""); setInfo("");
    if (x.note === "required" && !note.trim()) { setError(`Write a note for the applicant before you ${x.label.toLowerCase()}.`); return; }
    if (x.action === "reject" && !confirmReject) { setConfirmReject(true); return; }
    setBusy(true);
    try {
      await api(`/api/staff/applications/${params.id}/action`, { method: "POST", json: { action: x.action, note } });
      setNote(""); setConfirmReject(false); setInfo("Done. The applicant has been notified."); await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function view(docId: number) {
    setError("");
    try {
      const r = await fetch(`${API}/api/applications/${params.id}/documents/${docId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error("Could not open the document. On the pilot server, files are cleared when it restarts.");
      window.open(URL.createObjectURL(await r.blob()), "_blank", "noopener");
    } catch (e: any) { setError(e.message); }
  }

  if (!a) return error ? <div className="alert alert-error">{error}</div> : <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-64" /></div>;
  const s = a.service_detail;
  const fields = s?.form_fields || [];
  const labelOf = (k: string) => fields.find((f) => f.name === k)?.label || k.replace(/_/g, " ");
  const faceOk = a.biometrics?.some((b) => b.kind === "face" && b.status === "dispatched");
  const needsFace = s?.requires_face && !faceOk;
  const st = a.stage;
  const multi = !!st && st.total > 1;
  const lastStage = !st || st.index >= st.total - 1;
  let actions = ACTIONS[a.status] || [];
  if (a.status === "in_review" && multi && st) {
    const rest = actions.filter((x) => x.action !== "approve" && x.action !== "reject");
    actions = [
      lastStage ? actions[0] : { action: "advance", label: `Complete "${st.name}"`, hint: `Passes it on to: ${st.names[st.index + 1]}`, note: "optional" },
      ...rest,
      ...(st.index > 0 ? [{ action: "send_back", label: "Send back a stage", hint: `Returns it to: ${st.names[st.index - 1]}`, note: "required", tone: "ghost" } as Act] : []),
      actions[actions.length - 1],
    ];
  }
  const late = a.due_at && ["submitted", "in_review"].includes(a.status) && new Date(a.due_at + "Z").getTime() < Date.now();

  return (
    <div>
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-navy-800"><ArrowLeft size={15} /> Back to queue</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{a.service.name}</h1>
          <p className="muted mt-1"><span className="font-mono">{a.reference}</span> · submitted {fmtDate(a.created_at)} · <span className={late ? "font-semibold text-flag-700" : ""}>{late ? "overdue since" : "due"} {fmtDate(a.due_at)}</span></p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-white"><UserRound size={24} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold">{a.applicant.full_name}</div>
                <div className="muted flex flex-wrap items-center gap-x-3"><span className="flex items-center gap-1"><Phone size={13} /> {a.applicant.phone}</span>
                  {a.beneficiary && <span>Applying for <b className="text-ink-900">{a.beneficiary.name}</b> ({a.beneficiary.relation})</span>}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {a.assisted && <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-navy-800"><HandHelping size={13} /> Agent assisted</span>}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${a.fee_usd === 0 || a.paid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}><Wallet size={13} /> {a.fee_usd === 0 ? "No fee" : `${money(a.fee_usd)} ${a.paid ? "paid" : "unpaid"}`}</span>
              </div>
            </div>
          </section>

          {a.delivery && (
            <div className="alert alert-info">
              <b>Delivery:</b>&nbsp;{a.delivery.method === "collect" ? `collect at ${a.delivery.center}` : `courier to ${a.delivery.address} (${a.delivery.phone})`}
            </div>
          )}
          <section className="card">
            <h2 className="font-bold">Submitted details</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {fields.map((f) => <div key={f.name}><dt className="text-ink-500">{f.label}</dt><dd className="mt-0.5 font-medium">{displayAnswer(f, a.data || {}, meta) || "—"}</dd></div>)}
              {Object.entries(a.data || {}).filter(([k]) => !k.includes("__") && !fields.some((f) => f.name === k)).map(([k, v]) => <div key={k}><dt className="text-ink-500">{labelOf(k)}</dt><dd className="mt-0.5 font-medium">{String(v) || "—"}</dd></div>)}
              {!Object.keys(a.data || {}).length && <p className="muted">No details were provided.</p>}
            </dl>
          </section>

          <section className="card">
            <h2 className="font-bold">Documents</h2>
            <ul className="mt-3 space-y-2">
              {a.documents?.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <FileText size={18} className="shrink-0 text-navy-600" />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{d.doc_type}</div><div className="muted truncate text-xs">{d.filename}</div></div>
                  <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => view(d.id)}><Eye size={15} /> View</button>
                </li>
              ))}
              {!a.documents?.length && <li className="muted">No documents were uploaded.</li>}
            </ul>
          </section>

          <section className="card">
            <h2 className="font-bold">Identity verification</h2>
            {s && <p className="muted mt-1">This service requires: {s.requires_face ? "face check" : "no face check"}{s.requires_fingerprint ? " and fingerprints" : ""}.</p>}
            <ul className="mt-3 space-y-2">
              {a.biometrics?.map((b) => {
                const ok = b.status === "dispatched" || b.status === "verified";
                return (
                  <li key={b.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                    {b.kind === "face" ? <ScanFace size={18} className="text-navy-600" /> : <Fingerprint size={18} className="text-navy-600" />}
                    <div className="flex-1"><span className="font-medium capitalize">{b.kind}</span> <span className="text-ink-500">· captured {b.source === "remote" ? "from home" : b.source === "agent" ? "by an agent" : "at a service center"}</span>
                      {b.liveness_score != null && <div className="text-xs text-ink-500">Liveness {Math.round(b.liveness_score * 100)}% · Match {Math.round((b.match_score || 0) * 100)}%</div>}</div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ok ? "text-emerald-700" : "text-flag-700"}`}>{ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {ok ? "Verified" : "Failed"}</span>
                  </li>
                );
              })}
              {!a.biometrics?.length && <li className="muted">No identity evidence yet.</li>}
            </ul>
          </section>

          <Messages appId={a.id} title="Messages with the applicant" />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="card space-y-3">
            <h2 className="font-bold">Decision</h2>
            {multi && st && ["in_review", "submitted", "info_requested", "biometric_pending"].includes(a.status) && (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Your office's stages</div>
                <ol className="mt-2 space-y-1.5">
                  {st.names.map((n, k) => {
                    const done = a.status !== "submitted" && k < st.index, on = a.status !== "submitted" && k === st.index;
                    return (
                      <li key={n} className={`flex items-center gap-2 text-sm ${on ? "font-semibold text-ink-900" : done ? "text-emerald-700" : "text-ink-500"}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-500 text-white" : on ? "bg-navy-800 text-white" : "bg-slate-200"}`}>{done ? "✓" : k + 1}</span>{n}
                      </li>
                    );
                  })}
                </ol>
                {a.status === "in_review" && st.instructions && <p className="mt-2 border-t border-slate-200 pt-2 text-sm text-ink-700"><b>At this stage:</b> {st.instructions}</p>}
              </div>
            )}
            {a.certificate && (
              <Link href={`/verify/${a.certificate.number}`} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"><BadgeCheck size={17} /> Certificate {a.certificate.number}</Link>
            )}
            {a.certificate && (a.certificate.revoked ? <p className="rounded-xl bg-flag-50 p-3 text-sm font-semibold text-flag-700">This certificate has been revoked.</p>
              : !revoking ? <button className="text-sm font-semibold text-flag-700 hover:underline" onClick={() => setRevoking(true)}>Revoke this certificate</button>
              : (
                <div className="space-y-2 rounded-xl border border-flag-100 bg-flag-50 p-3">
                  <label className="label" htmlFor="rr">Reason for revoking</label>
                  <input id="rr" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Issued in error" maxLength={200} />
                  <div className="flex gap-2"><button className="btn btn-red" disabled={busy || reason.trim().length < 5} onClick={revoke}>Revoke</button>
                    <button className="btn btn-ghost" onClick={() => setRevoking(false)}>Cancel</button></div>
                </div>
              ))}
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {info && <div className="alert alert-ok" role="status">{info}</div>}
            {actions.length ? (
              <>
                {a.status === "in_review" && needsFace && <div className="alert alert-warn">A face check is required before you can approve.</div>}
                {actions.some((x) => x?.note) && (
                  <div><label className="label" htmlFor="note">Note to the applicant</label>
                    <textarea id="note" className="input" rows={3} placeholder="Required to reject or ask for information" value={note} onChange={(e) => { setNote(e.target.value); setConfirmReject(false); }} maxLength={280} /></div>
                )}
                <div className="space-y-2">
                  {actions.map((x) => {
                    if (!x) return null;
                    const blocked = x.action === "approve" && needsFace;
                    const label = x.action === "reject" && confirmReject ? "Click again to confirm rejection" : x.label;
                    return (
                      <div key={x.action}>
                        <button disabled={busy || !!blocked} onClick={() => act(x)} className={`btn w-full ${x.tone === "red" ? "btn-red" : x.tone === "ghost" ? "btn-ghost" : ""}`}>{label}</button>
                        <p className="mt-1 text-center text-xs text-ink-500">{x.hint}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <p className="muted">{WAITING[a.status] || "No actions available."}</p>}
            {a.status === "rejected" && a.decision_note && <p className="rounded-xl bg-flag-50 p-3 text-sm text-flag-700">Reason given: {a.decision_note}</p>}
          </section>
          <section className="card"><h2 className="mb-4 font-bold">History</h2><Timeline events={a.events || []} /></section>
        </aside>
      </div>
    </div>
  );
}
