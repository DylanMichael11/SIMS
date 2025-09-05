// src/pages/ProductsPage.jsx - Enhanced with Real-time, Search & Inline Edit
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const [form, setForm] = useState({
    name: "", quantity: 0, price: 0, description: "", category: "", minQty: 5
  });

  useEffect(() => {
    console.log("=== PRODUCTS PAGE LOADED ===");
    setupRealtimeListener();
  }, []);

  // Filter and sort products when search/filter changes
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "quantity": return Number(b.quantity) - Number(a.quantity);
        case "price": return Number(b.price) - Number(a.price);
        case "lowStock": return (Number(a.quantity) <= Number(a.minQty || 5)) ? -1 : 1;
        default: return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterCategory, sortBy]);

  const setupRealtimeListener = async () => {
    try {
      const { db } = await import("../firebase");
      const { collection, onSnapshot, orderBy, query } = await import("firebase/firestore");
      
      const q = query(collection(db, "products"), orderBy("name"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("🔄 Real-time products update");
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsList);
        setLoading(false);
      }, (error) => {
        console.error("Real-time listener error:", error);
        setError(error.message);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up real-time listener:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    try {
      const { db } = await import("../firebase");
      const { collection, addDoc } = await import("firebase/firestore");
      
      await addDoc(collection(db, "products"), {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category.trim(),
        minQty: Number(form.minQty) || 5,
        createdAt: new Date()
      });
      
      setForm({ name: "", quantity: 0, price: 0, description: "", category: "", minQty: 5 });
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Error adding product: " + err.message);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const saveEdit = async () => {
    try {
      const { db } = await import("../firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      await updateDoc(doc(db, "products", editingId), {
        name: editForm.name.trim(),
        quantity: Number(editForm.quantity),
        price: Number(editForm.price),
        description: editForm.description.trim(),
        category: editForm.category.trim(),
        minQty: Number(editForm.minQty) || 5
      });
      
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Error updating product: " + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const quickUpdateQuantity = async (id, newQuantity) => {
    try {
      const { db } = await import("../firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      await updateDoc(doc(db, "products", id), { 
        quantity: Math.max(0, newQuantity) 
      });
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    try {
      const { db } = await import("../firebase");
      const { doc, deleteDoc } = await import("firebase/firestore");
      
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error deleting product: " + err.message);
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lowStockCount = products.filter(p => Number(p.quantity) <= Number(p.minQty || 5)).length;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Products</h1>
        <p>🔄 Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Products</h1>
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: 16, borderRadius: 4 }}>
          <h3>⚠️ Error loading products:</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 20 
      }}>
        <div>
          <h1 style={{ margin: 0 }}>📦 Inventory Management</h1>
          <p style={{ margin: "5px 0", color: "#666" }}>
            {products.length} products • {lowStockCount} low stock
            <span style={{ color: "#28a745", marginLeft: 10 }}>🔴 Live</span>
          </p>
        </div>
        <button 
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          ← Dashboard
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "2fr 1fr 1fr 1fr", 
        gap: 12, 
        marginBottom: 20,
        padding: 16,
        backgroundColor: "#ffffff",
        border: "1px solid #dee2e6",
        borderRadius: 8
      }}>
        <input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            padding: 10, 
            border: "1px solid #ced4da", 
            borderRadius: 4,
            fontSize: 14,
            color: "#495057",
            backgroundColor: "#ffffff"
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ 
            padding: 10, 
            border: "1px solid #ced4da", 
            borderRadius: 4,
            fontSize: 14,
            color: "#495057",
            backgroundColor: "#ffffff"
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ 
            padding: 10, 
            border: "1px solid #ced4da", 
            borderRadius: 4,
            fontSize: 14,
            color: "#495057",
            backgroundColor: "#ffffff"
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="price">Sort by Price</option>
          <option value="lowStock">Low Stock First</option>
        </select>
        <div style={{ 
          fontSize: 14, 
          padding: 10, 
          color: "#495057",
          fontWeight: "500",
          alignSelf: "center"
        }}>
          Showing {filteredProducts.length} of {products.length}
        </div>
      </div>

      {/* Add Product Form */}
      <form onSubmit={handleAdd} style={{ 
        display: "grid", 
        gridTemplateColumns: "1.5fr 0.7fr 0.7fr 2fr 1fr 0.7fr 120px", 
        gap: 10,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#ffffff',
        border: "2px solid #28a745",
        borderRadius: 8
      }}>
        <input 
          placeholder="Product Name *"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
          required
        />
        <input 
          placeholder="Quantity" 
          type="number"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
        />
        <input 
          placeholder="Price" 
          type="number" 
          step="0.01"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
        />
        <input 
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
        />
        <input 
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
        />
        <input 
          placeholder="Min Qty"
          type="number"
          value={form.minQty}
          onChange={e => setForm({ ...form, minQty: e.target.value })}
          style={{ 
            padding: 10, 
            border: "1px solid #28a745", 
            borderRadius: 4,
            fontSize: 14,
            color: "#212529",
            backgroundColor: "#ffffff"
          }}
        />
        <button type="submit" style={{ 
          padding: 10, 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: 4,
          fontWeight: "bold",
          fontSize: 14,
          cursor: "pointer"
        }}>
          + Add
        </button>
      </form>

      {/* Products Table */}
      <div style={{ backgroundColor: "white", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        {/* Table Header */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1.5fr 0.7fr 0.7fr 2fr 1fr 0.7fr 200px",
          gap: 10, 
          padding: "16px", 
          backgroundColor: "#343a40",
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: 14
        }}>
          <div>Product Name</div>
          <div>Quantity</div>
          <div>Price</div>
          <div>Description</div>
          <div>Category</div>
          <div>Min Qty</div>
          <div>Actions</div>
        </div>

        {/* Products List */}
        {filteredProducts.map(product => {
          const isLowStock = Number(product.quantity) <= Number(product.minQty || 5);
          const isEditing = editingId === product.id;
          
          return (
            <div key={product.id} style={{ 
              display: "grid", 
              gridTemplateColumns: "1.5fr 0.7fr 0.7fr 2fr 1fr 0.7fr 200px",
              gap: 10, 
              alignItems: "center", 
              padding: "16px", 
              borderBottom: "1px solid #dee2e6",
              backgroundColor: isLowStock ? "#fff3cd" : "white",
              color: "#212529",
              fontSize: 14
            }}>
              {isEditing ? (
                <>
                  <input 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <input 
                    type="number" 
                    value={editForm.quantity} 
                    onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    value={editForm.price} 
                    onChange={e => setEditForm({...editForm, price: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <input 
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <input 
                    value={editForm.category} 
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <input 
                    type="number"
                    value={editForm.minQty} 
                    onChange={e => setEditForm({...editForm, minQty: e.target.value})}
                    style={{ 
                      padding: 6, 
                      fontSize: 14, 
                      border: "2px solid #007bff", 
                      borderRadius: 4,
                      color: "#212529",
                      backgroundColor: "#ffffff"
                    }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={saveEdit} 
                      style={{ 
                        padding: "6px 12px", 
                        backgroundColor: "#28a745", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 4, 
                        fontSize: 12,
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEdit} 
                      style={{ 
                        padding: "6px 12px", 
                        backgroundColor: "#6c757d", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 4, 
                        fontSize: 12,
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <strong style={{ color: "#212529" }}>{product.name}</strong>
                    {isLowStock && <span style={{ color: "#dc3545", fontSize: 12, marginLeft: 8, fontWeight: "bold" }}>LOW STOCK</span>}
                  </div>
                  <div style={{ 
                    fontWeight: "bold", 
                    color: isLowStock ? "#dc3545" : "#28a745",
                    fontSize: 16
                  }}>
                    {product.quantity}
                  </div>
                  <div style={{ fontWeight: "600", color: "#212529" }}>
                    ${Number(product.price || 0).toFixed(2)}
                  </div>
                  <div style={{ color: "#495057" }}>{product.description}</div>
                  <div>
                    <span style={{ 
                      backgroundColor: "#e9ecef", 
                      color: "#495057",
                      padding: "4px 8px", 
                      borderRadius: 12, 
                      fontSize: 12,
                      fontWeight: "500"
                    }}>
                      {product.category}
                    </span>
                  </div>
                  <div style={{ color: "#495057", fontWeight: "500" }}>
                    {product.minQty || 5}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button 
                      onClick={() => quickUpdateQuantity(product.id, Number(product.quantity) - 1)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: 12, 
                        backgroundColor: "#ffc107", 
                        color: "black", 
                        border: "none", 
                        borderRadius: 2 
                      }}
                      title="Decrease quantity"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => quickUpdateQuantity(product.id, Number(product.quantity) + 1)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: 12, 
                        backgroundColor: "#28a745", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 2 
                      }}
                      title="Increase quantity"
                    >
                      +1
                    </button>
                    <button 
                      onClick={() => startEdit(product)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: 12, 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 2 
                      }}
                      title="Edit product"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id, product.name)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: 12, 
                        backgroundColor: "#dc3545", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 2 
                      }}
                      title="Delete product"
                    >
                      Del
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        {filteredProducts.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 20px", 
            color: "#666" 
          }}>
            {searchTerm || filterCategory ? (
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p>No products match your search criteria</p>
                <button 
                  onClick={() => { setSearchTerm(""); setFilterCategory(""); }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <p>No products in inventory yet</p>
                <p style={{ fontSize: 14 }}>Add your first product using the form above</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ 
        marginTop: 20, 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 12,
        fontSize: 14
      }}>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#e8f5e8", 
          borderRadius: 8, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#28a745" }}>
            {products.length}
          </div>
          <div>Total Products</div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#fff3cd", 
          borderRadius: 8, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#856404" }}>
            {lowStockCount}
          </div>
          <div>Low Stock Items</div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#e2e3e5", 
          borderRadius: 8, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#495057" }}>
            {products.reduce((sum, p) => sum + Number(p.quantity || 0), 0).toLocaleString()}
          </div>
          <div>Total Units</div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#d1ecf1", 
          borderRadius: 8, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#0c5460" }}>
            ${products.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.price || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div>Total Value</div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;