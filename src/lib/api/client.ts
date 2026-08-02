export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number, public readonly fields?: Record<string, string>) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null) as { ok?: boolean; data?: T; error?: { message?: string; fields?: Record<string, string> } } | null;
  if (!response.ok || !payload?.ok) {
    throw new ApiClientError(payload?.error?.message ?? "Permintaan gagal.", response.status, payload?.error?.fields);
  }
  return payload.data as T;
}
