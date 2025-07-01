import express from "express";
import { authenticate } from "../middleware/auth.js";
import Poll from "../models/Poll.js";
import PollVote from "../models/PollVote.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Polls
 *   description: Polling and voting system
 */

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *               multiple:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Poll successfully created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied - representative required
 *       500:
 *         description: Server error
 */

// Create poll (representative)
router.post("/", authenticate("representative"), async (req, res) => {
  try {
    const { question, options, multiple = false } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid poll data" });
    }
    const poll = await Poll.create({ question, options, multiple, createdBy: req.user.id });
    res.status(201).json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/polls:
 *   get:
 *     summary: List all polls
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of polls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   question:
 *                     type: string
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                   multiple:
 *                     type: boolean
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

// List polls (all)
router.get("/", authenticate(), async (req, res) => {
  try {
    const polls = await Poll.findAll({ order: [["createdAt", "DESC"]] });
    res.json(polls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/polls/{id}:
 *   get:
 *     summary: Get specific poll with results
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll with voting results
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Server error
 */

// Get poll with results
router.get("/:id", authenticate(), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, { include: { model: PollVote, as: "votes" } });
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/polls/{id}/vote:
 *   post:
 *     summary: Vote in a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selected
 *             properties:
 *               selected:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of option indexes
 *     responses:
 *       200:
 *         description: Vote successfully recorded
 *       400:
 *         description: Validation error or poll closed
 *       403:
 *         description: Access denied - citizen required
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Server error
 */

// Vote in poll
router.post("/:id/vote", authenticate("citizen"), async (req, res) => {
  try {
    const { selected } = req.body; // array of indexes
    if (!Array.isArray(selected) || selected.length === 0) {
      return res.status(400).json({ message: "No selection" });
    }
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.status !== "open") return res.status(400).json({ message: "Poll closed" });

    // validate selection length
    if (!poll.multiple && selected.length > 1) {
      return res.status(400).json({ message: "Multiple selection not allowed" });
    }
    if (selected.some((i) => i < 0 || i >= poll.options.length)) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // create or update vote
    const [vote] = await PollVote.upsert(
      { pollId: poll.id, voterId: req.user.id, selected },
      { returning: true }
    );
    await logInteraction(req.user.id, "poll_vote", poll.id);
    res.json(vote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete poll (representative)
router.delete("/:id", authenticate("representative"), async (req, res) => {
  try {
    const id = req.params.id;
    const poll = await Poll.findByPk(id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    // remove associated votes first
    await PollVote.destroy({ where: { pollId: id } });
    await poll.destroy();
    res.json({ message: "Poll deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 