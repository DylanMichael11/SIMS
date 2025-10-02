// src/pages/Home.jsx - with Reports links added
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendTestLowStockNotification } from "../utils/emailNotifications";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStockItems: 0,
    totalValue: 0,
    loading: true,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();

    const setupRealtimeListener = async () => {
      try {
        const { db } = await import("../firebase");
        const { collection, onSnapshot } = await import("firebase/firestore");

        const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
          const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          calculateMetrics(products);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error setting up real-time listener:", error);
      }
    };

    let unsubscribe;
    setupRealtimeListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const calculateMetrics = (products) => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const lowStockItems = products.filter(
      (p) => Number(p.quantity || 0) <= Number(p.minQty || 5)
    );
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.quantity || 0) * Number(p.price || 0),
      0
    );

    setMetrics({
      totalProducts,
      totalUnits,
      lowStockItems: lowStockItems.length,
      totalValue,
      loading: false,
    });

    setRecentProducts(products.slice(0, 5));
    setLowStockProducts(lowStockItems);
  };

  const loadDashboardData = async () => {
    try {
      const { db } = await import("../firebase");
      const { collection, getDocs } = await import("firebase/firestore");

      const snapshot = await getDocs(collection(db, "products"));
      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      calculateMetrics(products);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  const sendTestNotification = async () => {
    if (lowStockProducts.length === 0) {
      alert("No low stock items found for testing");
      return;
    }

    const result = await sendTestLowStockNotification(lowStockProducts, user?.email);

    if (result.sent) {
      alert("Email sent successfully!");
    } else {
      alert("Failed to send email: " + (result.error || result.reason));
    }
  };

  const MetricCard = ({ title, value, subtitle, color = "#007bff", icon, alert = false }) => (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: `3px solid ${alert ? "#dc3545" : color}`,
        textAlign: "center",
        minWidth: "180px",
        position: "relative",
      }}
    >
      {alert && (
        <div
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            backgroundColor: "#dc3545",
            color: "white",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          !
        </div>
      )}
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: alert ? "#dc3545" : color }}>
        {value}
      </div>
      <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "12px", color: "#666" }}>{subtitle}</div>}
    </div>
  );

  if (metrics.loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>SIMS Dashboard</h1>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: "#2c3e50" }}>SIMS Dashboard</h1>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>
              Welcome back, {user?.email?.split("@")[0]}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => navigate("/products")}
              style={{
                padding: "12px 24px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Manage Inventory
            </button>

            {/* NEW: Reports button */}
            <button
              onClick={() => navigate("/reports")}
              style={{
                padding: "12px 24px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              📊 Reports
            </button>

            <button
              onClick={logout}
              style={{
                padding: "12px 24px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {metrics.lowStockItems > 0 && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ color: "#856404" }}>Low Stock Alert</strong>
              <p style={{ margin: "4px 0 0 0", color: "#856404" }}>
                {metrics.lowStockItems} items are running low and may need restocking
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={sendTestNotification}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffc107",
                  color: "#212529",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Send Email Alert
              </button>
              <button
                onClick={() => navigate("/products")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#856404",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Review Items
              </button>
            </div>
          </div>
        )}

        {/* Live Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <MetricCard title="Total Products" value={metrics.totalProducts} subtitle="Product types" color="#28a745" icon="📦" />
          <MetricCard title="Total Units" value={metrics.totalUnits.toLocaleString()} subtitle="Items in stock" color="#007bff" icon="📊" />
          <MetricCard
            title="Low Stock Alert"
            value={metrics.lowStockItems}
            subtitle="Items need attention"
            color={metrics.lowStockItems > 0 ? "#dc3545" : "#28a745"}
            icon={metrics.lowStockItems > 0 ? "⚠️" : "✅"}
            alert={metrics.lowStockItems > 0}
          />
          <MetricCard
            title="Inventory Value"
            value={`$${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Total worth"
            color="#6f42c1"
            icon="💰"
          />
        </div>

        {/* Recent Products & Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* Recent Products */}
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
              Recent Products
              <span
                style={{
                  fontSize: "12px",
                  color: "#28a745",
                  marginLeft: "10px",
                  fontWeight: "normal",
                }}
              >
                Live Updates
              </span>
            </h3>

            {recentProducts.length > 0 ? (
              <div>
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600" }}>{product.name}</div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {product.category} • ${product.price}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          color:
                            Number(product.quantity) <= Number(product.minQty || 5)
                              ? "#dc3545"
                              : "#28a745",
                        }}
                      >
                        {product.quantity} units
                      </div>
                      {Number(product.quantity) <= Number(product.minQty || 5) && (
                        <div style={{ fontSize: "12px", color: "#dc3545" }}>Low Stock</div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate("/products")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "16px",
                    backgroundColor: "#f8f9fa",
                    border: "2px dashed #dee2e6",
                    borderRadius: "6px",
                    color: "#6c757d",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  View All Products →
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
                <p>No products yet</p>
                <button
                  onClick={() => navigate("/products")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Add Your First Product
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Quick Actions</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => navigate("/products")}
                style={{
                  padding: "16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Add New Product
              </button>

              <button
                onClick={() => navigate("/products")}
                style={{
                  padding: "16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Update Inventory
              </button>

              {/* NEW: Quick action to Reports */}
              <button
                onClick={() => navigate("/reports")}
                style={{
                  padding: "16px",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                View Reports
              </button>

              {metrics.lowStockItems > 0 && (
                <button
                  onClick={() => navigate("/products")}
                  style={{
                    padding: "16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Review Low Stock ({metrics.lowStockItems})
                </button>
              )}

              {lowStockProducts.length > 0 && (
                <button
                  onClick={sendTestNotification}
                  style={{
                    padding: "16px",
                    backgroundColor: "#ffc107",
                    color: "#212529",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Send Email Alert
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6c757d" }}>
                System Status
              </h4>
              <div style={{ fontSize: "12px", color: "#28a745" }}>
                Real-time sync active
                <br />
                Secure Firebase connection
                <br />
                Dashboard auto-updating
                <br />
                Email alerts ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
