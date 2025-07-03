import express from "express";
import { authenticate } from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import PushSubscription from "../models/PushSubscription.js";

const router = express.Router();

// List notifications (optionally unreadOnly)
router.get("/", authenticate(), async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === "1") where.read = false;
    const offset = (Number(page) - 1) * Number(limit);
    const notifs = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notifications as read (bulk)
router.post("/mark-read", authenticate(), async (req, res) => {
  try {
    const { ids } = req.body; // array of notification ids
    if (!Array.isArray(ids)) return res.status(400).json({ message: "ids array required" });
    await Notification.update({ read: true }, { where: { id: ids, userId: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get or create user notification preferences
router.get("/preferences", authenticate(), async (req, res) => {
  try {
    let pref = await NotificationPreference.findByPk(req.user.id);
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user.id });
    }
    res.json(pref);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update preferences
router.put("/preferences", authenticate(), async (req, res) => {
  try {
    const { inApp, push, email } = req.body;
    let pref = await NotificationPreference.findByPk(req.user.id);
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user.id });
    }
    await pref.update({ inApp, push, email });
    res.json(pref);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Save push subscription
router.post("/subscribe", authenticate(), async (req, res) => {
  try {
    const sub = req.body; // {endpoint, keys}
    if (!sub?.endpoint || !sub?.keys) return res.status(400).json({ message: "invalid subscription" });
    await PushSubscription.upsert({ userId: req.user.id, endpoint: sub.endpoint, keys: sub.keys });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 