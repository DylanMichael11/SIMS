import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleProductsClick = () => {
    console.log("=== PRODUCTS NAVIGATION ===");
    console.log("About to navigate to /products");
    
    try {
      navigate("/products");
      console.log("Navigate function called successfully");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>SIMS Dashboard</h1>
      <p>Signed in as {user?.email}</p>

      <button onClick={handleProductsClick}>Go to Products</button>

      <button onClick={logout} style={{ marginLeft: 12 }}>Sign out</button>
      
      {/* Debug info */}
      <div style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', fontSize: '12px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>Current URL: {window.location.href}</p>
        <p>User: {user?.email || 'None'}</p>
      </div>
    </div>
  );
}