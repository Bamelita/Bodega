const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { users, save } = require("../data/store");

const SECRET_KEY = process.env.JWT_SECRET || "bodega_secret_key";
const SALT_ROUNDS = 10;

/**
 * Detects if a stored password is already a bcrypt hash.
 * Bcrypt hashes always start with "$2b$" or "$2a$".
 */
function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[ab]\$/.test(str);
}

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña requeridos" });
  }

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  let passwordValid = false;

  if (isBcryptHash(user.password)) {
    // Normal bcrypt comparison
    passwordValid = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plain-text comparison (migration path)
    passwordValid = user.password === password;

    if (passwordValid) {
      // Auto-migrate: hash the plain-text password and persist it
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
      save();
      console.log(`[Auth] Migrated password hash for user: ${username}`);
    }
  }

  if (!passwordValid) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: "24h" },
  );

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    access_token: token,
  });
});

// Simple in-memory OTP store for password resets
const resetTokens = new Map();

// Verify Email and generate OTP
router.post("/verify-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requerido" });

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ message: "Correo no encontrado" });
  }

  // Generate a simple numeric 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  resetTokens.set(user.id, {
    otp,
    expires: Date.now() + 15 * 60 * 1000 // 15 mins
  });

  // In a real app, send OTP via email here.
  // For now, since it's a local/demo app, we just return the user ID. 
  // We'll also return the OTP in development mode so the frontend can auto-fill it or user can see it in console.
  res.json({
    success: true,
    userId: user.id,
    message: "Email verificado",
    devOtp: otp // Remove in production!
  });
});

// Reset Password with OTP
router.post("/reset-password", async (req, res) => {
  const { userId, newPassword, otp } = req.body;
  if (!userId || !newPassword || !otp) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  const tokenData = resetTokens.get(parseInt(userId));
  if (!tokenData || tokenData.otp !== otp) {
    return res.status(401).json({ message: "Código inválido o expirado" });
  }

  if (Date.now() > tokenData.expires) {
    resetTokens.delete(parseInt(userId));
    return res.status(401).json({ message: "El código ha expirado" });
  }

  const user = users.find((u) => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  save();
  resetTokens.delete(parseInt(userId));

  res.json({ message: "Contraseña actualizada exitosamente" });
});

module.exports = router;
