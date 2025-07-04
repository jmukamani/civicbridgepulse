import express from "express";
import { authenticate } from "../middleware/auth.js";
import ForumThread from "../models/ForumThread.js";
import ForumPost from "../models/ForumPost.js";
import User from "../models/User.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forums
 *   description: Community discussion forums
 */

/**
 * @swagger
 * /api/forums/threads:
 *   post:
 *     summary: Create a new forum thread
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thread successfully created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/forums/threads:
 *   get:
 *     summary: List all forum threads
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of forum threads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   createdBy:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

// List threads
router.get("/threads", authenticate(), async (req, res) => {
  try {
    // Include number of posts (replies) per thread
    const threads = await ForumThread.findAll({
      attributes: {
        include: [
          [
            // Count the number of posts for each thread using a sub-query
            ForumThread.sequelize.literal(`(
              SELECT COUNT(*) FROM "forum_posts" AS posts WHERE posts."threadId" = "ForumThread"."id"
            )`),
            "postCount",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/forums/threads/{id}:
 *   get:
 *     summary: Get specific thread with all posts
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread with posts
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */

// Get thread with posts
router.get("/threads/:id", authenticate(), async (req, res) => {
  try {
    const thread = await ForumThread.findByPk(req.params.id, {
      include: {
        model: ForumPost,
        as: "posts",
        include: { model: User, as: "author", attributes: ["id", "role", "name"] },
      },
      order: [[{ model: ForumPost, as: "posts" }, "createdAt", "ASC"]],
    });
    if (!thread) return res.status(404).json({ message: "Not found" });
    res.json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/forums/threads/{id}/posts:
 *   post:
 *     summary: Create a new post in a thread
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post successfully created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

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