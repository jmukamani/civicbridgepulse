import express from "express";
import { authenticate } from "../middleware/auth.js";
import PolicyComment from "../models/PolicyComment.js";

const router = express.Router();

// List comments for a policy
router.get("/:policyId/comments", authenticate(), async (req, res) => {
  try {
    const comments = await PolicyComment.findAll({
      where: { policyId: req.params.policyId },
      order: [["createdAt", "ASC"]],
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:policyId/comments", authenticate(), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content required" });
    const comment = await PolicyComment.create({
      policyId: req.params.policyId,
      authorId: req.user.id,
      content,
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 