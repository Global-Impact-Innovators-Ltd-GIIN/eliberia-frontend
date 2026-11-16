"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, FolderLock, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { api, Certificate, fmtDate, homeFor } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Item = Certificate & { reference: string; application_id: number };

export default function Documents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "citizen") { router.push(homeFor(user.role)); return; }
    api<Item[]>("/api/certificates").then(setItems).catch(() => setItems([]));
  }, [user, loading, router]);

  return (
    <div className="container-x py-8">
      <div className="eyebrow">Document wallet</div>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">My documents</h1>
      <p className="muted mt-1">Every certificate issued to you through eLiberia, ready to show, print or share.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items === null && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
        {items?.map((c) => (
          <Link key={c.number} href={`/verify/${c.number}`} className="card card-hover relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1.5 ${c.revoked ? "bg-flag-600" : "bg-gradient-to-r from-flag-600 via-white to-navy-800"}`} />
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.revoked ? "bg-flag-50 text-flag-700" : "bg-emerald-50 text-emerald-700"}`}>{c.revoked ? <ShieldAlert size={22} /> : <BadgeCheck size={22} />}</span>
            <h2 className="mt-3 font-bold leading-snug">{c.service_name}</h2>
            <p className="muted">{c.institution_name}</p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Holder</dt><dd className="font-medium">{c.holder_name}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Issued</dt><dd className="font-medium">{fmtDate(c.issued_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Number</dt><dd className="font-mono text-xs font-semibold">{c.number}</dd></div>
            </dl>
            {c.revoked && <p className="mt-3 text-xs font-bold uppercase tracking-wide text-flag-700">Revoked</p>}
          </Link>
        ))}
      </div>
      {items?.length === 0 && (
        <div className="card mx-auto mt-2 max-w-md text-center">
          <FolderLock className="mx-auto text-ink-500" size={36} />
          <h2 className="mt-3 font-semibold">No documents yet</h2>
          <p className="muted mt-1">When an application is approved, its certificate appears here.</p>
          <Link href="/services" className="btn mt-4">Browse services</Link>
        </div>
      )}
    </div>
  );
}
