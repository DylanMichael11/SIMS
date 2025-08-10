// src/pages/Products.jsx
import { useEffect, useState } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../services/products";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async () => {
    if (!name || !quantity) return;
    await addProduct({ name, quantity: parseInt(quantity) });
    setName("");
    setQuantity("");
    fetchProducts();
  };

  const handleUpdate = async (id, quantity) => {
    await updateProduct(id, { quantity: quantity + 1 });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    fetchProducts();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Products</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button onClick={handleAdd}>Add Product</button>
      </div>

      <ul>
        {products.map((p) => (
          <li key={p.id} style={{ marginBottom: "10px" }}>
            {p.name} — Qty: {p.quantity}
            {p.quantity < 5 && (
              <span style={{ color: "red", marginLeft: "10px" }}>
                Low Stock
              </span>
            )}
            <button onClick={() => handleUpdate(p.id, p.quantity)}>+1</button>
            <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
