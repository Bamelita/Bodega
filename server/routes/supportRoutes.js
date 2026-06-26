const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET /api/support/messages (Admin only, see index.js for middleware)
router.get("/messages", (req, res) => {
  // Sort descending by date
  const messages = [...(store.supportMessages || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  res.json(messages);
});

// POST /api/support/messages (User creates ticket)
router.post("/messages", (req, res) => {
  const { subject, text } = req.body;
  if (!subject || !text) {
    return res.status(400).json({ message: "Asunto y mensaje son requeridos" });
  }

  const newMessage = {
    id: Date.now(),
    subject,
    text,
    user: req.user.username, // Assuming req.user is set by authMiddleware
    userId: req.user.id,
    date: new Date().toISOString(),
    read: false,
  };

  if (!store.supportMessages) {
    store.supportMessages = [];
  }
  
  store.supportMessages.push(newMessage);
  store.save();
  
  res.status(201).json(newMessage);
});

// PATCH /api/support/messages/:id/read (Admin marks as read)
router.patch("/messages/:id/read", (req, res) => {
  const msgId = parseInt(req.params.id);
  const msg = (store.supportMessages || []).find((m) => m.id === msgId);
  
  if (!msg) {
    return res.status(404).json({ message: "Mensaje no encontrado" });
  }

  msg.read = true;
  store.save();
  
  res.json(msg);
});

module.exports = router;
