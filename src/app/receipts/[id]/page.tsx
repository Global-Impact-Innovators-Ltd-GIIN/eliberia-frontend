"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
import { Skeleton, Star } from "@/components/ui";
import { api, Application, fmtDateTime, money } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const METHOD: Record<string, string> = { orange_money: "Orange Money", mtn_momo: "MTN MoMo", agent_cash: "Cash via agent", card: "Card", bank: "Bank transfer" };

export default function Receipt({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<Application | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    api<Application>(`/api/applications/${params.id}`).then(setA).catch((e) => setError(e.message));
  }, [user, loading, router, params.id]);

  if (error) return <div className="container-x py-10"><div className="alert alert-error">{error}</div></div>;
  if (!a) return <div className="container-x py-10"><Skeleton className="mx-auto h-96 max-w-lg" /></div>;
  const p = a.payments?.find((x) => x.status === "success");
  if (!p) return <div className="container-x py-10"><div className="alert alert-warn mx-auto max-w-lg">No completed payment for this application yet.</div></div>;

  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-lg">
        <Link href={`/applications/${a.id}`} className="no-print inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-navy-800"><ArrowLeft size={15} /> Back to application</Link>
        <article className="mt-3 overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-lift print:shadow-none">
          <div className="h-2 bg-gradient-to-r from-flag-600 via-white to-navy-800" />
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-flag-600 text-white"><Star size={20} /></span>
                <div><div className="font-extrabold text-navy-900">eLiberia</div><div className="text-xs text-ink-500">Official payment receipt</div></div></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 size={14} /> PAID</span>
            </div>
            <div className="mt-8 text-center"><div className="muted">Amount paid</div><div className="text-4xl font-extrabold text-navy-900">{money(p.amount_usd)}</div></div>
            <dl className="mt-8 divide-y divide-slate-100 text-sm">
              {[["Service", a.service.name], ["Institution", a.service.institution], ["Paid by", a.applicant.full_name],
                ["Payment method", METHOD[p.method] || p.method], ["Date", fmtDateTime(p.created_at)],
                ["Transaction", p.txn_ref], ["Bill ID", a.bill_id || "-"], ["Application", a.reference]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-6 text-center text-xs text-ink-500">Pilot mode - payments are simulated and no money was charged.</p>
          </div>
        </article>
        <div className="no-print mt-5 text-right"><button className="btn" onClick={() => window.print()}><Printer size={16} /> Print / save as PDF</button></div>
      </div>
    </div>
  );
}
