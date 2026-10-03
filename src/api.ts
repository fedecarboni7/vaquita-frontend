const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type ApiRequestOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    const message =
      typeof detail === "object" && detail !== null && "message" in detail
        ? String(detail.message)
        : String(detail);
    super(`HTTP ${status}: ${message}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuthRedirect = false, ...requestOptions } = options;
  const token = localStorage.getItem("access_token");
  const isFormDataBody =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...requestOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && !skipAuthRedirect) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    const detail = error.detail || `HTTP ${response.status}`;
    throw new ApiError(response.status, detail);
  }

  // Si no hay contenido (ej 204 No Content para DELETE), retorna nulo.
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null as unknown as Promise<T>;
  }

  return response.json() as Promise<T>;
}

export async function apiFetchBlob(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  const isFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    const detail = error.detail || `HTTP ${response.status}`;
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  return response;
}
