const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function backendPing(signal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  const onParentAbort = () => controller.abort();
  signal?.addEventListener("abort", onParentAbort);

  try {
    const response = await fetch(`${API_URL}/ping`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onParentAbort);
  }
}
