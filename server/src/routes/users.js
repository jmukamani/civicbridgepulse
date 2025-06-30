import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import { Op } from "sequelize";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users with optional filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [citizen, representative, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name or email
 *     responses:
 *       200:
 *         description: Array of users (limited to 20 results)
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
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       500:
 *         description: Server error
 */

// List users (optionally filter by role and search query)
router.get("/", authenticate(), async (req, res) => {
  try {
    const { role, q } = req.query;
    const where = {};
    if (role) where.role = role;
    if (q) where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
    const users = await User.findAll({
      where,
      limit: 20,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "email", "role"],
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               county:
 *                 type: string
 *               ward:
 *                 type: string
 *               ageRange:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Server error
 */

// Update own profile
router.patch("/profile", authenticate(), async (req, res) => {
  try {
    const allowed = ["name", "county", "ward", "ageRange", "gender"];
    const data = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const user = await User.findByPk(req.user.id);
    Object.assign(user, data);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 