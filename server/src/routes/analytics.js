import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Issue from "../models/Issue.js";
import Poll from "../models/Poll.js";
import PollVote from "../models/PollVote.js";
import ForumThread from "../models/ForumThread.js";
import ForumPost from "../models/ForumPost.js";
import json2csv from "json2csv";
import { fn, literal } from "sequelize";

const router = express.Router();

const { Parser } = json2csv;

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform analytics and reporting
 */

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get platform engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                 issues:
 *                   type: object
 *                 messages:
 *                   type: object
 *                 polls:
 *                   type: object
 *                 forums:
 *                   type: object
 *       403:
 *         description: Access denied - admin or representative required
 *       500:
 *         description: Server error
 */

// GET /api/analytics - return engagement metrics
router.get("/", authenticate(["admin", "representative"]), async (req, res) => {
  try {
    const [totalUsers, citizenCount, repCount, adminCount] = await Promise.all([
      User.count(),
      User.count({ where: { role: "citizen" } }),
      User.count({ where: { role: "representative" } }),
      User.count({ where: { role: "admin" } }),
    ]);

    const totalIssues = await Issue.count();
    const resolvedIssues = await Issue.count({ where: { status: "resolved" } });
    const avgResolve = await Issue.findOne({
      attributes: [[fn("AVG", literal('EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))')), "avg"]],
      where: { status: "resolved" },
      raw: true,
    });

    const totalMessages = await Message.count();
    // average response time for representative replies
    const [replyRes] = await Message.sequelize.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (m."createdAt" - prev."createdAt"))) as avg
       FROM messages m
       JOIN users u ON u.id = m."senderId" AND u.role = 'representative'
       JOIN LATERAL (
         SELECT "createdAt" FROM messages x
         WHERE x."senderId" = m."recipientId" AND x."recipientId" = m."senderId" AND x."createdAt" < m."createdAt"
         ORDER BY "createdAt" DESC LIMIT 1
       ) prev ON true`
    );

    const polls = await Poll.count();
    const votes = await PollVote.count();

    const threads = await ForumThread.count();
    const posts = await ForumPost.count();

    res.json({
      users: { total: totalUsers, citizens: citizenCount, representatives: repCount, admins: adminCount },
      issues: { total: totalIssues, resolved: resolvedIssues, avgResolveHours: Number(avgResolve?.avg || 0) / 3600 },
      messages: { total: totalMessages, avgReplySeconds: Number(replyRes?.avg || 0) },
      polls: { total: polls, votes },
      forums: { threads, posts },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/export/issues:
 *   get:
 *     summary: Export issues data as CSV
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file with issues data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       403:
 *         description: Access denied - admin or representative required
 *       500:
 *         description: Server error
 */

// Export issues CSV
router.get("/export/issues", authenticate(["admin", "representative"]), async (req, res) => {
  try {
    const rows = await Issue.findAll({ raw: true });
    const csv = new Parser().parse(rows);
    res.header("Content-Type", "text/csv");
    res.attachment("issues.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/geographic:
 *   get:
 *     summary: Get geographic engagement data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geographic engagement statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   county:
 *                     type: string
 *                   ward:
 *                     type: string
 *                   issues:
 *                     type: integer
 *       403:
 *         description: Access denied - admin or representative required
 *       500:
 *         description: Server error
 */

// Geographic engagement
router.get("/geographic", authenticate(["admin", "representative"]), async (req, res) => {
  try {
    const rows = await Issue.findAll({
      attributes: ["county", "ward", [fn("COUNT", literal("*")), "issues"]],
      group: ["county", "ward"],
      raw: true,
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/demographic:
 *   get:
 *     summary: Get demographic participation data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demographic participation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ageRange:
 *                     type: string
 *                   gender:
 *                     type: string
 *                   interactions:
 *                     type: integer
 *       403:
 *         description: Access denied - admin or representative required
 *       500:
 *         description: Server error
 */

// Demographic participation
router.get("/demographic", authenticate(["admin", "representative"]), async (req, res) => {
  try {
    const [rows] = await User.sequelize.query(
      `SELECT "ageRange", gender, COUNT(i.*) AS interactions
       FROM users u LEFT JOIN interactions i ON i."userId" = u.id
       GROUP BY "ageRange", gender`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/policy:
 *   get:
 *     summary: Get policy engagement data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policy engagement statistics
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
 *                   views:
 *                     type: integer
 *       403:
 *         description: Access denied - admin or representative required
 *       500:
 *         description: Server error
 */

// Policy engagement
router.get("/policy", authenticate(["admin", "representative"]), async (req, res) => {
  try {
    const [rows] = await Issue.sequelize.query(
      `SELECT p.id, p.title, COUNT(i.*) AS views
       FROM policy_documents p LEFT JOIN interactions i ON i."refId" = p.id AND i.type = 'policy_view'
       GROUP BY p.id, p.title ORDER BY views DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/repScores:
 *   get:
 *     summary: Get representative accountability scores
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Representative performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   avg_reply_seconds:
 *                     type: number
 *                   resolve_ratio:
 *                     type: number
 *       500:
 *         description: Server error
 */

// Representative accountability scores
router.get("/repScores", authenticate(), async (req, res) => {
  try {
    const [rows] = await Message.sequelize.query(
      `WITH replies AS (
        SELECT r."senderId" as rep, EXTRACT(EPOCH FROM (r."createdAt" - prev."createdAt")) as diff
        FROM messages r
        JOIN users u ON u.id = r."senderId" AND u.role = 'representative'
        JOIN LATERAL (
          SELECT "createdAt" FROM messages prev
          WHERE prev."senderId" = r."recipientId" AND prev."recipientId" = r."senderId" AND prev."createdAt" < r."createdAt"
          ORDER BY "createdAt" DESC LIMIT 1
        ) prev ON true
      )
      SELECT u.id, u.name, COALESCE(AVG(replies.diff),0) AS avg_reply_seconds,
             SUM(CASE WHEN iss.status='resolved' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(iss.*),0) AS resolve_ratio
      FROM users u
      LEFT JOIN replies ON replies.rep = u.id
      LEFT JOIN issues iss ON iss."representativeId" = u.id
      WHERE u.role = 'representative'
      GROUP BY u.id, u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/analytics/me:
 *   get:
 *     summary: Get current user's activity summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 issues:
 *                   type: integer
 *                 messages:
 *                   type: integer
 *                 votes:
 *                   type: integer
 *                 posts:
 *                   type: integer
 *       500:
 *         description: Server error
 */

// My summary (citizen)
router.get("/me", authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const [issues, messages, votes, posts] = await Promise.all([
      Issue.count({ where: { citizenId: userId } }),
      Message.count({ where: { senderId: userId } }),
      PollVote.count({ where: { voterId: userId } }),
      ForumPost.count({ where: { authorId: userId } }),
    ]);
    res.json({ issues, messages, votes, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 