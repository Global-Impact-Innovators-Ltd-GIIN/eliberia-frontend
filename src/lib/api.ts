export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type User = {
  id: number; full_name: string; phone: string; role: "citizen" | "officer" | "admin";
  nin?: string; institution_id?: number;
};
export type Field = { name: string; label: string; type: string; required: boolean; options?: string[] };
export type Service = {
  id: number; code: string; name: string; category: string; description: string;
  institution: { id: number; code: string; name: string }; fee_usd: number; sla_days: number;
  requires_face: boolean; requires_fingerprint: boolean; required_documents: string[]; form_fields: Field[];
};
export type AppEvent = { status: string; message: string; actor?: string; created_at: string };
export type Application = {
  id: number; reference: string; status: string; fee_usd: number; paid: boolean; created_at: string;
  updated_at: string; due_at: string | null; decision_note?: string;
  service: { id: number; code: string; name: string; institution: string };
  applicant: { id: number; full_name: string; phone: string };
  data?: Record<string, string>; events?: AppEvent[]; service_detail?: Service;
  documents?: { id: number; doc_type: string; filename: string }[];
  biometrics?: { id: number; kind: string; status: string; source: string }[];
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
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e: any = new Error(data.error || `Request failed (${res.status})`);
    e.status = res.status; e.data = data;
    throw e;
  }
  return data as T;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", in_review: "In review", info_requested: "More info needed",
  biometric_pending: "Identity check needed", approved: "Approved", rejected: "Rejected",
  ready_for_collection: "Ready", completed: "Completed",
};
export const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700", submitted: "bg-blue-100 text-blue-800",
  in_review: "bg-indigo-100 text-indigo-800", info_requested: "bg-amber-100 text-amber-800",
  biometric_pending: "bg-orange-100 text-orange-800", approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", ready_for_collection: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-200 text-emerald-900",
};
