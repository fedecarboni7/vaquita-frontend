import { useState, useEffect, type ReactNode } from "react";
import { backendPing } from "@/lib/backendPing";
import { BackendStartupScreen } from "@/components/BackendStartupScreen";

export function BackendStartupProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let pingController: AbortController | undefined;

    const poll = () => {
      if (cancelled) return;
      pingController?.abort();
      pingController = new AbortController();
      backendPing(pingController.signal).then((ok) => {
        if (ok && !cancelled) {
          stopPolling();
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
          setIsReady(true);
        }
      });
    };

    const startPolling = () => {
      stopPolling();
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      poll();
      pollTimer = setInterval(poll, 2000);
    };

    const stopPolling = () => {
      clearInterval(pollTimer);
      pollTimer = undefined;
    };

    const handleOnline = () => startPolling();
    const handleOffline = () => {
      stopPolling();
      pingController?.abort();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    startPolling();

    return () => {
      cancelled = true;
      stopPolling();
      pingController?.abort();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isReady) return <BackendStartupScreen />;

  return <>{children}</>;
}
