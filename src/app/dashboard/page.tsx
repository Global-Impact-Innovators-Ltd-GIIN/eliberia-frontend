"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, BadgeCheck, Bell, ChevronRight, FilePlus2, FolderOpen, Hourglass } from "lucide-react";
import { Skeleton, StatusBadge } from "@/components/ui";
import { api, Application, fmtDate, fmtDateTime } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Note = { id: number; title: string; body: string; read: boolean; created_at: string };
const ACTION = ["info_requested", "biometric_pending", "draft"];
const DONE = ["approved", "ready_for_collection", "completed"];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "citizen") { router.push("/staff"); return; }
    api<Application[]>("/api/applications").then(setApps).catch((e) => { setError(e.message); setApps([]); });
    api<Note[]>("/api/notifications").then(setNotes).catch(() => {});
  }, [user, loading, router]);

  const list = apps || [];
  const needs = list.filter((a) => ACTION.includes(a.status));
  const stats = [
    { icon: FolderOpen, label: "Total", value: list.length, tint: "bg-navy-50 text-navy-800" },
    { icon: AlertCircle, label: "Need your action", value: needs.length, tint: "bg-amber-50 text-amber-700" },
    { icon: Hourglass, label: "In progress", value: list.filter((a) => ["submitted", "in_review"].includes(a.status)).length, tint: "bg-indigo-50 text-indigo-700" },
    { icon: BadgeCheck, label: "Approved", value: list.filter((a) => DONE.includes(a.status)).length, tint: "bg-emerald-50 text-emerald-700" },
  ];
  const hello = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="muted">{hello},</p><h1 className="text-2xl font-extrabold sm:text-3xl">{user?.full_name || "…"}</h1></div>
        <Link href="/services" className="btn btn-red"><FilePlus2 size={17} /> New application</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 !p-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}><s.icon size={21} /></span>
            <div><div className="text-2xl font-extrabold leading-none">{apps === null ? "–" : s.value}</div><div className="mt-1 text-xs font-medium text-ink-500">{s.label}</div></div>
          </div>
        ))}
      </div>
      {error && <div className="alert alert-error mt-5">{error}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 font-bold">Applications</h2>
          {apps === null && <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
          {apps?.length === 0 && !error && (
            <div className="card text-center">
              <FolderOpen className="mx-auto text-ink-500" size={36} />
              <h3 className="mt-3 font-semibold">No applications yet</h3>
              <p className="muted mt-1">Pick a service to start your first application.</p>
              <Link href="/services" className="btn mt-4">Browse services</Link>
            </div>
          )}
          <div className="space-y-3">
            {list.map((a) => (
              <Link key={a.id} href={`/applications/${a.id}`} className="card card-hover flex items-center gap-4 !p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.service.name}{a.beneficiary ? <span className="font-normal text-ink-500"> · for {a.beneficiary.name}</span> : null}</div>
                  <div className="muted truncate">{a.reference} · {a.service.institution} · {fmtDate(a.created_at)}</div>
                  {ACTION.includes(a.status) && <div className="mt-1 text-xs font-semibold text-amber-700">{a.status === "draft" ? "Finish and submit" : a.status === "biometric_pending" ? "Complete your identity check" : "The officer needs more information"}</div>}
                </div>
                <StatusBadge status={a.status} />
                <ChevronRight size={18} className="shrink-0 text-ink-500" />
              </Link>
            ))}
          </div>
        </section>
        <aside className="card h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Bell size={17} /> Notifications</h2>
          <ul className="space-y-4">
            {notes.slice(0, 7).map((n) => (
              <li key={n.id} className="text-sm">
                <div className="font-semibold">{n.title}</div>
                <div className="text-ink-700">{n.body}</div>
                <div className="mt-0.5 text-xs text-ink-500">{fmtDateTime(n.created_at)}</div>
              </li>
            ))}
            {!notes.length && <li className="muted">You&apos;re all caught up.</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
