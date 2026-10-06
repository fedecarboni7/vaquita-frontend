import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/api";
import { useAuth } from "@/context/useAuth";

interface EmailAuthFormProps {
  onRegistered: () => void;
}

const inputClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground";

export default function EmailAuthForm({ onRegistered }: EmailAuthFormProps) {
  const { loginWithPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const submit = async () => {
    if (isSubmitting || !email.trim() || password.length < 8) {
      if (password.length > 0 && password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
          skipAuthRedirect: true,
        });
        onRegistered();
      } else {
        await loginWithPassword(email.trim(), password);
      }
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 403) {
        const detail = caughtError.detail;
        if (typeof detail === "object" && detail !== null && "code" in detail && detail.code === "email_not_verified") {
          setError("Verificá tu mail antes de iniciar sesión");
        } else {
          setError("No se pudo iniciar sesión");
        }
      } else if (caughtError instanceof ApiError && caughtError.status === 401) {
        setError("Credenciales inválidas");
      } else if (caughtError instanceof ApiError && caughtError.status === 429) {
        setError(String(caughtError.detail));
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "No se pudo completar la operación");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (isResending || !email.trim()) return;
    setIsResending(true);
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
        skipAuthRedirect: true,
      });
      setError("Si el mail es válido, te enviamos un nuevo link de verificación");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo reenviar el mail");
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  const isUnverifiedError = error === "Verificá tu mail antes de iniciar sesión";

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); }}
          className={mode === "login" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
        >
          Iniciar sesión
        </button>
        <span className="text-border">|</span>
        <button
          type="button"
          onClick={() => { setMode("register"); setError(null); }}
          className={mode === "register" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
        >
          Crear cuenta
        </button>
      </div>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tu mail"
        className={inputClassName}
        autoComplete="email"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Contraseña"
        className={inputClassName}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        maxLength={128}
      />

      {mode === "login" && (
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
            Olvidé mi contraseña
          </Link>
        </div>
      )}

      {error && (
        <div className="space-y-2 text-sm text-destructive" role="alert">
          <p>{error}</p>
          {isUnverifiedError && (
            <button
              type="button"
              onClick={() => void resendVerification()}
              disabled={isResending}
              className="text-xs text-foreground underline underline-offset-4 disabled:opacity-50"
            >
              {isResending ? "Enviando..." : "Reenviar mail de verificación"}
            </button>
          )}
        </div>
      )}

      <Button type="button" className="w-full" onClick={() => void submit()} disabled={isSubmitting}>
        {isSubmitting ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </Button>
    </div>
  );
}
