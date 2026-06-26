const express = require("express");
const router = express.Router();
const store = require("../data/store");

router.get("/", (req, res) => {
  res.json(store.plans);
});

module.exports = router;
