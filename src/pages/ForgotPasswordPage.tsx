import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiFetch } from "@/api";
import { Button } from "@/components/ui/button";

const inputClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting || !email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
        skipAuthRedirect: true,
      });
      setSubmitted(true);
    } catch (caughtError) {
      const message = caughtError instanceof ApiError && caughtError.status === 429
        ? String(caughtError.detail)
        : "No se pudo procesar la solicitud";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-medium">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresá tu mail y te mandamos un link.</p>
        </div>
        {submitted ? (
          <div className="space-y-4 text-sm">
            <p>Si el mail existe, te enviamos un link para restablecer tu contraseña.</p>
            <Link to="/login" className="text-sm underline underline-offset-4">Volver a iniciar sesión</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
              placeholder="Tu mail"
              className={inputClassName}
              autoComplete="email"
            />
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="button" className="w-full" onClick={() => void submit()} disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? "Enviando..." : "Enviar link"}
            </Button>
            <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">Volver</Link>
          </div>
        )}
      </div>
    </div>
  );
}
