import express from "express";
import { authenticate } from "../middleware/auth.js";
import Poll from "../models/Poll.js";
import PollVote from "../models/PollVote.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

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

export default router; 