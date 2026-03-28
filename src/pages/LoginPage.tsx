import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { user, isLoading, login, loginDev, isDevAuthEnabled } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1.5rem" }}>
      <h1>Expenses Tracker</h1>
      <p>Iniciá sesión con tu cuenta de Google</p>
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

      {isDevAuthEnabled && (
        <>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
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
            style={{
              border: "1px solid #ccc",
              background: "#fff",
              borderRadius: "8px",
              padding: "0.6rem 1rem",
              cursor: "pointer",
            }}
          >
            Entrar en modo desarrollo (offline)
          </button>
        </>
      )}
    </div>
  );
}
