"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import { api, Certificate, fmtDate, fmtSlot } from "@/lib/api";

type Appt = { id: number; application_id: number; center: string; slot: string; status: string };
type Cert = Certificate & { renewal_code?: string | null };

/** Upcoming appointments and documents that expire soon. Renders nothing when there is nothing due. */
export default function ComingUp() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  useEffect(() => {
    api<Appt[]>("/api/applications/appointments/mine").then((r) =>
      setAppts(r.filter((x) => x.status === "booked" && new Date(x.slot).getTime() > Date.now()))).catch(() => {});
    api<Cert[]>("/api/certificates").then((r) => setCerts(r.filter((c) => !c.revoked && c.expires_at &&
      new Date(c.expires_at + "Z").getTime() - Date.now() < 60 * 86400000))).catch(() => {});
  }, []);
  if (!appts.length && !certs.length) return null;
  return (
    <section className="card">
      <h2 className="mb-3 font-bold">Coming up</h2>
      <ul className="space-y-3 text-sm">
        {appts.map((x) => (
          <li key={`a${x.id}`} className="flex gap-2.5">
            <CalendarClock size={17} className="mt-0.5 shrink-0 text-navy-600" />
            <Link href={`/applications/${x.application_id}`} className="hover:underline"><b>Appointment</b> · {fmtSlot(x.slot)}<span className="block text-ink-500">{x.center}</span></Link>
          </li>
        ))}
        {certs.map((c) => (
          <li key={c.number} className="flex gap-2.5">
            <Clock3 size={17} className={`mt-0.5 shrink-0 ${c.expired ? "text-flag-600" : "text-amber-600"}`} />
            <span><b>{c.service_name}</b> {c.expired ? "expired" : "expires"} {fmtDate(c.expires_at)}
              {c.renewal_code && <Link href={`/services/${c.renewal_code}`} className="block font-semibold text-navy-800 hover:underline">Renew now →</Link>}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
