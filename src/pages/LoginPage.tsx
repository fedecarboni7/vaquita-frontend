import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";
import { getAppLogoUrl } from "@/constants/branding";
import { useTheme } from "@/hooks/useTheme";
import EmailAuthForm from "@/components/EmailAuthForm";

export default function LoginPage() {
  const { user, isLoading, login, loginDev, isDevAuthEnabled } = useAuth();
  const { isDark } = useTheme();
  const appLogoUrl = getAppLogoUrl(isDark);
  const location = useLocation();
  const [isRegistered, setIsRegistered] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p>Cargando...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-7 text-center shadow-xs space-y-5">
        <div className="space-y-1.5">
          <img
            src={appLogoUrl}
            alt="vaquita logo"
            className="mx-auto h-20 w-20 rounded-2xl object-cover"
          />
          <h1 className="text-2xl font-serif font-medium" style={{ fontFamily: "'Quicksand', sans-serif" }}>vaquita</h1>
          <p className="text-sm text-muted-foreground">Iniciá sesión con tu cuenta</p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  await login(credentialResponse.credential);
                } catch (error) {
                  console.error("Login failed:", error);
                }
              }
            }}
            onError={() => {
              console.error("Google Login Failed");
            }}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {isRegistered ? (
          <div className="space-y-3 text-left text-sm">
            <p>Revisá tu mail para verificar tu cuenta.</p>
            <p className="text-xs text-muted-foreground">
              Si ya tenés cuenta con Google, entrá con Google o usá &quot;Olvidé mi contraseña&quot;.
            </p>
            <button
              type="button"
              onClick={() => setIsRegistered(false)}
              className="text-xs underline underline-offset-4"
            >
              Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <EmailAuthForm onRegistered={() => setIsRegistered(true)} />
        )}

        {location.state?.message && (
          <p className="text-sm text-green-700 dark:text-green-400">{location.state.message}</p>
        )}

        {isDevAuthEnabled && (
          <div className="space-y-2.5">
            <p className="m-0 text-sm text-muted-foreground">
              O iniciá con acceso local de desarrollo
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await loginDev();
                } catch (error) {
                  console.error("Dev login failed:", error);
                }
              }}
              className="w-full border border-border bg-background rounded-md px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              Entrar en modo desarrollo (offline)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
