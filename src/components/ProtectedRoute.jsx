import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log("[ProtectedRoute] state =", { loading, userEmail: user?.email, user });

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  return user ? children : <Navigate to="/auth" replace />;
}
