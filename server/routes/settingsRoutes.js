const express = require("express");
const router = express.Router();
const store = require("../data/store");

router.get("/audit", (req, res) => {
  // Return the last 1000 logs descending
  const logs = [...store.auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1000);
  res.json(logs);
});

router.get("/notifications", (req, res) => {
  res.json(store.notifications);
});

router.patch("/notifications", (req, res) => {
  Object.assign(store.notifications, req.body);
  store.save();
  res.json(store.notifications);
});

router.get("/system", (req, res) => {
  res.json(store.systemConfig);
});

router.patch("/system", (req, res) => {
  Object.assign(store.systemConfig, req.body);
  store.save();
  res.json(store.systemConfig);
});

module.exports = router;
