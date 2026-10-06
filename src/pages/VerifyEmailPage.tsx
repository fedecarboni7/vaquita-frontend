import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, ApiError } from "@/api";
import { useAuth } from "@/context/useAuth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading, loginWithAccessToken } = useAuth();
  const inFlightVerification = useRef<{ token: string; promise: Promise<void> } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const token = searchParams.get("token");
  const missingTokenError = token ? null : "El link de verificación no es válido";

  useEffect(() => {
    if (!token) {
      return;
    }
    if (inFlightVerification.current?.token === token) {
      return;
    }

    const promise = apiFetch<{ access_token: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      skipAuthRedirect: true,
    })
      .then(async ({ access_token }) => {
        await loginWithAccessToken(access_token);
        navigate("/", { replace: true });
      })
      .catch((caughtError: unknown) => {
        setVerificationError(
          caughtError instanceof ApiError
            ? "El link de verificación no es válido o venció"
            : "No se pudo verificar el mail",
        );
        setVerificationFailed(true);
      });

    inFlightVerification.current = { token, promise };
  }, [loginWithAccessToken, navigate, token]);

  useEffect(() => {
    if (!verificationFailed) {
      return;
    }
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user, verificationFailed]);

  const displayedError =
    missingTokenError ??
    (!isLoading && verificationFailed ? verificationError ?? "No se pudo verificar el mail" : null);

  if (displayedError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-serif font-medium">No pudimos verificar tu mail</h1>
          <p className="text-sm text-destructive">{displayedError}</p>
          <Link to="/login" className="text-sm underline underline-offset-4">Volver a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Verificando tu mail...</div>;
}
