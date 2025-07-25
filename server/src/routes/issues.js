import express from "express";
import { authenticate } from "../middleware/auth.js";
import Issue from "../models/Issue.js";
import { logInteraction } from "../utils/logInteraction.js";
import IssueStatusHistory from "../models/IssueStatusHistory.js";
import { Op } from "sequelize";
import { sendNotification } from "../utils/notify.js";
import User from "../models/User.js";

const router = express.Router();

const categoryToSpecializationMap = {
  infrastructure: [
    "Infrastructure & Roads",
    "Water & Sanitation",
    "Housing & Urban Planning",
    "Transport & Mobility",
    "Energy & Utilities"
  ],
  service: [
    "Social Services",
    "Healthcare Services",
    "Education",
    "Economic Development"
  ],
  environment: [
    "Environmental Issues",
    "Water & Sanitation",
    "Agriculture & Livestock"
  ],
  security: ["Security & Safety"],
  other: [] // Fallback – show all reps
};

// Find relevant representatives for an issue
const findRelevantRepresentatives = async (category, county) => {
  const relevantSpecializations = categoryToSpecializationMap[category] || [];
  
  const where = {
    role: "representative",
    isRepVerified: true,
    verificationStatus: "approved",
  };

  if (county) {
    where.county = county;
  }

  // If category has specific specializations, filter by them
  if (relevantSpecializations.length > 0) {
    where.specializations = {
      [Op.overlap]: relevantSpecializations
    };
  }

  const representatives = await User.findAll({
    where,
    attributes: ["id", "name", "email", "specializations"],
    order: [["name", "ASC"]]
  });

  return representatives;
};

/**
 * @swagger
 * tags:
 *   name: Issues
 *   description: Citizen issue reporting and management
 */

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
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
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 default: other
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Issue successfully created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

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

    // Find relevant representatives for this issue
    const suggestedRepresentatives = await findRelevantRepresentatives(category, req.user.county);

    res.status(201).json({
      ...issue.toJSON(),
      suggestedRepresentatives
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: List issues relevant to the current user
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of issues
 *       500:
 *         description: Server error
 */

// Enhanced list with filters & search
router.get("/", authenticate(), async (req, res) => {
  try {
    let where = {};
    if (req.user.role === "citizen") {
      where.citizenId = req.user.id;
    } else if (req.user.role === "representative") {
      // Representatives: show all issues if showAll=true, else filter by specialization
      if (!req.query.showAll || req.query.showAll === 'false') {
        const userSpecs = req.user.specializations || [];
        const relevantCategories = Object.entries(categoryToSpecializationMap)
          .filter(([cat, specs]) => specs.length === 0 || specs.some(spec => userSpecs.includes(spec)))
          .map(([cat]) => cat);
        if (relevantCategories.length > 0) {
          where.category = { [Op.in]: relevantCategories };
        }
      }
    }
    // Optionally add filters from query params (status, category, etc.)
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.q) where.title = { [Op.iLike]: `%${req.query.q}%` };
    const issues = await Issue.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/issues/{id}/assign:
 *   post:
 *     summary: Assign an issue to a representative
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Issue ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               representativeId:
 *                 type: string
 *                 description: Representative ID (admin only, representatives assign to themselves)
 *     responses:
 *       200:
 *         description: Issue successfully assigned
 *       403:
 *         description: Access denied - representative or admin required
 *       404:
 *         description: Issue not found
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/issues/{id}/status:
 *   patch:
 *     summary: Update issue status
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Issue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reported, acknowledged, resolved]
 *     responses:
 *       200:
 *         description: Issue status updated successfully
 *       400:
 *         description: Invalid status value
 *       403:
 *         description: Access denied - not owner or assigned representative
 *       404:
 *         description: Issue not found
 *       500:
 *         description: Server error
 */

// Update status (acknowledged/resolved)
/**
 * @swagger
 * /api/issues/{id}/suggested-representatives:
 *   get:
 *     summary: Get suggested representatives for an issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 */

// Get suggested representatives for an issue
router.get("/:id/suggested-representatives", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id);
    
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const suggestedRepresentatives = await findRelevantRepresentatives(issue.category, issue.county);
    res.json(suggestedRepresentatives);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/status", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowed = [
      "reported",
      "acknowledged",
      "in_progress",
      "blocked",
      "under_review",
      "resolved",
      "closed",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Permission checks for representatives & admins, citizens only allowed reported->closed maybe
    if (req.user.role === "citizen" && issue.citizenId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "representative" && issue.representativeId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    issue.status = status;
    await issue.save();

    // Log history
    await IssueStatusHistory.create({ issueId: id, status, changedBy: req.user.id, note: note || null });

    // Real-time notification to reporting citizen
    const io = req.app.get("io");
    if (io) {
      io.to(issue.citizenId).emit("issue_status", {
        issueId: id,
        status,
        note: note || null,
      });
      await sendNotification(io, issue.citizenId, {
        type: "issue_status",
        title: `Issue status updated to ${status}`,
        body: note || issue.title,
        data: { issueId: id, status },
      });
    }

    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Timeline endpoint
router.get("/:id/history", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const history = await IssueStatusHistory.findAll({ where: { issueId: id }, order: [["createdAt", "ASC"]] });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 