import express from "express";
import { authenticate } from "../middleware/auth.js";
import Message from "../models/Message.js";
import { Op } from "sequelize";
import MessageRating from "../models/MessageRating.js";
import sequelize from "../config/db.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

// Send message
router.post("/send", authenticate(), async (req, res) => {
  try {
    const { recipientId, content, topic, category = "other" } = req.body;
    if (!recipientId || !content) {
      return res.status(400).json({ message: "recipientId and content are required" });
    }
    const msg = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
      topic,
      category,
    });
    // log interaction for sender
    await logInteraction(req.user.id, "message", msg.id);
    const io = req.app.get("io");
    if (io) {
      io.to(recipientId).emit("new_message", msg);
    }
    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Retrieve messages between current user and another user (optionally filter by topic)
router.get("/with/:userId", authenticate(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { topic } = req.query;

    const where = {
      [Op.or]: [
        { senderId: req.user.id, recipientId: userId },
        { senderId: userId, recipientId: req.user.id },
      ],
    };
    if (topic) where.topic = topic;

    const messages = await Message.findAll({
      where,
      order: [["createdAt", "ASC"]],
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark message as read
router.patch("/:id/read", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.recipientId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    msg.read = true;
    await msg.save();
    const io = req.app.get("io");
    if (io) {
      io.to(msg.senderId).emit("message_read", { id: msg.id });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// mark delivered when client acknowledges
router.post("/:id/delivered", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.recipientId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    msg.deliveredAt = new Date();
    await msg.save();
    const io = req.app.get("io");
    if (io) io.to(msg.senderId).emit("message_delivered", { id: msg.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search & filter
router.get("/search", authenticate(), async (req, res) => {
  try {
    const { q, category } = req.query;
    const where = {
      [Op.or]: [
        { senderId: req.user.id },
        { recipientId: req.user.id },
      ],
    };
    if (category) where.category = category;
    if (q) where.content = { [Op.iLike]: `%${q}%` };
    const messages = await Message.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Rate message
router.post("/:id/rate", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (req.user.role !== "citizen") return res.status(403).json({ message: "Only citizens can rate" });
    const rated = await MessageRating.create({ messageId: id, raterId: req.user.id, rating, comment });
    res.status(201).json(rated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Threads list
router.get("/threads", authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const msgs = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { recipientId: userId }],
      },
      order: [["createdAt", "DESC"]],
    });
    const map = new Map();
    msgs.forEach((m) => {
      const other = m.senderId === userId ? m.recipientId : m.senderId;
      if (!map.has(other)) map.set(other, m);
    });
    res.json(Array.from(map.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 