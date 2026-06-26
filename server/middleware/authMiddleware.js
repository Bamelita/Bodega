const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "bodega_secret_key";

/**
 * Middleware que valida el JWT en el header Authorization.
 * En modo demo (token = "demo_token" o "mock_token_*"), pasa sin verificar.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado: token requerido" });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // Allow demo/mock tokens from Netlify demo mode
  if (token === "demo_token" || token.startsWith("mock_token_")) {
    req.user = { id: 1, username: "demo", role: "admin" };
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "No autorizado: token inválido" });
  }
}

/**
 * Middleware que verifica si el usuario autenticado tiene el rol "admin".
 * Debe llamarse después de requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Prohibido: Se requiere rol de administrador" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
