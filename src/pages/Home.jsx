import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>SIMS Dashboard</h1>
      <p>Signed in as {user?.email}</p>

      <button onClick={() => navigate("/products")}>Go to Products</button>

      <button onClick={logout} style={{ marginLeft: 12 }}>Sign out</button>
    </div>
  );
}
