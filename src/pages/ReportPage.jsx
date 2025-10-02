// src/pages/ReportsPage.jsx - Simple Working Version
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const { db } = await import("../firebase");
      const { collection, onSnapshot } = await import("firebase/firestore");
      
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsList);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error loading reports data:", err);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Category", "Quantity", "Price", "Total Value", "Status"];
    const csvData = products.map(p => [
      p.name || "",
      p.category || "Uncategorized",
      p.quantity || 0,
      (p.price || 0).toFixed(2),
      ((p.quantity || 0) * (p.price || 0)).toFixed(2),
      (p.quantity || 0) <= (p.minQty || 5) ? "Low Stock" : "In Stock"
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.minQty || 5));
  const totalUnits = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>📊 Loading Reports...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1>📊 Reports & Analytics</h1>
          <p>Inventory insights and data export</p>
        </div>
        <button 
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Export Button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={exportToCSV}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: "bold"
          }}
        >
          📄 Export to CSV
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 32 }}>
        <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: "#007bff", margin: 0 }}>Total Products</h3>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#007bff" }}>
            {totalProducts}
          </div>
        </div>

        <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: "#28a745", margin: 0 }}>Total Value</h3>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#28a745" }}>
            ${totalValue.toFixed(2)}
          </div>
        </div>

        <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: "#17a2b8", margin: 0 }}>Total Units</h3>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#17a2b8" }}>
            {totalUnits}
          </div>
        </div>

        <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: "#dc3545", margin: 0 }}>Low Stock</h3>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#dc3545" }}>
            {lowStockItems.length}
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, marginBottom: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#dc3545", marginBottom: 16 }}>⚠️ Low Stock Alert</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {lowStockItems.map(product => (
              <div key={product.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 16,
                backgroundColor: "#fff3cd",
                borderRadius: 8,
                border: "1px solid #ffeaa7"
              }}>
                <div>
                  <strong>{product.name}</strong>
                  <div style={{ fontSize: 14, color: "#666" }}>
                    {product.category} • Min: {product.minQty || 5}
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: "bold", color: "#dc3545" }}>
                  {product.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products Table */}
      <div style={{ backgroundColor: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: 24, borderBottom: "1px solid #e9ecef" }}>
          <h2 style={{ margin: 0 }}>📦 All Products</h2>
        </div>
        
        {products.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
            <p>No products found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ padding: 16, textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Product</th>
                  <th style={{ padding: 16, textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Category</th>
                  <th style={{ padding: 16, textAlign: "center", borderBottom: "1px solid #e9ecef" }}>Quantity</th>
                  <th style={{ padding: 16, textAlign: "right", borderBottom: "1px solid #e9ecef" }}>Price</th>
                  <th style={{ padding: 16, textAlign: "right", borderBottom: "1px solid #e9ecef" }}>Value</th>
                  <th style={{ padding: 16, textAlign: "center", borderBottom: "1px solid #e9ecef" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const isLowStock = (product.quantity || 0) <= (product.minQty || 5);
                  return (
                    <tr key={product.id} style={{ backgroundColor: isLowStock ? "#fff3cd" : "white" }}>
                      <td style={{ padding: 16, borderBottom: "1px solid #e9ecef" }}>
                        <strong>{product.name}</strong>
                      </td>
                      <td style={{ padding: 16, borderBottom: "1px solid #e9ecef" }}>
                        {product.category || "Uncategorized"}
                      </td>
                      <td style={{ padding: 16, textAlign: "center", borderBottom: "1px solid #e9ecef" }}>
                        <span style={{ color: isLowStock ? "#dc3545" : "#28a745", fontWeight: "bold" }}>
                          {product.quantity || 0}
                        </span>
                      </td>
                      <td style={{ padding: 16, textAlign: "right", borderBottom: "1px solid #e9ecef" }}>
                        ${(product.price || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 16, textAlign: "right", borderBottom: "1px solid #e9ecef" }}>
                        ${((product.quantity || 0) * (product.price || 0)).toFixed(2)}
                      </td>
                      <td style={{ padding: 16, textAlign: "center", borderBottom: "1px solid #e9ecef" }}>
                        {isLowStock ? (
                          <span style={{ color: "#dc3545", fontWeight: "bold" }}>⚠️ Low</span>
                        ) : (
                          <span style={{ color: "#28a745", fontWeight: "bold" }}>✅ OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;