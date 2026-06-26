const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { requireAuth, requireAdmin } = require("./middleware/authMiddleware");

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || null;
if (ALLOWED_ORIGIN) {
  app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
} else {
  app.use(cors());
}

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth
  message: { message: "Demasiadas peticiones de inicio de sesión, intente de nuevo en 15 minutos" }
});

// Public Routes (no auth required)
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));

// Protected Routes (JWT required)
app.use(requireAuth);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/movements", require("./routes/movementRoutes"));
app.use("/api/backups", requireAdmin, require("./routes/backupRoutes"));
app.use("/api/users", requireAdmin, require("./routes/userRoutes"));
app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/settings", requireAdmin, require("./routes/settingsRoutes"));
app.use("/api/plans", requireAdmin, require("./routes/plansRoutes"));
app.use("/api/support", require("./routes/supportRoutes")); // Added for support messages
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api", require("./routes/miscRoutes"));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth middleware: ACTIVE`);
  console.log(`Database: ${process.env.SUPABASE_URL ? "Supabase" : "Local JSON"}`);
});
