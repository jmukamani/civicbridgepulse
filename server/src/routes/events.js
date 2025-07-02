import express from "express";
import { authenticate } from "../middleware/auth.js";
import Event from "../models/Event.js";
import { Op } from "sequelize";

const router = express.Router();

// Create event (representative)
router.post("/", authenticate("representative"), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    if (!title || !date) return res.status(400).json({ message: "title and date required" });
    const event = await Event.create({
      title,
      description,
      date,
      location,
      county: req.user.county,
      createdBy: req.user.id,
    });
    // broadcast via socket to citizens in county if desired
    const io = req.app.get("io");
    io.emit("event_new", { county: event.county });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List upcoming events (future events)
router.get("/", authenticate(), async (req, res) => {
  try {
    const { countyOnly } = req.query;
    const where = { date: { [Op.gte]: new Date() } };
    if ((req.user.role === "citizen" || countyOnly === "1") && req.user.county) {
      where.county = req.user.county;
    }
    const events = await Event.findAll({ where, order: [["date", "ASC"]] });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 