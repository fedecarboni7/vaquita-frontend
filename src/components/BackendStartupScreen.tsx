import { useState, useEffect } from "react";
import { getAppLogoUrl } from "@/constants/branding";
import { useTheme } from "@/hooks/useTheme";

const DELAYED_MESSAGE_MS = 30_000;

export function BackendStartupScreen() {
  const { isDark } = useTheme();
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline) return;
    const id = setTimeout(() => setShowDelayedMessage(true), DELAYED_MESSAGE_MS);
    return () => clearTimeout(id);
  }, [isOffline]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <img
        src={getAppLogoUrl(isDark)}
        alt="Vaquita"
        className="mb-6 h-16 w-16"
      />
      {isOffline ? (
        <h1 className="text-xl font-semibold text-foreground">
          Sin conexión a Internet.
        </h1>
      ) : (
        <>
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Despertando el servidor...
          </h1>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            {showDelayedMessage
              ? "El servidor está tardando más de lo habitual en iniciar."
              : "La aplicación estuvo inactiva durante un tiempo. Estamos iniciando el servidor. Esto normalmente tarda unos segundos."}
          </p>
          <div className="mt-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </>
      )}
    </div>
  );
}
