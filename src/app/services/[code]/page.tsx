"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Service } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ServiceDetail({ params }: { params: { code: string } }) {
  const [s, setS] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => { api<Service>(`/api/services/${params.code}`).then(setS).catch((e) => setError(e.message)); }, [params.code]);

  async function start() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const a = await api(`/api/applications`, { method: "POST", json: { service_code: params.code } });
      router.push(`/applications/${a.id}`);
    } catch (e: any) { setError(e.message); setBusy(false); }
  }

  if (error && !s) return <p className="text-red-700">{error}</p>;
  if (!s) return <p>Loading...</p>;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-xs font-semibold uppercase text-lib-red">{s.category} · {s.institution.name}</div>
      <h1 className="text-2xl font-bold">{s.name}</h1>
      <p className="text-slate-700">{s.description}</p>
      <div className="card grid gap-3 text-sm sm:grid-cols-3">
        <div><div className="text-slate-500">Fee</div><div className="font-semibold">{s.fee_usd > 0 ? `$${s.fee_usd.toFixed(2)}` : "Free"}</div></div>
        <div><div className="text-slate-500">Processing time</div><div className="font-semibold">{s.sla_days} working days</div></div>
        <div><div className="text-slate-500">Identity check</div>
          <div className="font-semibold">{s.requires_face ? "Selfie (remote)" : "None"}{s.requires_fingerprint ? " + fingerprints at a center" : ""}</div></div>
      </div>
      <div className="card">
        <h2 className="mb-2 font-semibold">Documents you will need</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700">{s.required_documents.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn btn-red" onClick={start} disabled={busy}>{user ? "Start application" : "Sign in to apply"}</button>
    </div>
  );
}
