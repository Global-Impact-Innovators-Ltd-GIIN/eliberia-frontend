"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Service } from "@/lib/api";

export default function Services() {
  const [items, setItems] = useState<Service[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { api<string[]>("/api/categories").then(setCats).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      api<Service[]>(`/api/services?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`)
        .then((r) => { setItems(r); setError(""); }).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Services</h1>
      <div className="mb-5 flex flex-wrap gap-3">
        <input className="input max-w-sm" placeholder="Search services..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {error && <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link key={s.code} href={`/services/${s.code}`} className="card transition hover:border-lib-blue">
            <div className="text-xs font-semibold uppercase text-lib-red">{s.category}</div>
            <h3 className="mt-1 font-semibold">{s.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{s.description}</p>
            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>{s.institution.code}</span>
              <span>{s.fee_usd > 0 ? `$${s.fee_usd.toFixed(2)}` : "Free"} · {s.sla_days} days</span>
            </div>
          </Link>
        ))}
        {!items.length && !error && <p className="text-slate-500">No services found.</p>}
      </div>
    </div>
  );
}
