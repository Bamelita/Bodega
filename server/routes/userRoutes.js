const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
let { users, save } = require("../data/store");
const { supabase, hasSupabase } = require("../config/supabaseClient");

const SALT_ROUNDS = 10;

// Get All Users
router.get("/", async (req, res) => {
  if (!hasSupabase) {
    // Exclude passwords from response
    const safeUsers = users.map(({ password, ...u }) => u);
    return res.json(safeUsers);
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, username, role, firstName, lastName, email, cedula, phone, isActive, startDate, planId, cutoffDate",
      )
      .order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", detail: err.message });
  }
});

// Create User
router.post("/", async (req, res) => {
  const {
    username,
    password,
    role,
    firstName,
    lastName,
    email,
    cedula,
    phone,
    cutoffDate,
  } = req.body;

  if (!username || !password || !firstName || !lastName || !email) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  if (!hasSupabase) {
    // Check duplicates in local store
    if (users.some((u) => u.username === username || u.email === email)) {
      return res.status(400).json({ message: "Usuario o correo ya existe" });
    }
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUserObj = {
    username,
    password: hashedPassword,
    role: "user",
    firstName,
    lastName,
    email,
    cedula: cedula || "",
    phone: phone || "",
    isActive: true,
    startDate: new Date().toISOString(),
    paymentMethod: "Efectivo",
    paymentAmount: 0,
    cutoffDate: cutoffDate || "",
  };

  if (!hasSupabase) {
    const newUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      ...newUserObj,
    };
    users.push(newUser);
    save();
    const { password: _, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  }

  try {
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .insert([newUserObj])
      .select(
        "id, username, role, firstName, lastName, email, cedula, phone, isActive, startDate, planId, cutoffDate",
      )
      .single();

    if (dbError) throw dbError;
    res.status(201).json(userData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creando usuario", detail: err.message });
  }
});

// Update User
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    username,
    firstName,
    lastName,
    email,
    cedula,
    phone,
    isActive,
    password,
    role,
    planId,
    cutoffDate,
  } = req.body;

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (email !== undefined) updates.email = email;
  if (cedula !== undefined) updates.cedula = cedula;
  if (phone !== undefined) updates.phone = phone;
  if (isActive !== undefined) updates.isActive = isActive;
  if (planId !== undefined) updates.planId = planId;
  if (cutoffDate !== undefined) updates.cutoffDate = cutoffDate;
  // Never allow changing a role to "admin" via PUT
  if (role !== undefined) {
    if (role === 'admin') {
      return res.status(403).json({ message: "No se puede ascender a otro usuario a administrador" });
    }
    updates.role = role;
  }
  if (password) {
    updates.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  if (!hasSupabase) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ message: "Usuario no encontrado" });

    users[idx] = { ...users[idx], ...updates };
    save();
    const { password: _, ...safeUser } = users[idx];
    return res.json(safeUser);
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select(
        "id, username, role, firstName, lastName, email, cedula, phone, isActive, startDate, planId, cutoffDate",
      )
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error actualizando usuario", detail: err.message });
  }
});



// Delete User
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (!hasSupabase) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users.splice(idx, 1);
      save();
    } else {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json({ message: "Usuario eliminado" });
  }

  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error eliminando usuario", detail: err.message });
  }
});

module.exports = router;
