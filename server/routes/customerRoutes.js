const express = require("express");
const router = express.Router();
let { customers, save } = require("../data/store");
const { supabase, hasSupabase } = require("../config/supabaseClient");

// Customers CRUD

// GET /api/customers
router.get("/", async (req, res) => {
  if (!hasSupabase) {
    return res.json(customers);
  }
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase error (customers):", error);
      return res
        .status(500)
        .json({ message: "Error cargando clientes", detail: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", detail: err.message });
  }
});

// POST /api/customers
router.post("/", async (req, res) => {
  const { firstName, lastName, cedula, phone, debt, specialOrder } = req.body;

  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ message: "Nombre y apellido son requeridos" });
  }

  // Initialize debt fields if debt is enabled
  let finalDebt = debt || { enabled: false };
  if (finalDebt.enabled) {
    const parts = Number(finalDebt.parts || 0);
    const amount = Number(finalDebt.installmentAmount || 0);
    const total = parts * amount;
    finalDebt = {
      ...finalDebt,
      totalDebt: total,
      currentDebt: total,
      payments: [],
      startDate: new Date().toISOString()
    };
  }

  const newCustomerObj = {
    firstName,
    lastName,
    cedula: cedula || "",
    phone: phone || "",
    debt: finalDebt,
    specialOrder: specialOrder || { enabled: false },
    createdAt: new Date().toISOString(),
  };

  if (!hasSupabase) {
    const newCustomer = {
      id: customers.length ? Math.max(...customers.map((c) => c.id)) + 1 : 1,
      ...newCustomerObj,
    };
    customers.push(newCustomer);
    save(); // Persist changes
    return res.status(201).json(newCustomer);
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .insert([newCustomerObj])
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: "Error creando cliente", detail: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  try {
    // Check if we need to update debt calculations
    let safeUpdates = updates;
    if (updates.debt) {
      // In Supabase mode, we need the current record to keep payment history
      let currentRecord = null;
      if (!hasSupabase) {
        const idx = customers.findIndex((c) => c.id === id);
        if (idx === -1) return res.status(404).json({ message: "Cliente no encontrado" });
        currentRecord = customers[idx];
      } else {
        const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
        if (error || !data) return res.status(404).json({ message: "Cliente no encontrado" });
        currentRecord = data;
      }

      let finalDebt = { ...updates.debt };
      if (finalDebt.enabled) {
        const parts = Number(finalDebt.parts || 0);
        const amount = Number(finalDebt.installmentAmount || 0);
        const total = parts * amount;
        
        // Preserve payments and startDate
        const existingPayments = currentRecord.debt?.payments || [];
        const totalPaid = existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const startDate = currentRecord.debt?.startDate || new Date().toISOString();
        
        finalDebt = {
          ...finalDebt,
          totalDebt: total,
          currentDebt: Math.max(0, total - totalPaid),
          payments: existingPayments,
          startDate
        };
      } else {
        // If disabled, reset to 0 but maybe preserve history if needed? We will just clear it.
        finalDebt = { enabled: false, parts: 0, installmentAmount: 0, totalDebt: 0, currentDebt: 0, payments: [] };
      }
      safeUpdates = { ...safeUpdates, debt: finalDebt };
    }

    if (!hasSupabase) {
      const idx = customers.findIndex((c) => c.id === id);
      customers[idx] = { ...customers[idx], ...safeUpdates, id };
      save(); // Persist changes
      return res.json(customers[idx]);
    }

    // Exclude id from updates if present
    const { id: _, ...supabaseUpdates } = safeUpdates;

    const { data, error } = await supabase
      .from("customers")
      .update(supabaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: "Error actualizando cliente", detail: error.message });
    }
    if (!data) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (!hasSupabase) {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      customers.splice(idx, 1);
      save(); // Persist changes
    } else return res.status(404).json({ message: "Cliente no encontrado" });
    return res.json({ message: "Cliente eliminado" });
  }

  try {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      return res
        .status(500)
        .json({ message: "Error eliminando cliente", detail: error.message });
    }
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

