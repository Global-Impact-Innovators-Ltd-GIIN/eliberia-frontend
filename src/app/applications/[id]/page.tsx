"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, CheckCircle2, Copy, Eye, FileText, LockKeyhole, ScanFace, Send, Sparkles, Star as StarIcon, UploadCloud, Wallet } from "lucide-react";
import IdentityField from "@/components/IdentityField";
import FaceCapture from "@/components/FaceCapture";
import Messages from "@/components/Messages";
import Timeline from "@/components/Timeline";
import { Skeleton, StatusBadge, Stepper } from "@/components/ui";
import { api, Application, DocRule, fmtDate, fmtDateTime, fmtFormats, money } from "@/lib/api";
import { displayAnswer, fieldProblem, useIdentityMeta } from "@/lib/identity";

type Access = { viewer_name: string; viewer_role: string; organisation: string; what: string; created_at: string };
import { useAuth } from "@/lib/auth";

export default function ApplicationPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<Application | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("orange_money");
  const [pending, setPending] = useState("");
  const [centers, setCenters] = useState<string[]>([]);
  const [appt, setAppt] = useState({ center: "", slot: "" });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [prefilled, setPrefilled] = useState(0);
  const [access, setAccess] = useState<Access[] | null>(null);
  const meta = useIdentityMeta();

  const load = useCallback(async () => {
    try {
      const r = await api<Application>(`/api/applications/${params.id}`);
      setA(r); setData(r.data || {});
      return r;
    } catch (e: any) { setError(e.message); }
  }, [params.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    load().then(async (r) => {
      if (!r) return;
      if (r.status === "draft" && !Object.keys(r.data || {}).length) {
        // reuse what we already know about this person so they never type it twice
        const pre = await api<{ values: Record<string, string> }>(`/api/applications/${params.id}/prefill`).catch(() => null);
        const n = pre ? Object.keys(pre.values).filter((k) => !k.includes("__")).length : 0;
        if (pre && n) { setData(pre.values); setPrefilled(n); }
      }
      if (user.role === "citizen" && r.status !== "draft") api<Access[]>(`/api/applications/${params.id}/access`).then(setAccess).catch(() => {});
    });
    api<string[]>("/api/centers").then(setCenters).catch(() => {});
  }, [user, loading, router, load]);

  async function run(fn: () => Promise<any>, ok = "") {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); if (ok) setInfo(ok); await load(); return true; }
    catch (e: any) { setError(e.message); return false; }
    finally { setBusy(false); }
  }

  if (error && !a) return <div className="container-x py-10"><div className="alert alert-error">{error}</div></div>;
  if (!a || !a.service_detail) return <div className="container-x grid gap-6 py-10 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-64" /></div>;

  const s = a.service_detail;
  const isAgent = user?.role === "agent";
  const methods = [["orange_money", "Orange Money", "bg-orange-500"], ["mtn_momo", "MTN MoMo", "bg-yellow-400"],
    ...(isAgent ? [["agent_cash", "Cash", "bg-emerald-500"]] : [])];
  const editable = ["draft", "info_requested"].includes(a.status);
  const hasFee = s.fee_usd > 0;
  const steps = ["Your details", ...(s.required_documents.length ? ["Documents"] : []), ...(hasFee ? ["Payment"] : []), "Review"];
  const cur = steps[Math.min(step, steps.length - 1)];
  const problems = s.form_fields.map((f) => fieldProblem(f, data, meta)).filter(Boolean) as string[];
  const docsDone = a.documents?.length || 0;
  const docFor = (name: string) => a.documents?.find((d) => d.doc_type === name);
  const docsOk = s.required_documents.every((r) => !r.required || docFor(r.name));

  const save = () => api(`/api/applications/${params.id}`, { method: "PUT", json: { data } });
  const next = async () => {
    if (cur === "Your details") {
      if (problems.length) { setError(problems.slice(0, 3).join(" ")); return; }
      if (!(await run(save))) return;
    }
    if (cur === "Documents" && !docsOk) { setError("Please upload every required document."); return; }
    if (cur === "Payment" && !a.paid) { setError("Complete the payment to continue."); return; }
    setError(""); setInfo(""); setStep(step + 1);
  };
  const upload = (rule: DocRule, file: File) => {
    // check the institution's rules before sending anything
    const ext = (file.name.split(".").pop() || "").toLowerCase().replace("jpeg", "jpg");
    if (!rule.formats.includes(ext)) { setInfo(""); setError(`"${rule.name}" must be a ${rule.formats.map((f) => f.toUpperCase()).join(", ")} file. You chose a .${ext} file.`); return; }
    if (file.size > rule.max_mb * 1024 * 1024) { setInfo(""); setError(`"${rule.name}" must be ${rule.max_mb} MB or smaller. Yours is ${(file.size / 1048576).toFixed(1)} MB.`); return; }
    const fd = new FormData(); fd.append("file", file); fd.append("doc_type", rule.name);
    return run(() => api(`/api/applications/${params.id}/documents`, { method: "POST", body: fd }), `${rule.name} uploaded`);
  };
  const pay = () => run(async () => {
    const p = await api(`/api/applications/${params.id}/pay`, { method: "POST", json: { method } });
    setPending(p.txn_ref);
  }, method === "agent_cash" ? "Collect the cash, then confirm below." : "A payment prompt was sent to the phone. Approve it, then confirm below.");
  const confirm = () => run(async () => {
    await api(`/api/applications/payments/${pending}/confirm`, { method: "POST", json: {} }); setPending("");
  }, "Payment received. Thank you.");
  const submit = () => run(async () => { await save(); await api(`/api/applications/${params.id}/submit`, { method: "POST" }); }, "Application submitted.");
  const sendFace = (blob: Blob, liveness: number) => run(async () => {
    const fd = new FormData(); fd.append("kind", "face"); fd.append("liveness", String(liveness)); fd.append("image", blob, "face.jpg");
    await api(`/api/applications/${params.id}/biometrics`, { method: "POST", body: fd });
  }, "Identity verified and sent securely to the agency.");
  const book = () => run(() => api(`/api/applications/${params.id}/appointments`, { method: "POST", json: appt }), "Appointment booked.");
  const rate = () => run(() => api(`/api/applications/${params.id}/feedback`, { method: "POST", json: { rating, comment } }), "Thank you for your feedback.");
  const copy = (t: string) => { navigator.clipboard?.writeText(t); setInfo("Copied."); };

  return (
    <div className="container-x py-8">
      <Link href={isAgent ? "/agent" : "/dashboard"} className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-navy-800"><ArrowLeft size={15} /> {isAgent ? "Agent desk" : "My applications"}</Link>
      {isAgent && <div className="alert alert-info mt-3">You are completing this application on behalf of <b>{a.applicant.full_name}</b> ({a.applicant.phone}) with their consent.</div>}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{s.name}</h1>
          <p className="muted mt-1">
            Ref <button onClick={() => copy(a.reference)} className="font-semibold text-navy-800 hover:underline">{a.reference}</button> · {s.institution.name}
            {a.beneficiary && <> · for <b>{a.beneficiary.name}</b> ({a.beneficiary.relation})</>}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {info && <div className="alert alert-ok" role="status"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {info}</div>}
          {a.status === "info_requested" && a.events && (
            <div className="alert alert-warn"><b>The officer asked:</b> {a.events[a.events.length - 1].message}</div>
          )}

          {editable ? (
            <div className="card">
              <Stepper steps={steps} current={Math.min(step, steps.length - 1)} onSelect={(i) => i < step && setStep(i)} />
              <div className="mt-6 animate-rise" key={cur}>
                {cur === "Your details" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {prefilled > 0 && (
                      <div className="alert alert-info sm:col-span-2"><Sparkles size={17} className="mt-0.5 shrink-0" />
                        <span>We filled in {prefilled} answer{prefilled > 1 ? "s" : ""} from your profile and earlier applications. Please check they are still correct.</span></div>
                    )}
                    {s.form_fields.map((f) => f.type === "identity" ? (
                      <div key={f.name} className="sm:col-span-2">
                        <span className="label">{f.label}</span>
                        <IdentityField field={f} data={data} meta={meta} onChange={(patch) => setData({ ...data, ...patch })} />
                      </div>
                    ) : (
                      <div key={f.name}>
                        <label className="label" htmlFor={f.name}>{f.label}{f.required ? <span className="text-flag-600"> *</span> : <span className="font-normal text-ink-500"> (optional)</span>}</label>
                        {f.type === "select" || f.type === "country" ? (
                          <select id={f.name} className="input" value={data[f.name] || ""} onChange={(e) => setData({ ...data, [f.name]: e.target.value })}>
                            <option value="">Select…</option>
                            {f.type === "country" ? meta?.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>) : f.options?.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input id={f.name} className="input" type={f.type === "phone" ? "tel" : f.type} inputMode={f.type === "phone" ? "tel" : undefined}
                            maxLength={f.max_length || 300} value={data[f.name] || ""} onChange={(e) => setData({ ...data, [f.name]: e.target.value })} />
                        )}
                        {f.help && <p className="mt-1 text-xs text-ink-500">{f.help}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {cur === "Documents" && (
                  <div className="space-y-3">
                    <p className="muted">{s.institution.name} sets the format and size it accepts for each document.</p>
                    {s.required_documents.map((d) => {
                      const up = docFor(d.name);
                      return (
                        <label key={d.name} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 border-dashed p-4 transition ${up ? "border-emerald-300 bg-emerald-50/50" : "border-ink-300 hover:border-navy-400 hover:bg-navy-50/50"}`}>
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${up ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-ink-500"}`}>{up ? <CheckCircle2 size={20} /> : <UploadCloud size={20} />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{d.name}{!d.required && <span className="font-normal text-ink-500"> (optional)</span>}</span>
                            <span className="block text-xs font-semibold text-navy-800">{fmtFormats(d)}</span>
                            {d.note && <span className="block text-xs text-ink-500">{d.note}</span>}
                            <span className="muted mt-1 block truncate">{up ? `Uploaded: ${up.filename} - tap to replace` : "Tap to choose a file"}</span>
                          </span>
                          <input type="file" className="sr-only" accept={d.formats.map((f) => (f === "jpg" ? ".jpg,.jpeg" : `.${f}`)).join(",")} disabled={busy}
                            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) upload(d, file); }} />
                        </label>
                      );
                    })}
                  </div>
                )}

                {cur === "Payment" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-900 p-5 text-white">
                      <div><div className="text-xs text-navy-200">Amount due</div><div className="text-3xl font-extrabold">{money(s.fee_usd)}</div></div>
                      <div className="text-right"><div className="text-xs text-navy-200">Bill ID</div>
                        <button onClick={() => copy(a.bill_id || "")} className="flex items-center gap-1.5 font-mono text-lg font-bold tracking-wider hover:underline">{a.bill_id} <Copy size={14} /></button></div>
                    </div>
                    {a.paid ? (
                      <div className="alert alert-ok"><CheckCircle2 size={17} className="mt-0.5" /> Paid in full.</div>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {methods.map(([v, l, dot]) => (
                            <button key={v} type="button" onClick={() => setMethod(v)} aria-pressed={method === v}
                              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${method === v ? "border-navy-800 bg-navy-50 ring-2 ring-navy-100" : "border-ink-300 hover:border-navy-400"}`}>
                              <span className={`h-9 w-9 rounded-full ${dot}`} /><span><span className="block font-semibold">{l}</span><span className="muted">{v === "agent_cash" ? "Collected by you, the agent" : `Prompt sent to ${a.applicant.phone}`}</span></span>
                            </button>
                          ))}
                        </div>
                        {!pending ? <button className="btn btn-lg" disabled={busy} onClick={pay}><Wallet size={18} /> Pay {money(s.fee_usd)}</button>
                          : <button className="btn btn-red btn-lg" disabled={busy} onClick={confirm}>{method === "agent_cash" ? "I received the cash" : isAgent ? "The citizen approved the payment" : "I approved the payment on my phone"}</button>}
                        <p className="muted">Pilot mode: payments are simulated, no money is charged.</p>
                      </>
                    )}
                  </div>
                )}

                {cur === "Review" && (
                  <div className="space-y-4">
                    <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                      {s.form_fields.map((f) => <div key={f.name}><dt className="text-ink-500">{f.label}</dt><dd className="font-medium">{displayAnswer(f, data, meta) || "—"}</dd></div>)}
                    </dl>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><FileText size={15} className="text-navy-600" /> {docsDone} document(s) attached</li>
                      {hasFee && <li className="flex items-center gap-2"><Wallet size={15} className="text-navy-600" /> {a.paid ? "Payment received" : "Payment outstanding"}</li>}
                    </ul>
                    <p className="muted">By submitting, you confirm the information is true and agree to it being shared with {s.institution.name} to process this request.</p>
                    <button className="btn btn-red btn-lg" disabled={busy} onClick={submit}><Send size={17} /> Submit application</button>
                  </div>
                )}
              </div>
              {cur !== "Review" && (
                <div className="mt-6 flex justify-between border-t border-slate-100 pt-5">
                  <button className="btn btn-ghost" disabled={step === 0} onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft size={16} /> Back</button>
                  <button className="btn" disabled={busy} onClick={next}>Continue <ArrowRight size={16} /></button>
                </div>
              )}
            </div>
          ) : (
            <>
              {a.certificate && (
                <div className="card flex flex-wrap items-center gap-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white"><BadgeCheck size={26} /></span>
                  <div className="min-w-0 flex-1"><div className="font-bold">Your e-certificate is ready</div><div className="muted">No. {a.certificate.number} · issued {fmtDate(a.certificate.issued_at)}</div></div>
                  <Link href={`/verify/${a.certificate.number}`} className="btn">View &amp; print</Link>
                </div>
              )}

              {a.status === "biometric_pending" && (
                <section className="card space-y-4 border-orange-200">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><ScanFace size={20} /> Verify your identity</h2>
                  <p className="text-sm text-ink-700">Take a selfie in good light. You will be asked to turn your head so we know a real person is present.</p>
                  <FaceCapture onCapture={sendFace} />
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <h3 className="flex items-center gap-2 font-semibold"><CalendarClock size={17} /> Prefer to visit{s.requires_fingerprint ? " (required for fingerprints)" : ""}?</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="input" value={appt.center} onChange={(e) => setAppt({ ...appt, center: e.target.value })} aria-label="Service center">
                        <option value="">Choose a service center</option>{centers.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <input className="input" type="datetime-local" value={appt.slot} onChange={(e) => setAppt({ ...appt, slot: e.target.value })} aria-label="Date and time" />
                    </div>
                    <button className="btn btn-ghost" disabled={busy || !appt.center || !appt.slot} onClick={book}>Book appointment</button>
                  </div>
                </section>
              )}

              {a.status === "rejected" && <div className="alert alert-error"><b>Not approved.</b> {a.decision_note}</div>}

              <section className="card">
                <h2 className="font-bold">What you submitted</h2>
                <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {s.form_fields.map((f) => <div key={f.name}><dt className="text-ink-500">{f.label}</dt><dd className="font-medium">{displayAnswer(f, data, meta) || "—"}</dd></div>)}
                </dl>
                {!!a.documents?.length && <ul className="mt-4 flex flex-wrap gap-2">{a.documents.map((d) => <li key={d.id} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs"><FileText size={13} /> {d.filename}</li>)}</ul>}
              </section>

              <Messages appId={a.id} title={`Messages with ${s.institution.code}`} />

              {user?.role === "citizen" && access !== null && (
                <section className="card">
                  <h2 className="flex items-center gap-2 font-bold"><Eye size={18} /> Who has opened your application</h2>
                  <p className="muted mt-1">Every time an official looks at your file it is recorded here, so you always know who has seen your information.</p>
                  <ul className="mt-3 divide-y divide-slate-100 text-sm">
                    {access.map((x, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-x-4 py-2.5">
                        <span><b>{x.viewer_name}</b> · {x.organisation}<span className="block text-ink-500">{x.what}</span></span>
                        <span className="text-xs text-ink-500">{fmtDateTime(x.created_at)}</span>
                      </li>
                    ))}
                    {!access.length && <li className="muted py-2">No official has opened it yet.</li>}
                  </ul>
                </section>
              )}

              {!isAgent && ["approved", "ready_for_collection", "completed", "rejected"].includes(a.status) && (
                <section className="card">
                  <h2 className="font-bold">How was this service?</h2>
                  {a.feedback ? <p className="muted mt-1">You rated it {a.feedback.rating}/5. Thank you!</p> : (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                            <StarIcon size={30} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                          </button>
                        ))}
                      </div>
                      <textarea className="input" rows={2} placeholder="Anything we should improve? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
                      <button className="btn btn-soft" disabled={!rating || busy} onClick={rate}>Send feedback</button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <LockKeyhole size={18} className="mt-0.5 shrink-0" />
            <span>Your answers and documents are encrypted. Only {s.institution.name} staff handling this request can open them.</span>
          </div>
          <div className="card">
            <h2 className="mb-4 font-bold">Progress</h2>
            <Timeline events={a.events || []} />
          </div>
          <div className="card space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Fee</span><b>{money(s.fee_usd)}{hasFee ? (a.paid ? " · paid" : " · unpaid") : ""}</b></div>
            {a.bill_id && <div className="flex justify-between"><span className="text-ink-500">Bill ID</span><b className="font-mono">{a.bill_id}</b></div>}
            {a.due_at && <div className="flex justify-between"><span className="text-ink-500">Expected by</span><b>{fmtDate(a.due_at)}</b></div>}
            {hasFee && a.paid && <Link href={`/receipts/${a.id}`} className="btn btn-soft mt-2 w-full">View payment receipt</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
