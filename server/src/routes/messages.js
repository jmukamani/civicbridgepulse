import express from "express";
import { authenticate } from "../middleware/auth.js";
import Message from "../models/Message.js";
import { Op } from "sequelize";
import MessageRating from "../models/MessageRating.js";
import sequelize from "../config/db.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Citizen messaging endpoints
 */

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *               topic:
 *                 type: string
 *               category:
 *                 type: string
 *                 default: other
 *     responses:
 *       201:
 *         description: Message created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/with/{userId}:
 *   get:
 *     summary: Retrieve messages between current user and another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Other user ID
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter by topic
 *     responses:
 *       200:
 *         description: Array of messages in conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   senderId:
 *                     type: string
 *                   recipientId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   topic:
 *                     type: string
 *                   category:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/{id}/read:
 *   patch:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       403:
 *         description: Access denied - not the recipient
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/{id}/delivered:
 *   post:
 *     summary: Mark a message as delivered
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as delivered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       403:
 *         description: Access denied - not the recipient
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/search:
 *   get:
 *     summary: Search and filter messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for message content
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Array of matching messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   senderId:
 *                     type: string
 *                   recipientId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   category:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/{id}/rate:
 *   post:
 *     summary: Rate a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message rating created
 *       403:
 *         description: Access denied - only citizens can rate
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/messages/threads:
 *   get:
 *     summary: Get list of message threads for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of latest messages from each conversation thread
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   senderId:
 *                     type: string
 *                   recipientId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

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