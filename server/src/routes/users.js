import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import { Op } from "sequelize";

const router = express.Router();

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