import express from "express";
import { authenticate } from "../middleware/auth.js";
import PolicyComment from "../models/PolicyComment.js";
import PolicyDocument from "../models/PolicyDocument.js";
import { sendNotification } from "../utils/notify.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PolicyComments
 *   description: Policy document comments and discussions
 */

/**
 * @swagger
 * /api/{policyId}/comments:
 *   get:
 *     summary: List comments for a specific policy
 *     tags: [PolicyComments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy document ID
 *     responses:
 *       200:
 *         description: Array of comments for the policy
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   policyId:
 *                     type: integer
 *                   authorId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

// List comments for a policy
router.get("/:policyId/comments", authenticate(), async (req, res) => {
  try {
    const comments = await PolicyComment.findAll({
      where: { policyId: req.params.policyId },
      order: [["createdAt", "ASC"]],
      include: [{ model: User, as: "author", attributes: ["id", "role", "name"] }],
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/{policyId}/comments:
 *   post:
 *     summary: Create a new comment on a policy
 *     tags: [PolicyComments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy document ID
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
 *         description: Comment successfully created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post("/:policyId/comments", authenticate(), async (req, res) => {
  try {
    const { content, anonymous, parentId } = req.body;
    if (!content) return res.status(400).json({ message: "content required" });
    const isCitizen = req.user.role === "citizen";
    // Only allow one level deep replies
    let validParentId = null;
    if (parentId) {
      const parent = await PolicyComment.findByPk(parentId);
      if (parent && !parent.parentId) {
        validParentId = parentId;
      }
    }
    const comment = await PolicyComment.create({
      policyId: req.params.policyId,
      authorId: req.user.id,
      content,
      anonymous: isCitizen ? !!anonymous : false,
      parentId: validParentId,
    });

    // Notify policy owner via Socket.io
    try {
      const policy = await PolicyDocument.findByPk(req.params.policyId);
      if (policy) {
        const io = req.app.get("io");
        io.to(policy.uploadedBy).emit("policy_comment", { policyId: policy.id });
        await sendNotification(io, policy.uploadedBy, {
          type: "policy_comment",
          title: `New comment on policy ${policy.title}`,
          body: content.slice(0, 100),
          data: { policyId: policy.id, commentId: comment.id },
        });
      }
    } catch {}

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 