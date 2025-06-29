import express from "express";
import { authenticate } from "../middleware/auth.js";
import Issue from "../models/Issue.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

// Create a new issue (citizens)
router.post("/", authenticate("citizen"), async (req, res) => {
  try {
    const { title, description, category = "other", location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "title and description are required" });
    }
    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      citizenId: req.user.id,
      county: req.user.county,
      ward: req.user.ward,
    });
    await logInteraction(req.user.id, "issue", issue.id);
    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List issues relevant to current user
router.get("/", authenticate(), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "citizen") {
      where.citizenId = req.user.id;
    }
    const issues = await Issue.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Assign an issue to the current representative (or admin specify repId)
router.post("/:id/assign", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { representativeId } = req.body; // optional when admin

    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Representatives can only assign themselves
    let repId = representativeId;
    if (req.user.role === "representative") {
      repId = req.user.id;
    }
    issue.representativeId = repId;
    issue.status = "acknowledged";
    await issue.save();
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update status (acknowledged/resolved)
router.patch("/:id/status", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected "acknowledged" or "resolved"

    if (!["reported", "acknowledged", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Permission checks
    if (req.user.role === "citizen" && issue.citizenId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user.role === "representative" && issue.representativeId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    issue.status = status;
    await issue.save();
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 