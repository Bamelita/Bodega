const express = require("express");
const router = express.Router();
let { products, movements, save } = require("../data/store");
const { supabase, hasSupabase } = require("../config/supabaseClient");

// Get Products
router.get("/", async (req, res) => {
  if (!hasSupabase) {
    return res.json(products);
  }
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      return res.status(500).json({
        message: "Error en Supabase (products)",
        detail: error.message,
      });
    }
    res.json(data || []);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error consultando productos", detail: err.message });
  }
});

// Create Product
router.post("/", async (req, res) => {
  const {
    name,
    category,
    price,
    cost,
    stock,
    minStock,
    expirationDate,
    photoData,
  } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ message: "Nombre y precio son requeridos" });
  }
  if (!hasSupabase) {
    const newProduct = {
      id: products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      name,
      category: category || "",
      price: Number(price),
      cost: Number(cost ?? 0),
      stock: Number(stock ?? 0),
      minStock: Number(minStock ?? 0),
      expirationDate: expirationDate || "",
      photoData: photoData || null,
    };
    products.push(newProduct);
    save();
    return res.status(201).json(newProduct);
  }
  try {
    const toInsert = {
      name,
      category: category || "",
      price: Number(price),
      cost: Number(cost ?? 0),
      stock: Number(stock ?? 0),
      minStock: Number(minStock ?? 0),
      expirationDate: expirationDate || "",
      photoData: photoData || null,
    };
    const { data, error } = await supabase
      .from("products")
      .insert([toInsert])
      .select()
      .single();
    if (error) {
      return res
        .status(500)
        .json({ message: "Error insertando producto", detail: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      message: "Error en servidor al crear producto",
      detail: err.message,
    });
  }
});

// Update Product
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!hasSupabase) {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    const updates = req.body;
    products[idx] = { ...products[idx], ...updates, id };
    save();
    return res.json(products[idx]);
  }
  try {
    const updates = req.body;
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return res.status(500).json({
        message: "Error actualizando producto",
        detail: error.message,
      });
    }
    if (!data) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Error en servidor al actualizar producto",
      detail: err.message,
    });
  }
});

// Delete Product
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!hasSupabase) {
    const idx = products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      products.splice(idx, 1);
      save();
    } else {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    return res.json({ message: "Producto eliminado" });
  }
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return res
        .status(500)
        .json({ message: "Error eliminando producto", detail: error.message });
    }
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({
      message: "Error en servidor al eliminar producto",
      detail: err.message,
    });
  }
});

// Export Products as CSV (Excel compatible)
router.get("/export", async (req, res) => {
  const header = [
    "id",
    "name",
    "category",
    "price",
    "cost",
    "stock",
    "minStock",
    "expirationDate",
  ].join(",");

  let exportProducts = products;

  if (hasSupabase) {
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, category, price, cost, stock, minStock, expirationDate")
        .order("id", { ascending: true });
      if (data) exportProducts = data;
    } catch {
      // Fall through to local data if Supabase fails
    }
  }

  const lines = exportProducts.map((p) =>
    [
      p.id,
      JSON.stringify(p.name),
      JSON.stringify(p.category || ""),
      p.price,
      p.cost ?? 0,
      p.stock,
      p.minStock ?? 0,
      JSON.stringify(p.expirationDate || ""),
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=productos.csv");
  res.send(csv);
});

// Import Products (bulk)
router.post("/import", (req, res) => {
  const { products: incoming } = req.body;
  if (!Array.isArray(incoming)) {
    return res
      .status(400)
      .json({ message: "Formato inválido: se espera arreglo products" });
  }
  const created = [];
  for (const item of incoming) {
    if (!item.name || item.price == null) {
      continue;
    }
    const newProduct = {
      id: products.length
        ? Math.max(...products.map((p) => p.id)) + 1 + created.length
        : 1 + created.length,
      name: item.name,
      category: item.category || "",
      price: Number(item.price),
      cost: Number(item.cost ?? 0),
      stock: Number(item.stock ?? 0),
      minStock: Number(item.minStock ?? 0),
      expirationDate: item.expirationDate || "",
      photoData: item.photoData || null,
    };
    created.push(newProduct);
  }
  products.push(...created);
  save(); // FIX: persist imported products to disk
  res.status(201).json({ created });
});

module.exports = router;
