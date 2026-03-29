import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { user, isLoading, login, loginDev, isDevAuthEnabled } = useAuth();

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
          <h1 className="text-2xl font-serif font-medium">Expenses Tracker</h1>
          <p className="text-sm text-muted-foreground">Iniciá sesión con tu cuenta de Google</p>
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
