const BASE = import.meta.env.API_URL ?? ""; // empty = same origin / Vite proxy

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function call<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError(0, "The registration service is unavailable. Check that the backend and database are running, then try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong");
  return body as T;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const register = (d: { email: string; firstName: string; lastName: string }) =>
  call<{ code: string }>("/api/register", { method: "POST", body: JSON.stringify(d) });

export const recognize = (email: string, signal: AbortSignal) =>
  call<{ registered: boolean }>(`/api/recognize?email=${encodeURIComponent(email)}`, { signal });

export const login = (email: string, code: string) =>
  call<{ token: string; firstName: string; lastName: string }>("/api/login", {
    method: "POST", body: JSON.stringify({ email, code }),
  });

export const submitCheckout = (d: Record<string, string>, token?: string) =>
  call<{ id: string }>("/api/checkout", { method: "POST", body: JSON.stringify(d), token });
