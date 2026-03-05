import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();

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
    </div>
  );
}
