import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, apiFetch } from "@/api";
import { Button } from "@/components/ui/button";

const inputClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const token = searchParams.get("token");
    if (!token) {
      setError("El link de recuperación no es válido");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
        skipAuthRedirect: true,
      });
      navigate("/login", { state: { message: "Contraseña actualizada. Ya podés iniciar sesión." } });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? "El link de recuperación no es válido o venció" : "No se pudo actualizar la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-medium">Elegí una nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tiene que tener al menos 8 caracteres.</p>
        </div>
        <div className="space-y-3">
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={handleKeyDown} placeholder="Nueva contraseña" className={inputClassName} autoComplete="new-password" maxLength={128} />
          <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} onKeyDown={handleKeyDown} placeholder="Repetí la contraseña" className={inputClassName} autoComplete="new-password" maxLength={128} />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="button" className="w-full" onClick={() => void submit()} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar contraseña"}
          </Button>
          <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">Volver</Link>
        </div>
      </div>
    </div>
  );
}
