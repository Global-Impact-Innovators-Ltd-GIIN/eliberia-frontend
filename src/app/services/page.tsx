"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Fingerprint, ScanFace, Search, SearchX } from "lucide-react";
import { CategoryIcon, Skeleton } from "@/components/ui";
import { api, money, Service } from "@/lib/api";

function Catalog() {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState(params.get("category") || "");
  const [items, setItems] = useState<Service[] | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { api<string[]>("/api/categories").then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (cat) qs.set("category", cat);
      router.replace(`/services${qs.size ? `?${qs}` : ""}`, { scroll: false });
      api<Service[]>(`/api/services?${qs}`).then((r) => { setItems(r); setError(""); }).catch((e) => { setError(e.message); setItems([]); });
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, router]);

  const groups = useMemo(() => {
    const g: Record<string, Service[]> = {};
    (items || []).forEach((s) => { (g[s.category] ||= []).push(s); });
    return Object.entries(g);
  }, [items]);

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-x py-8">
          <div className="eyebrow">Service catalog</div>
          <h1 className="mt-1 text-3xl font-extrabold">All services</h1>
          <div className="relative mt-5 max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input className="input !py-3 !pl-10" placeholder="Search by name, agency or keyword" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search services" />
          </div>
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button className={`chip ${cat === "" ? "chip-on" : ""}`} onClick={() => setCat("")}>All</button>
            {cats.map((c) => <button key={c} className={`chip ${cat === c ? "chip-on" : ""}`} onClick={() => setCat(cat === c ? "" : c)}>{c}</button>)}
          </div>
        </div>
      </div>
      <div className="container-x py-8">
        {error && <div className="alert alert-error mb-5">{error}</div>}
        {items === null && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>}
        {items?.length === 0 && !error && (
          <div className="card mx-auto max-w-md text-center">
            <SearchX className="mx-auto text-ink-500" size={36} />
            <h2 className="mt-3 font-semibold">No services match “{q}”</h2>
            <p className="muted mt-1">Try a shorter word, or clear the filters.</p>
            <button className="btn btn-soft mt-4" onClick={() => { setQ(""); setCat(""); }}>Clear search</button>
          </div>
        )}
        <div className="space-y-10">
          {groups.map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold"><CategoryIcon category={category} size={32} /> {category} <span className="text-sm font-medium text-ink-500">({list.length})</span></h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <Link key={s.code} href={`/services/${s.code}`} className="card card-hover group flex flex-col">
                    <h3 className="font-semibold leading-snug">{s.name}</h3>
                    <p className="muted">{s.institution.name}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-700">{s.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      {s.requires_face && <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 font-medium text-navy-800"><ScanFace size={12} /> Selfie check</span>}
                      {s.requires_fingerprint && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800"><Fingerprint size={12} /> One visit</span>}
                      {!s.requires_face && !s.requires_fingerprint && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">100% online</span>}
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                      <span className="font-bold text-navy-800">{money(s.fee_usd)}</span>
                      <span className="flex items-center gap-1 text-ink-500"><Clock size={14} /> {s.sla_days} days</span>
                      <ArrowRight size={16} className="text-navy-800 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  return <Suspense fallback={<div className="container-x py-10"><Skeleton className="h-40" /></div>}><Catalog /></Suspense>;
}
