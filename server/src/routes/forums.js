import express from "express";
import { authenticate } from "../middleware/auth.js";
import ForumThread from "../models/ForumThread.js";
import ForumPost from "../models/ForumPost.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

// Create thread
router.post("/threads", authenticate(), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });
    const thread = await ForumThread.create({ title, category, createdBy: req.user.id });
    res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List threads
router.get("/threads", authenticate(), async (req, res) => {
  try {
    const threads = await ForumThread.findAll({ order: [["createdAt", "DESC"]] });
    res.json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get thread with posts
router.get("/threads/:id", authenticate(), async (req, res) => {
  try {
    const thread = await ForumThread.findByPk(req.params.id, {
      include: { model: ForumPost, as: "posts" },
      order: [[{ model: ForumPost, as: "posts" }, "createdAt", "ASC"]],
    });
    if (!thread) return res.status(404).json({ message: "Not found" });
    res.json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post in thread
router.post("/threads/:id/posts", authenticate(), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content required" });
    const post = await ForumPost.create({ threadId: req.params.id, authorId: req.user.id, content });
    await logInteraction(req.user.id, "forum_post", post.id);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 