import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import PolicyDocument from "../models/PolicyDocument.js";
import { Op } from "sequelize";
import { extractText, generateSummary, translateToSwahili } from "../utils/policyProcessing.js";
import { logInteraction } from "../utils/logInteraction.js";

const router = express.Router();

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join("uploads", "policies");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload policy document (representatives only)
router.post("/upload", authenticate(["representative", "admin"]), upload.single("file"), async (req, res) => {
  try {
    let { title, category = "other", summary_en = "", summary_sw = "", status = "published", budget } = req.body;
    if (!req.file) return res.status(400).json({ message: "file required" });
    if (!summary_en) {
      const text = await extractText(req.file.path, req.file.mimetype);
      if (text) {
        summary_en = generateSummary(text);
      }
    }
    if (!summary_en) {
      return res.status(400).json({ message: "Unable to extract text from document. Please provide a summary." });
    }
    if (!summary_sw) {
      summary_sw = await translateToSwahili(summary_en);
    }
    const doc = await PolicyDocument.create({
      title,
      category,
      summary_en,
      summary_sw,
      status,
      budget: budget ? JSON.parse(budget) : null,
      filePath: req.file.path.replace(/\\/g, "/"),
      uploadedBy: req.user.id,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List/Search documents
router.get("/", authenticate(), async (req, res) => {
  try {
    const { q, category } = req.query;
    const where = { status: "published" };
    if (req.user.role === "representative" || req.user.role === "admin") delete where.status;
    if (category) where.category = category;
    if (q) where.title = { [Op.iLike]: `%${q}%` };
    const docs = await PolicyDocument.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get metadata
router.get("/:id", authenticate(), async (req, res) => {
  const doc = await PolicyDocument.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  if (doc.status !== "published" && req.user.role === "citizen") return res.status(403).json({ message: "Forbidden" });
  await logInteraction(req.user.id, "policy_view", doc.id);
  res.json(doc);
});

// Serve file
router.get("/:id/file", authenticate(), async (req, res) => {
  const doc = await PolicyDocument.findByPk(req.params.id);
  if (!doc) return res.sendStatus(404);
  if (doc.status !== "published" && req.user.role === "citizen") return res.sendStatus(403);
  res.sendFile(path.resolve(doc.filePath));
});

export default router; 