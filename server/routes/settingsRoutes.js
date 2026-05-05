const express = require("express");
const router = express.Router();
const store = require("../data/store");

router.get("/audit", (req, res) => {
  // Return the last 1000 logs descending
  const logs = [...store.auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1000);
  res.json(logs);
});

module.exports = router;
