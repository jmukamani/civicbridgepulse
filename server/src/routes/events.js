import express from "express";
import { authenticate } from "../middleware/auth.js";
import Event from "../models/Event.js";
import EventRSVP from "../models/EventRSVP.js";
import { Op } from "sequelize";
import { sendNotification } from "../utils/notify.js";

const router = express.Router();

// Create event (representative)
router.post("/", authenticate("representative"), async (req, res) => {
  try {
    const { title, description, date, location, capacity, category } = req.body;
    if (!title || !date) return res.status(400).json({ message: "title and date required" });
    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      category,
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
    const { countyOnly, category, includePast } = req.query;
    const where = {};
    if (includePast === "1") {
      // no date filter or past events only? We'll include all events
    } else {
      // default upcoming
      where.date = { [Op.gte]: new Date() };
    }
    if (category) where.category = category;
    
    // County filtering - include events with matching county OR no county set
    if ((req.user.role === "citizen" || countyOnly === "1") && req.user.county) {
      where[Op.or] = [
        { county: req.user.county },
        { county: null }
      ];
    }
    
    const events = await Event.findAll({
      where,
      order: [["date", "ASC"]],
      include: [{ model: EventRSVP, as: "rsvps", attributes: ["id", "userId", "status"] }],
    });

    const result = events.map((ev) => {
      const plain = ev.get({ plain: true });
      plain.rsvpCount = plain.rsvps?.length || 0;
      const my = plain.rsvps?.find((r) => r.userId === req.user.id);
      plain.hasRsvped = Boolean(my);
      plain.userRsvpStatus = my?.status || null;
      delete plain.rsvps;
      return plain;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// RSVP to an event
router.post("/:id/rsvp", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "going" } = req.body;
    const event = await Event.findByPk(id, { include: [{ model: EventRSVP, as: "rsvps" }] });
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Capacity check only for 'going' status
    if (status === "going" && event.capacity && event.capacity > 0) {
      const currentGoing = event.rsvps.filter((r) => r.status === "going").length;
      if (currentGoing >= event.capacity) {
        return res.status(400).json({ message: "Event is at full capacity" });
      }
    }

    // Upsert RSVP
    const [rsvp] = await EventRSVP.upsert(
      {
        eventId: id,
        userId: req.user.id,
        status,
      },
      { returning: true }
    );

    const io = req.app.get("io");
    if (io && event.createdBy !== req.user.id) {
      await sendNotification(io, event.createdBy, {
        type: "event_rsvp",
        title: `New RSVP for event ${event.title}`,
        body: `${req.user.name || "Someone"} has RSVP'ed`,
        data: { eventId: id },
      });
    }

    res.status(200).json(rsvp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get RSVPs for event (count and list)
router.get("/:id/rsvps", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const rsvps = await EventRSVP.findAll({ where: { eventId: id } });
    res.json({ total: rsvps.length, rsvps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update event
router.put("/:id", authenticate("representative"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = (({ title, description, date, location, capacity, category }) => ({
      title,
      description,
      date,
      location,
      capacity,
      category,
    }))(req.body);

    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    // Only creator can edit (optional)
    if (event.createdBy !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    await event.update(updateFields);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete event
router.delete("/:id", authenticate("representative"), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy !== req.user.id) return res.status(403).json({ message: "Not allowed" });
    await event.destroy();
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 