"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, Printer, ShieldAlert } from "lucide-react";
import { Skeleton, Star } from "@/components/ui";
import { api, Certificate, fmtDate } from "@/lib/api";

type Res = Partial<Certificate> & { valid: boolean; reason?: string };

export default function VerifyCertificate({ params }: { params: { number: string } }) {
  const number = decodeURIComponent(params.number).toUpperCase();
  const [res, setRes] = useState<Res | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
    api<Res>(`/api/verify/${encodeURIComponent(number)}`).then(setRes)
      .catch((e) => setRes(e.data?.valid === false ? e.data : { valid: false, reason: e.message }));
  }, [number]);

  if (!res) return <div className="container-x py-10"><Skeleton className="mx-auto h-96 max-w-2xl" /></div>;

  if (!res.valid) return (
    <div className="container-x py-14">
      <div className="card mx-auto max-w-lg border-flag-100 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-flag-600 text-white"><ShieldAlert size={30} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">Not verified</h1>
        <p className="mt-1 font-mono text-sm text-ink-500">{number}</p>
        <p className="mt-3 text-ink-700">{res.reason || "This certificate could not be verified."}</p>
        <p className="muted mt-2">Do not accept this document as proof. Check the number and try again.</p>
        <Link href="/verify" className="btn btn-ghost mt-5">Check another</Link>
      </div>
    </div>
  );

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="alert alert-ok no-print mb-5 items-center">
          <BadgeCheck size={20} className="shrink-0" />
          <span><b>Genuine.</b> This certificate was issued through eLiberia and its digital signature is intact.</span>
        </div>
        <article className="relative overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-lift print:shadow-none">
          <div className="h-2 bg-gradient-to-r from-flag-600 via-white to-navy-800" />
          <Star size={300} className="pointer-events-none absolute -right-16 top-24 text-navy-50" />
          <div className="relative p-8 sm:p-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-flag-600 text-white"><Star size={24} /></span>
                <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Republic of Liberia</div><div className="font-bold text-navy-900">{res.institution_name}</div></div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">VERIFIED</span>
            </div>
            <div className="mt-10 text-center">
              <div className="eyebrow">Electronic certificate</div>
              <h1 className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">{res.service_name}</h1>
              <p className="muted mt-6">This certifies that the application of</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">{res.holder_name}</p>
              <p className="muted mt-2">was reviewed and approved by the {res.institution_name}.</p>
            </div>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 pt-6">
              <dl className="space-y-2 text-sm">
                <div><dt className="text-ink-500">Certificate number</dt><dd className="font-mono font-bold">{res.number}</dd></div>
                <div><dt className="text-ink-500">Date of issue</dt><dd className="font-semibold">{fmtDate(res.issued_at)}</dd></div>
              </dl>
              <div className="text-center">
                {url && <QRCodeSVG value={url} size={112} level="M" fgColor="#001B47" />}
                <div className="mt-1 text-[10px] text-ink-500">Scan to verify</div>
              </div>
            </div>
          </div>
        </article>
        <div className="no-print mt-5 flex justify-between">
          <Link href="/verify" className="btn btn-ghost">Check another</Link>
          <button className="btn" onClick={() => window.print()}><Printer size={16} /> Print / save as PDF</button>
        </div>
      </div>
    </div>
  );
}
