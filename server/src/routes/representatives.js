import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import RepresentativeRating from "../models/RepresentativeRating.js";

const router = express.Router();

// In-memory leaderboard visibility (for demo)
let leaderboardVisibleToCitizens = false;
let leaderboardVisibleToReps = false;

// POST /api/representatives/:id/ratings - Citizen submits a rating after issue/message resolved
router.post("/:id/ratings", authenticate(["citizen"]), async (req, res) => {
  try {
    const { responsiveness, issueResolution, engagement, comment, issueId, messageThreadId } = req.body;
    if (![responsiveness, issueResolution, engagement].every(r => Number.isInteger(r) && r >= 1 && r <= 5)) {
      return res.status(400).json({ message: "All ratings must be integers 1-5" });
    }
    // Only allow rating if issueId or messageThreadId is provided
    if (!issueId && !messageThreadId) {
      return res.status(400).json({ message: "Must provide issueId or messageThreadId" });
    }
    // Create anonymous rating
    await RepresentativeRating.create({
      representativeId: req.params.id,
      responsiveness,
      issueResolution,
      engagement,
      comment,
      issueId,
      messageThreadId,
    });
    res.status(201).json({ message: "Rating submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/representatives/:id/ratings - Admin views all ratings for a rep
router.get("/:id/ratings", authenticate(["admin"]), async (req, res) => {
  try {
    const ratings = await RepresentativeRating.findAll({
      where: { representativeId: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/representatives/leaderboard - Leaderboard for admin, citizens, or reps
router.get("/leaderboard", authenticate(), async (req, res) => {
  try {
    // Only show to admin, or to citizens/reps if enabled
    if (
      req.user.role !== "admin" &&
      !(leaderboardVisibleToCitizens && req.user.role === "citizen") &&
      !(leaderboardVisibleToReps && req.user.role === "representative")
    ) {
      return res.status(403).json({ message: "Leaderboard not available" });
    }
    // Aggregate leaderboard
    const reps = await User.findAll({ where: { role: "representative" } });
    const ratings = await RepresentativeRating.findAll();
    const leaderboard = reps.map(rep => {
      const repRatings = ratings.filter(r => r.representativeId === rep.id);
      const count = repRatings.length;
      const avg = count
        ? {
            responsiveness: (repRatings.reduce((a, r) => a + r.responsiveness, 0) / count).toFixed(2),
            issueResolution: (repRatings.reduce((a, r) => a + r.issueResolution, 0) / count).toFixed(2),
            engagement: (repRatings.reduce((a, r) => a + r.engagement, 0) / count).toFixed(2),
          }
        : { responsiveness: null, issueResolution: null, engagement: null };
      return {
        id: rep.id,
        name: rep.name,
        county: rep.county,
        count,
        avg,
      };
    });
    leaderboard.sort((a, b) => b.count - a.count);
    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/representatives/leaderboard-visibility - Admin toggles leaderboard visibility
router.patch("/leaderboard-visibility", authenticate(["admin"]), async (req, res) => {
  const { citizens, representatives } = req.body;
  if (typeof citizens === "boolean") leaderboardVisibleToCitizens = citizens;
  if (typeof representatives === "boolean") leaderboardVisibleToReps = representatives;
  res.json({ citizens: leaderboardVisibleToCitizens, representatives: leaderboardVisibleToReps });
});

export default router; 