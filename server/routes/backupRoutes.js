const express = require("express");
const router = express.Router();
let {
  backups,
  backupLogs,
  backupSchedule,
  backupStorageCapacityBytes,
  users,
  products,
  movements,
  customers,
  save,
} = require("../data/store");

// Backup API
router.post("/create", (req, res) => {
  const snapshot = {
    users,
    products,
    movements,
    customers,
  };
  const payload = JSON.stringify(snapshot);
  const size = new Blob([payload]).size || Buffer.byteLength(payload, "utf8");
  const id = backups.length ? Math.max(...backups.map((b) => b.id)) + 1 : 1;
  const record = {
    id,
    name: `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    createdAt: new Date().toISOString(),
    size,
    data: snapshot,
  };
  backups.push(record);
  backupLogs.push({
    ts: new Date().toISOString(),
    type: "CREATE",
    message: `Respaldo ${record.name} creado`,
    backupId: id,
  });
  res.status(201).json(record);
});

router.get("/", (req, res) => {
  res.json(
    backups.map((b) => ({
      id: b.id,
      name: b.name,
      createdAt: b.createdAt,
      size: b.size,
    })),
  );
});

router.get("/download/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const b = backups.find((x) => x.id === id);
  if (!b) return res.status(404).json({ message: "Respaldo no encontrado" });
  const payload = JSON.stringify(b.data, null, 2);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=${b.name}`);
  res.send(payload);
});

router.post("/restore", (req, res) => {
  const { backupId } = req.body || {};
  const b = backups.find((x) => x.id === parseInt(backupId));
  if (!b) return res.status(404).json({ message: "Respaldo no encontrado" });

  // Note: We need to update the store variables.
  // Since we exported them as 'let', reassigning them here works only if we change how we import/export
  // or if we mutate the arrays. But 'users = ...' won't update the reference in store.js if it was a direct export.
  // The 'store.js' exports properties of an object if we used module.exports = { users, ... }, but they are references to the initial values.
  // A better approach for in-memory store in CommonJS is to export an object that contains the data, so we can mutate the object properties.
  // However, given the current structure of store.js (exporting variables directly), mutation is tricky without a getter/setter or object wrapper.
  // I will assume for now we can mutate the arrays themselves (splice/push) effectively for arrays.

  // Clear and repopulate arrays to maintain reference
  if (Array.isArray(b.data.users)) {
    users.length = 0;
    users.push(...b.data.users);
  }
  if (Array.isArray(b.data.products)) {
    products.length = 0;
    products.push(...b.data.products);
  }
  if (Array.isArray(b.data.movements)) {
    movements.length = 0;
    movements.push(...b.data.movements);
  }
  if (Array.isArray(b.data.customers)) {
    customers.length = 0;
    customers.push(...b.data.customers);
  }

  backupLogs.push({
    ts: new Date().toISOString(),
    type: "RESTORE",
    message: `Sistema restaurado desde ${b.name}`,
    backupId: b.id,
  });
  save(); // Persist the restored data to disk
  res.json({ message: "Sistema restaurado", backupId: b.id });
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const exists = backups.some((b) => b.id === id);
  if (!exists)
    return res.status(404).json({ message: "Respaldo no encontrado" });
  const b = backups.find((x) => x.id === id);

  const idx = backups.findIndex((x) => x.id === id);
  if (idx !== -1) backups.splice(idx, 1);

  backupLogs.push({
    ts: new Date().toISOString(),
    type: "DELETE",
    message: `Respaldo ${b?.name || id} eliminado`,
    backupId: id,
  });
  res.json({ message: "Respaldo eliminado" });
});

router.get("/storage", (req, res) => {
  const used = backups.reduce((acc, b) => acc + (b.size || 0), 0);
  res.json({ usedBytes: used, capacityBytes: backupStorageCapacityBytes });
});

router.get("/logs", (req, res) => {
  res.json(backupLogs.slice().reverse());
});

router.post("/schedule", (req, res) => {
  const { enabled, frequency } = req.body || {};
  const valid = ["daily", "weekly", "monthly"];
  if (enabled && !valid.includes(frequency)) {
    return res.status(400).json({ message: "Frecuencia inválida" });
  }
  backupSchedule.enabled = !!enabled;
  backupSchedule.frequency = enabled ? frequency : null;
  const now = new Date();
  const next = new Date(now);
  if (enabled) {
    if (frequency === "daily") next.setDate(now.getDate() + 1);
    if (frequency === "weekly") next.setDate(now.getDate() + 7);
    if (frequency === "monthly") next.setMonth(now.getMonth() + 1);
    backupSchedule.nextRun = next.toISOString();
  } else {
    backupSchedule.nextRun = null;
  }
  backupLogs.push({
    ts: new Date().toISOString(),
    type: "SCHEDULE",
    message: `Programación: ${enabled ? frequency : "desactivada"}`,
  });
  res.json(backupSchedule);
});

router.get("/schedule", (req, res) => {
  res.json(backupSchedule);
});

module.exports = router;
