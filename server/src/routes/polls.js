import express from "express";
import { authenticate } from "../middleware/auth.js";
import Poll from "../models/Poll.js";
import PollVote from "../models/PollVote.js";
import { logInteraction } from "../utils/logInteraction.js";
import ForumThread from "../models/ForumThread.js";
import ForumPost from "../models/ForumPost.js";
import { Op } from "sequelize";

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
    const { question, options, multiple = false, opensAt, closesAt } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid poll data" });
    }
    let status = "open";
    if (opensAt && new Date(opensAt) > new Date()) status = "scheduled";
    const poll = await Poll.create({
      question,
      options,
      multiple,
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      status,
      createdBy: req.user.id,
      county: req.user.county,
    });
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
    const where = {};
    if (req.user.role !== "admin" && req.user.county) where.county = req.user.county;

    // Citizens only see open polls within schedule
    if (req.user.role === "citizen") {
      where.status = "open";
      where[Op.and] = [
        { [Op.or]: [{ opensAt: null }, { opensAt: { [Op.lte]: new Date() } }] },
        { [Op.or]: [{ closesAt: null }, { closesAt: { [Op.gte]: new Date() } }] },
      ];
    }
    const polls = await Poll.findAll({ where, order: [["createdAt", "DESC"]] });
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
    const now = new Date();
    if (poll.status !== "open" || (poll.opensAt && poll.opensAt > now) || (poll.closesAt && poll.closesAt < now)) {
      return res.status(400).json({ message: "Poll closed" });
    }

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

// Update poll
router.patch("/:id", authenticate("representative"), async (req, res) => {
  try {
    const { id } = req.params;
    const fields = (({ question, options, multiple, status, opensAt, closesAt }) => ({
      question,
      options,
      multiple,
      status,
      opensAt,
      closesAt,
    }))(req.body);
    Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
    const poll = await Poll.findByPk(id);
    if (!poll) return res.status(404).json({ message: "Not found" });

    await poll.update(fields);
    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create discussion from poll
router.post("/:id/discussion", authenticate("representative"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, { include: { model: PollVote, as: "votes" } });
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.discussionThreadId) {
      return res.status(400).json({ message: "Discussion already exists" });
    }

    // Generate summary of results
    const counts = Array(poll.options.length).fill(0);
    poll.votes.forEach((v) => v.selected.forEach((idx) => counts[idx]++));
    const lines = poll.options.map((opt, i) => `- ${opt}: ${counts[i]} votes`).join("\n");
    const content = `Poll Results for **${poll.question}**\n\n${lines}`;

    const thread = await ForumThread.create({
      title: poll.question,
      createdBy: req.user.id,
      category: "poll_discussion",
    });
    await ForumPost.create({ threadId: thread.id, authorId: req.user.id, content });

    await poll.update({ discussionThreadId: thread.id });

    res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 