module.exports = router;

// POST /api/customers/:id/payments
router.post("/:id/payments", async (req, res) => {
  const id = parseInt(req.params.id);
  const { amount, note } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Monto inválido" });
  }

  try {
    let currentRecord = null;
    if (!hasSupabase) {
      const idx = customers.findIndex((c) => c.id === id);
      if (idx === -1) return res.status(404).json({ message: "Cliente no encontrado" });
      currentRecord = customers[idx];
    } else {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
      if (error || !data) return res.status(404).json({ message: "Cliente no encontrado" });
      currentRecord = data;
    }

    if (!currentRecord.debt || !currentRecord.debt.enabled) {
      return res.status(400).json({ message: "El cliente no tiene deuda activa" });
    }

    const newPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: Number(amount),
      note: note || ""
    };

    const existingPayments = currentRecord.debt.payments || [];
    const updatedPayments = [newPayment, ...existingPayments];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    let totalDebt = currentRecord.debt.totalDebt;
    if (totalDebt === undefined) {
      totalDebt = (Number(currentRecord.debt.parts || 0) * Number(currentRecord.debt.installmentAmount || 0));
    }
    
    const newCurrentDebt = Math.max(0, totalDebt - totalPaid);

    const updatedDebt = {
      ...currentRecord.debt,
      totalDebt,
      currentDebt: newCurrentDebt,
      payments: updatedPayments
    };

    if (!hasSupabase) {
      const idx = customers.findIndex((c) => c.id === id);
      customers[idx].debt = updatedDebt;
      save();
      return res.json(customers[idx]);
    }

    const { data, error } = await supabase
      .from("customers")
      .update({ debt: updatedDebt })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: "Error registrando pago", detail: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// POST /api/customers/:id/complete-order
router.post("/:id/complete-order", async (req, res) => {
  const id = parseInt(req.params.id);
  const { paidInFull, pendingAmount } = req.body;

  try {
    let currentRecord = null;
    if (!hasSupabase) {
      const idx = customers.findIndex((c) => c.id === id);
      if (idx === -1) return res.status(404).json({ message: "Cliente no encontrado" });
      currentRecord = customers[idx];
    } else {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
      if (error || !data) return res.status(404).json({ message: "Cliente no encontrado" });
      currentRecord = data;
    }

    if (!currentRecord.specialOrder || !currentRecord.specialOrder.enabled) {
      return res.status(400).json({ message: "El cliente no tiene un encargo activo" });
    }

    let updatedDebt = currentRecord.debt || { enabled: false };

    if (!paidInFull) {
      const amountToAdd = Number(pendingAmount) || 0;
      if (amountToAdd > 0) {
        if (updatedDebt.enabled) {
          updatedDebt = {
            ...updatedDebt,
            totalDebt: (updatedDebt.totalDebt || 0) + amountToAdd,
            currentDebt: (updatedDebt.currentDebt || 0) + amountToAdd
          };
        } else {
          updatedDebt = {
            enabled: true,
            parts: 1,
            installmentAmount: amountToAdd,
            frequency: 'semanal',
            totalDebt: amountToAdd,
            currentDebt: amountToAdd,
            payments: []
          };
        }
      }
    }

    const updatedSpecialOrder = {
      ...currentRecord.specialOrder,
      enabled: false
    };

    if (!hasSupabase) {
      const idx = customers.findIndex((c) => c.id === id);
      customers[idx].debt = updatedDebt;
      customers[idx].specialOrder = updatedSpecialOrder;
      save();
      return res.json(customers[idx]);
    }

    const { data, error } = await supabase
      .from("customers")
      .update({ debt: updatedDebt, specialOrder: updatedSpecialOrder })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: "Error completando encargo", detail: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});
