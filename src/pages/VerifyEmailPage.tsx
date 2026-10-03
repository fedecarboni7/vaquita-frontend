import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch, ApiError } from "@/api";
import { useAuth } from "@/context/useAuth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { loginWithAccessToken } = useAuth();
  const hasStarted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const token = searchParams.get("token");
    if (!token) {
      setError("El link de verificación no es válido");
      return;
    }

    void apiFetch<{ access_token: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      skipAuthRedirect: true,
    })
      .then(({ access_token }) => loginWithAccessToken(access_token))
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof ApiError ? "El link de verificación no es válido o venció" : "No se pudo verificar el mail");
      });
  }, [loginWithAccessToken, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-serif font-medium">No pudimos verificar tu mail</h1>
          <p className="text-sm text-destructive">{error}</p>
          <Link to="/login" className="text-sm underline underline-offset-4">Volver a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Verificando tu mail...</div>;
}
