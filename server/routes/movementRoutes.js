const express = require("express");
const router = express.Router();
let { movements, products, save } = require("../data/store");
const { supabase, hasSupabase } = require("../config/supabaseClient");

// Get Movements
router.get("/", async (req, res) => {
  if (!hasSupabase) {
    return res.json(movements);
  }
  try {
    const { data, error } = await supabase
      .from("movements")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      return res
        .status(500)
        .json({
          message: "Error en Supabase (movements)",
          detail: error.message,
        });
    }
    res.json(data || []);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error consultando movimientos", detail: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { quantity } = req.body;
  const qNew = parseInt(quantity);

  if (!hasSupabase) {
    const mvIndex = movements.findIndex((m) => m.id === id);
    if (mvIndex === -1) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }
    const mv = movements[mvIndex];
    if (!qNew || qNew <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }
    const product = products.find((p) => p.id === mv.productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Producto del movimiento no existe" });
    }
    const delta = qNew - mv.quantity;
    if (mv.type === "OUT") {
      if (product.stock - delta < 0) {
        return res
          .status(400)
          .json({ message: "Stock insuficiente para actualizar" });
      }
      product.stock -= delta;
    } else if (mv.type === "IN") {
      product.stock += delta;
      if (product.stock < 0) {
        return res.status(400).json({ message: "Stock no puede ser negativo" });
      }
    }
    movements[mvIndex] = { ...mv, quantity: qNew };
    save(); // Persist stock and movement changes
    return res.json({ movement: movements[mvIndex], product });
  }
  try {
    const { data: mv, error: mvErr } = await supabase
      .from("movements")
      .select("*")
      .eq("id", id)
      .single();
    if (mvErr || !mv) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }
    if (!qNew || qNew <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", mv.productId)
      .single();
    const delta = qNew - mv.quantity;
    if (mv.type === "OUT") {
      if ((product?.stock ?? 0) - delta < 0) {
        return res
          .status(400)
          .json({ message: "Stock insuficiente para actualizar" });
      }
      await supabase
        .from("products")
        .update({ stock: (product?.stock ?? 0) - delta })
        .eq("id", mv.productId);
    } else if (mv.type === "IN") {
      const newStock = (product?.stock ?? 0) + delta;
      if (newStock < 0) {
        return res.status(400).json({ message: "Stock no puede ser negativo" });
      }
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", mv.productId);
    }
    const { data: updatedMv, error: upErr } = await supabase
      .from("movements")
      .update({ quantity: qNew })
      .eq("id", id)
      .select()
      .single();
    if (upErr) {
      return res
        .status(500)
        .json({
          message: "Error actualizando movimiento",
          detail: upErr.message,
        });
    }
    const { data: updatedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", mv.productId)
      .single();
    res.json({ movement: updatedMv, product: updatedProduct });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error en servidor al actualizar movimiento",
        detail: err.message,
      });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!hasSupabase) {
    const mvIndex = movements.findIndex((m) => m.id === id);
    if (mvIndex === -1) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }
    const mv = movements[mvIndex];
    const product = products.find((p) => p.id === mv.productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Producto del movimiento no existe" });
    }
    if (mv.type === "OUT") {
      product.stock += mv.quantity;
    } else if (mv.type === "IN") {
      if (product.stock - mv.quantity < 0) {
        return res
          .status(400)
          .json({ message: "No se puede eliminar: stock quedaría negativo" });
      }
      product.stock -= mv.quantity;
    }
    movements.splice(mvIndex, 1);
    save(); // Persist stock and movement deletion
    return res.json({ message: "Movimiento eliminado", product });
  }
  try {
    const { data: mv } = await supabase
      .from("movements")
      .select("*")
      .eq("id", id)
      .single();
    if (!mv) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }
    const { data: product } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", mv.productId)
      .single();
    let newStock = product?.stock ?? 0;
    if (mv.type === "OUT") {
      newStock += mv.quantity;
    } else if (mv.type === "IN") {
      if (newStock - mv.quantity < 0) {
        return res
          .status(400)
          .json({ message: "No se puede eliminar: stock quedaría negativo" });
      }
      newStock -= mv.quantity;
    }
    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", mv.productId);
    await supabase.from("movements").delete().eq("id", id);
    const { data: updatedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", mv.productId)
      .single();
    res.json({ message: "Movimiento eliminado", product: updatedProduct });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error en servidor al eliminar movimiento",
        detail: err.message,
      });
  }
});

module.exports = router;
