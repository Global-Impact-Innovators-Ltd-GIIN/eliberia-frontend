export const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").trim();

export type User = {
  id: number; full_name: string; phone: string; role: "citizen" | "officer" | "admin" | "agent" | "inst_admin";
  perms?: string[] | null; must_change_password?: boolean; nationality?: string | null; id_doc_type?: string | null; id_number?: string | null;
  nin?: string; email?: string; county?: string; dob?: string; institution_id?: number;
};
export type Field = {
  name: string; label: string; type: string; required: boolean; options?: string[];
  help?: string; max_length?: number; doc_types?: string[]; countries?: string[];
};
export type Stage = { name: string; instructions: string; separate_officer: boolean; requires_admin: boolean };
export type StageInfo = { index: number; total: number; name: string; instructions: string; names: string[] };
export type DocRule = { name: string; formats: string[]; max_mb: number; required: boolean; note: string };
export type Institution = { id: number; code: string; name: string; description?: string; guidelines?: string; contact_phone?: string; contact_email?: string };
export type Service = {
  id: number; code: string; name: string; category: string; description: string;
  institution: Institution; fee_usd: number; sla_days: number;
  requires_face: boolean; requires_fingerprint: boolean; required_documents: DocRule[]; form_fields: Field[]; workflow?: Stage[];
  validity_months?: number | null; renewal_code?: string | null;
};
export type AppEvent = { status: string; message: string; actor?: string; created_at: string };
export type Certificate = {
  number: string; holder_name: string; service_name: string; institution_name: string;
  issued_at: string; revoked: boolean; expires_at?: string | null; expired?: boolean;
};
export type Application = {
  id: number; reference: string; status: string; fee_usd: number; paid: boolean; created_at: string;
  updated_at: string; due_at: string | null; decision_note?: string; bill_id?: string | null;
  beneficiary?: { name: string; relation: string } | null; assisted?: boolean; stage?: StageInfo;
  delivery?: { method: "collect" | "courier"; center?: string; address?: string; phone?: string; fee_usd?: number } | null;
  service: { id: number; code: string; name: string; institution: string };
  applicant: { id: number; full_name: string; phone: string };
  data?: Record<string, string>; events?: AppEvent[]; service_detail?: Service;
  documents?: { id: number; doc_type: string; filename: string }[];
  biometrics?: { id: number; kind: string; status: string; source: string; liveness_score?: number; match_score?: number; created_at?: string }[];
  payments?: { id: number; method: string; amount_usd: number; status: string; txn_ref: string; created_at: string }[];
  certificate?: Certificate | null; feedback?: { rating: number; comment?: string } | null;
};

export function getToken() {
  try { return localStorage.getItem("eliberia_token"); } catch { return null; }
}
export function setToken(t: string | null) {
  try { t ? localStorage.setItem("eliberia_token", t) : localStorage.removeItem("eliberia_token"); } catch {}
}

export async function api<T = any>(path: string, opts: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body = opts.body;
  if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...opts, headers, body });
  } catch {
    throw new Error("Cannot reach the server. It may be waking up - please try again in a moment.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e: any = new Error(data.error || `Request failed (${res.status})`);
    e.status = res.status; e.data = data;
    throw e;
  }
  return data as T;
}

export const homeFor = (role: User["role"]) => (role === "citizen" ? "/dashboard" : role === "agent" ? "/agent" : "/staff");
export const isReviewer = (role?: User["role"]) => role === "officer" || role === "inst_admin" || role === "admin";
export const can = (u: User | null | undefined, perm: string) => !!u && u.role === "admin" && (!u.perms || u.perms.includes("all") || u.perms.includes(perm));
export const fmtFormats = (r: DocRule) => `${r.formats.map((f) => f.toUpperCase()).join(", ")} · up to ${r.max_mb} MB`;
export const money = (n: number) => (n > 0 ? `$${n.toFixed(2)}` : "Free");
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-";
/** Appointment times are the service center's own clock: show them as written, never shifted to the viewer's time zone. */
export const fmtSlot = (iso: string) => {
  const [d, t = ""] = iso.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return `${label}, ${t.slice(0, 5)}`;
};
export const fmtDateTime = (iso: string) =>
  new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", in_review: "In review", info_requested: "More info needed",
  biometric_pending: "Identity check needed", approved: "Approved", rejected: "Rejected",
  ready_for_collection: "Ready", completed: "Completed",
};
export const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200", submitted: "bg-blue-50 text-blue-800 ring-blue-200",
  in_review: "bg-indigo-50 text-indigo-800 ring-indigo-200", info_requested: "bg-amber-50 text-amber-900 ring-amber-200",
  biometric_pending: "bg-orange-50 text-orange-900 ring-orange-200", approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-flag-50 text-flag-700 ring-flag-100", ready_for_collection: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-emerald-100 text-emerald-900 ring-emerald-300",
};
