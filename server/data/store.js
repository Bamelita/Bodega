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
  backupStorageCapacityBytes,
  save,
};
