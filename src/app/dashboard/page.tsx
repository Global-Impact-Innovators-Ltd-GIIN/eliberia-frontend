"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api, Application } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Note = { id: number; title: string; body: string; read: boolean; created_at: string };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    api<Application[]>("/api/applications").then(setApps).catch((e) => setError(e.message));
    api<Note[]>("/api/notifications").then(setNotes).catch(() => {});
  }, [user, loading, router]);

  const needsAction = apps.filter((a) => ["info_requested", "biometric_pending", "draft"].includes(a.status));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My applications</h1>
          <Link href="/services" className="btn">New application</Link>
        </div>
        {error && <p className="text-red-700">{error}</p>}
        {needsAction.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {needsAction.length} application(s) need your attention.
          </div>
        )}
        {apps.map((a) => (
          <Link key={a.id} href={`/applications/${a.id}`} className="card flex items-center justify-between hover:border-lib-blue">
            <div>
              <div className="font-semibold">{a.service.name}</div>
              <div className="text-xs text-slate-500">{a.reference} · {a.service.institution}</div>
            </div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
        {!apps.length && !error && <p className="text-slate-500">No applications yet. Browse services to get started.</p>}
      </div>
      <aside className="card h-fit">
        <h2 className="mb-3 font-semibold">Notifications</h2>
        <ul className="space-y-3 text-sm">
          {notes.slice(0, 8).map((n) => (
            <li key={n.id}><div className="font-medium">{n.title}</div><div className="text-slate-600">{n.body}</div></li>
          ))}
          {!notes.length && <li className="text-slate-500">Nothing yet.</li>}
        </ul>
      </aside>
    </div>
  );
}
