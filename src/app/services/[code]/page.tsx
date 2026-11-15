"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Clock, FileText, Fingerprint, Landmark, ScanFace, Users, UserRound, Wallet } from "lucide-react";
import { CategoryIcon, Skeleton } from "@/components/ui";
import { api, money, Service } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ServiceDetail({ params }: { params: { code: string } }) {
  const [s, setS] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState<"me" | "other">("me");
  const [ben, setBen] = useState({ name: "", relation: "Child" });
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => { api<Service>(`/api/services/${params.code}`).then(setS).catch((e) => setError(e.message)); }, [params.code]);

  async function start() {
    if (!user) return router.push("/login");
    setBusy(true); setError("");
    try {
      const a = await api(`/api/applications`, { method: "POST", json: { service_code: params.code, beneficiary: who === "other" ? ben : undefined } });
      router.push(`/applications/${a.id}`);
    } catch (e: any) { setError(e.message); setBusy(false); }
  }

  if (error && !s) return <div className="container-x py-10"><div className="alert alert-error">{error}</div></div>;
  if (!s) return <div className="container-x grid gap-6 py-10 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-64" /></div>;

  const journey = [
    "Fill in the online form" + (s.required_documents.length ? " and upload your documents" : ""),
    ...(s.fee_usd > 0 ? [`Pay ${money(s.fee_usd)} with mobile money using your bill ID`] : []),
    `${s.institution.code} reviews your application`,
    ...(s.requires_face ? ["Verify your identity with a selfie from home"] : []),
    ...(s.requires_fingerprint ? ["Give fingerprints once at a service center (by appointment)"] : []),
    "Receive your signed e-certificate",
  ];

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-x py-8">
          <nav className="flex items-center gap-1 text-sm text-ink-500" aria-label="Breadcrumb">
            <Link href="/services" className="hover:text-navy-800">Services</Link><ChevronRight size={14} />
            <Link href={`/services?category=${s.category}`} className="hover:text-navy-800">{s.category}</Link>
          </nav>
          <div className="mt-4 flex items-start gap-4">
            <CategoryIcon category={s.category} size={56} />
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{s.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-ink-700"><Landmark size={15} /> {s.institution.name}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container-x grid gap-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="font-bold">About this service</h2>
            <p className="mt-2 text-ink-700">{s.description}</p>
          </section>
          <section className="card">
            <h2 className="font-bold">What happens</h2>
            <ol className="mt-4 space-y-4">
              {journey.map((j, i) => (
                <li key={j} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-800">{i + 1}</span>
                  <span className="pt-0.5 text-ink-700">{j}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="card">
            <h2 className="font-bold">Have these ready</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {s.required_documents.map((d) => <li key={d} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm"><FileText size={16} className="text-navy-600" /> {d}</li>)}
            </ul>
            <p className="muted mt-3">Clear photos or PDF scans, up to 8 MB each.</p>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-navy-50 p-3"><div className="flex items-center gap-1.5 text-xs font-medium text-ink-500"><Wallet size={13} /> Fee</div><div className="mt-0.5 text-xl font-extrabold text-navy-800">{money(s.fee_usd)}</div></div>
              <div className="rounded-xl bg-navy-50 p-3"><div className="flex items-center gap-1.5 text-xs font-medium text-ink-500"><Clock size={13} /> Ready in</div><div className="mt-0.5 text-xl font-extrabold text-navy-800">{s.sla_days} days</div></div>
            </div>
            <ul className="space-y-2 text-sm text-ink-700">
              <li className="flex items-center gap-2">{s.requires_face ? <ScanFace size={16} className="text-navy-600" /> : <CheckCircle2 size={16} className="text-emerald-600" />}{s.requires_face ? "Selfie identity check from home" : "No identity check needed"}</li>
              {s.requires_fingerprint && <li className="flex items-center gap-2"><Fingerprint size={16} className="text-amber-600" /> One fingerprint visit</li>}
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> Signed, verifiable e-certificate</li>
            </ul>
            {user && (
              <fieldset>
                <legend className="label">Who is this application for?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {([["me", "Myself", UserRound], ["other", "Someone else", Users]] as const).map(([v, l, Icon]) => (
                    <button key={v} type="button" onClick={() => setWho(v)} aria-pressed={who === v}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${who === v ? "border-navy-800 bg-navy-50 text-navy-800" : "border-ink-300 text-ink-700 hover:border-navy-400"}`}>
                      <Icon size={15} /> {l}
                    </button>
                  ))}
                </div>
                {who === "other" && (
                  <div className="mt-3 space-y-2">
                    <input className="input" placeholder="Their full name" value={ben.name} onChange={(e) => setBen({ ...ben, name: e.target.value })} aria-label="Full name of the person" />
                    <select className="input" value={ben.relation} onChange={(e) => setBen({ ...ben, relation: e.target.value })} aria-label="Your relationship">
                      {["Child", "Parent", "Spouse", "Sibling", "Other"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </fieldset>
            )}
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-red btn-lg w-full" onClick={start} disabled={busy || (who === "other" && ben.name.trim().length < 3)}>
              {busy ? "Starting…" : user ? "Start application" : "Sign in to apply"}
            </button>
            {!user && <p className="muted text-center">New here? <Link className="font-semibold text-navy-800 hover:underline" href="/register">Create an account</Link></p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
