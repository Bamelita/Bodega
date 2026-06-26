const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");
const backupStorageCapacityBytes = 10 * 1024 * 1024; // 10MB virtual capacity

// Default Data Schema
const defaults = {
  users: [
    {
      id: 1,
      username: "admin",
      password: "admin123", // In production, hash this!
      role: "admin",
      firstName: "System",
      lastName: "Admin",
      email: "admin@bodega.com",
      cedula: "0000000000",
      phone: "555-5555",
      paymentMethod: "Efectivo",
      paymentAmount: 0,
      startDate: new Date().toISOString(),
      cutoffDate: "",
      isActive: true,
    },
  ],
  products: [],
  movements: [],
  customers: [],
  backups: [],
  backupLogs: [],
  backupSchedule: { enabled: false, frequency: null, nextRun: null },
  auditLogs: [],
  supportMessages: [],
  plans: [
    {
      id: 1,
      name: "🥉 Básico",
      price: 9.99,
      currency: "USD",
      features: ["Hasta 50 Productos", "1 Usuario", "Soporte Básico"],
      status: "active",
    },
    {
      id: 2,
      name: "🥈 Profesional",
      price: 29.99,
      currency: "USD",
      features: [
        "Hasta 500 Productos",
        "5 Usuarios",
        "Facturación",
        "Soporte Prioritario",
      ],
      status: "active",
    },
    {
      id: 3,
      name: "🥇 Premium",
      price: 99.99,
      currency: "USD",
      features: [
        "Productos Ilimitados",
        "Usuarios Ilimitados",
        "API Access",
        "Soporte 24/7",
      ],
      status: "active",
    },
  ],
  notifications: {
    admin: { userExpiring: true, userSuspended: true },
    user: { closeCutoff: true, suspended: true },
    channels: { system: true, email: false },
  },
  systemConfig: {
    currency: "USD",
    symbol: "$",
    taxCookies: true,
    taxRate: 16,
    themeColor: "#7c3aed",
    dateFormat: "DD/MM/YYYY",
    timezone: "America/Caracas",
    limits: { maxProducts: 500, maxClients: 100 },
  },
};

let data = { ...defaults };

// Load Data
try {
  if (fs.existsSync(DB_PATH)) {
    const fileContent = fs.readFileSync(DB_PATH, "utf8");
    const fileData = JSON.parse(fileContent);
    // Merge to ensure structural integrity
    data = { ...defaults, ...fileData };
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error("Error loading db.json, using defaults:", error);
}

// Persist Data
function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving db.json:", error);
  }
}

module.exports = {
  users: data.users,
  products: data.products,
  movements: data.movements,
  customers: data.customers,
  backups: data.backups,
  backupLogs: data.backupLogs,
  backupSchedule: data.backupSchedule,
  auditLogs: data.auditLogs,
  plans: data.plans,
  notifications: data.notifications,
  systemConfig: data.systemConfig,
  backupStorageCapacityBytes,
  save,
};
