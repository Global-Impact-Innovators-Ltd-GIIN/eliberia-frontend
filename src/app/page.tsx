"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Clock, FileCheck2, ScanFace, Search, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { CategoryIcon, Skeleton, Star } from "@/components/ui";
import { api, money, Service } from "@/lib/api";

type Stats = { services: number; institutions: number; applications: number; certificates: number; rating: number | null };
const QUICK = ["Passport", "National ID", "Driver's license", "Business registration", "Birth certificate"];
const STEPS = [
  { icon: Smartphone, t: "Create your account", d: "Register once with your phone number. One account works for every agency." },
  { icon: Wallet, t: "Apply and pay", d: "Fill one guided form, upload documents, and pay your bill by mobile money." },
  { icon: ScanFace, t: "Verify from home", d: "Prove it is you with a selfie and liveness check - no queue, no travel." },
  { icon: FileCheck2, t: "Receive your certificate", d: "Track every step live and get a signed e-certificate anyone can verify." },
];

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [popular, setPopular] = useState<Service[] | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Service[]>("/api/services/popular").then(setPopular).catch(() => setPopular([]));
    api<string[]>("/api/categories").then(setCats).catch(() => {});
    api<Stats>("/api/public/stats").then(setStats).catch(() => {});
  }, []);
  const go = (term: string) => router.push(`/services?q=${encodeURIComponent(term)}`);

  return (
    <div>
      <section className="hero-bg relative overflow-hidden text-white">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <Star size={340} className="absolute -right-20 -top-24 text-white/[0.04]" />
        <div className="container-x relative py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Official digital services of the Republic of Liberia
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            Government services, <span className="text-flag-100">without the queue.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-navy-100">
            Apply, pay, verify your identity and receive your documents from the comfort of your home.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lift">
            <Search className="ml-3 shrink-0 text-ink-500" size={20} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you need? Try “passport”" aria-label="Search services"
              className="w-full bg-transparent px-1 py-2.5 text-base text-ink-900 placeholder:text-ink-500 focus:outline-none" />
            <button className="btn btn-red btn-lg shrink-0">Search</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((t) => (
              <button key={t} onClick={() => go(t.split(" ")[0])} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-navy-100 transition hover:bg-white/15">{t}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x -mt-8 relative">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:grid-cols-4 sm:divide-y-0">
          {[
            [stats?.services, "Services online"], [stats?.institutions, "Institutions connected"],
            [stats?.applications, "Applications received"], [stats?.rating ? `${stats.rating}/5` : "24/7", stats?.rating ? "Citizen rating" : "Always open"],
          ].map(([v, l]) => (
            <div key={String(l)} className="p-5 text-center">
              <div className="text-2xl font-extrabold text-navy-800 sm:text-3xl">{v ?? <Skeleton className="mx-auto h-8 w-14" />}</div>
              <div className="mt-1 text-xs font-medium text-ink-500 sm:text-sm">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="flex items-end justify-between">
          <div><div className="eyebrow">Categories</div><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Find a service by topic</h2></div>
          <Link href="/services" className="hidden items-center gap-1 text-sm font-semibold text-navy-800 hover:underline sm:flex">All services <ArrowRight size={15} /></Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(cats.length ? cats : Array(9).fill("")).map((c, i) => c ? (
            <Link key={c} href={`/services?category=${encodeURIComponent(c)}`} className="card card-hover flex items-center gap-3 !p-4">
              <CategoryIcon category={c} size={40} /><span className="font-semibold">{c}</span>
            </Link>
          ) : <Skeleton key={i} className="h-[72px]" />)}
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="eyebrow">Most requested</div>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Popular services</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular === null && Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)}
          {popular?.map((s) => (
            <Link key={s.code} href={`/services/${s.code}`} className="card card-hover group flex flex-col">
              <div className="flex items-start gap-3">
                <CategoryIcon category={s.category} />
                <div className="min-w-0"><h3 className="font-semibold leading-snug">{s.name}</h3><p className="muted truncate">{s.institution.name}</p></div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink-700">{s.description}</p>
              <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                <span className="font-bold text-navy-800">{money(s.fee_usd)}</span>
                <span className="flex items-center gap-1 text-ink-500"><Clock size={14} /> {s.sla_days} days</span>
                <span className="flex items-center gap-1 font-semibold text-navy-800 opacity-0 transition group-hover:opacity-100">Apply <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x mt-20">
        <div className="text-center"><div className="eyebrow">How it works</div><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Four steps. Zero queues.</h2></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="card relative">
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-slate-100">{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-white"><s.icon size={22} strokeWidth={1.8} /></span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-ink-700">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-20">
        <div className="grid overflow-hidden rounded-xl2 bg-navy-900 text-white lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <div className="eyebrow !text-flag-100">Trust built in</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Every certificate can be checked in seconds.</h2>
            <p className="mt-3 text-navy-100">Documents issued through eLiberia carry a QR code and a digital signature. Employers, banks and embassies can confirm they are genuine - no phone calls, no forgeries.</p>
            <Link href="/verify" className="btn btn-red btn-lg mt-6"><BadgeCheck size={18} /> Verify a certificate</Link>
          </div>
          <ul className="grid content-center gap-5 bg-white/5 p-8 sm:p-12">
            {[
              [ShieldCheck, "Account protection", "Lockout after repeated wrong passwords and sign-out of all devices."],
              [ScanFace, "Remote identity check", "Selfie with liveness detection, sent securely to the agency."],
              [Wallet, "Pay your way", "Each application has a bill ID payable with Orange Money or MTN MoMo."],
            ].map(([Icon, t, d]: any) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Icon size={20} /></span>
                <div><div className="font-semibold">{t}</div><div className="text-sm text-navy-200">{d}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
