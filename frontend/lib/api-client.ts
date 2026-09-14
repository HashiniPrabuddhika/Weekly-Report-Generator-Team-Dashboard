import { getToken } from "./auth-token";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // No content (e.g. some 204s) — nothing to parse.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // Matches the backend's HttpExceptionFilter shape: { statusCode, path, timestamp, message }
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : (data?.message ?? `Request failed with status ${res.status}`);
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
