import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import Issue from "../models/Issue.js";
import Poll from "../models/Poll.js";
import { Op } from "sequelize";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative functions and user management
 */

/**
 * @swagger
 * /api/admin/pending-representatives:
 *   get:
 *     summary: Get all pending representative verification requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending representatives
 *       403:
 *         description: Access denied - admin required
 */

// Get pending representative verifications
router.get("/pending-representatives", authenticate("admin"), async (req, res) => {
  try {
    const pendingReps = await User.findAll({
      where: {
        role: "representative",
        verificationStatus: "pending"
      },
      attributes: ["id", "name", "email", "county", "specializations", "verificationDocs", "createdAt"],
      order: [["createdAt", "ASC"]]
    });

    res.json(pendingReps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/verify-representative:
 *   post:
 *     summary: Approve or reject representative verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - action
 *             properties:
 *               userId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 */

// Verify representative (approve/reject)
router.post("/verify-representative", authenticate("admin"), async (req, res) => {
  try {
    const { userId, action, reason } = req.body;

    if (!userId || !action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== "representative") {
      return res.status(404).json({ message: "Representative not found" });
    }

    if (action === "approve") {
      user.verificationStatus = "approved";
      user.isRepVerified = true;
      
      // Send approval email
      const html = `<p>Hi ${user.name},</p><p>Your representative account has been approved! You can now access all representative features on CivicBridgePulse Kenya.</p><p>Thank you for your commitment to serving your community.</p>`;
      await sendEmail(user.email, "Representative Account Approved", html);
      
    } else if (action === "reject") {
      user.verificationStatus = "rejected";
      user.isRepVerified = false;
      
      // Send rejection email
      const reasonText = reason ? `\n\nReason: ${reason}` : "";
      const html = `<p>Hi ${user.name},</p><p>We regret to inform you that your representative account verification has been rejected.${reasonText}</p><p>If you believe this is an error, please contact support.</p>`;
      await sendEmail(user.email, "Representative Account Verification", html);
    }

    await user.save();
    
    res.json({ 
      message: `Representative ${action}d successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
        isRepVerified: user.isRepVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by verification status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 */

// Get all users (admin view)
router.get("/users", authenticate("admin"), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, q } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (role) where.role = role;
    if (status) where.verificationStatus = status;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        "id", "name", "email", "role", "isActive", "isVerified", "isRepVerified", 
        "verificationStatus", "county", "specializations", "createdAt"
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update user role and isActive status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [citizen, representative, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Update user (role, isActive)
router.patch("/users/:id", authenticate("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();
    res.json({ message: "User updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Delete user
router.delete("/users/:id", authenticate("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */

// Admin dashboard stats
router.get("/dashboard", authenticate("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      citizenCount,
      representativeCount,
      pendingReps,
      verifiedReps,
      rejectedReps,
      totalIssues,
      openIssues,
      resolvedIssues,
      totalPolls
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "citizen" } }),
      User.count({ where: { role: "representative" } }),
      User.count({ where: { role: "representative", verificationStatus: "pending" } }),
      User.count({ where: { role: "representative", verificationStatus: "approved" } }),
      User.count({ where: { role: "representative", verificationStatus: "rejected" } }),
      Issue.count(),
      Issue.count({ where: { status: { [Op.in]: ["reported", "acknowledged", "in_progress"] } } }),
      Issue.count({ where: { status: "resolved" } }),
      Poll.count()
    ]);

    res.json({
      users: {
        total: totalUsers,
        citizens: citizenCount,
        representatives: representativeCount
      },
      representatives: {
        pending: pendingReps,
        verified: verifiedReps,
        rejected: rejectedReps
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        resolved: resolvedIssues
      },
      polls: {
        total: totalPolls
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/specializations:
 *   get:
 *     summary: Get available specialization areas
 *     tags: [Admin]
 */

// Get available specializations
router.get("/specializations", async (req, res) => {
  try {
    const specializations = [
      "Water and Sanitation",
      "Infrastructure and Roads",
      "Environment and Climate",
      "Education",
      "Healthcare",
      "Security and Safety",
      "Agriculture and Food",
      "Economic Development",
      "Social Services",
      "Transport and Mobility",
      "Housing and Urban Planning",
      "Technology and Innovation"
    ];

    res.json(specializations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 