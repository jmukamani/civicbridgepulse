import express from "express";
import { Op, literal, fn, col } from "sequelize";
import { authenticate } from "../middleware/auth.js";
import Resource from "../models/Resource.js";
import ResourceBookmark from "../models/ResourceBookmark.js";
import ResourceAccessLog from "../models/ResourceAccessLog.js";

const router = express.Router();

// Create resource (representative or admin)
router.post("/", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const { title, description = "", fileUrl = null, externalUrl = null, category, tags = [] } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const resource = await Resource.create({
      title,
      description,
      fileUrl,
      externalUrl,
      category,
      tags: Array.isArray(tags) ? tags : tags?.split?.(",") || [],
      createdBy: req.user.id,
      county: req.user.county, // Add county field to match fetching logic
    });
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Full-text search & filters
router.get("/", authenticate(), async (req, res) => {
  try {
    const { q, category, tags, recent, bookmarked } = req.query;

    const where = {};
    if (category) where.category = category;
    if (tags) {
      const arr = tags.split(",").map((t) => t.trim());
      where.tags = { [Op.overlap]: arr };
    }

    // County scoping - include resources with matching county OR no county set
    if (req.user.county) {
      where[Op.or] = [
        { county: req.user.county },
        { county: null }
      ];
    }

    if (q) {
      // simple ILIKE, could switch to to_tsquery
      where.title = { [Op.iLike]: `%${q}%` };
    }

    // Base query
    const queryOpts = { where, order: [["createdAt", "DESC"]] };

    // recent/bookmarked overrides
    if (recent === "true") {
      const recents = await ResourceAccessLog.findAll({
        where: { userId: req.user.id },
        order: [["accessedAt", "DESC"]],
        limit: 20,
      });
      const ids = recents.map((r) => r.resourceId);
      queryOpts.where.id = ids.length ? ids : null; // empty result if none
      queryOpts.order = literal(`array_position(ARRAY[${ids.map((id) => `'${id}'`).join("," )}]::uuid[], id)`);
    }

    if (bookmarked === "true") {
      const bms = await ResourceBookmark.findAll({ where: { userId: req.user.id } });
      const ids = bms.map((b) => b.resourceId);
      queryOpts.where.id = ids.length ? ids : null;
    }

    const list = await Resource.findAll(queryOpts);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get resource (logs access)
router.get("/:id", authenticate(), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    await ResourceAccessLog.create({ resourceId: resource.id, userId: req.user.id });
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update resource
router.patch("/:id", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (req.user.role === "representative" && resource.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { title, description, category, tags, fileUrl, externalUrl } = req.body;
    await resource.update({
      title: title ?? resource.title,
      description: description ?? resource.description,
      category: category ?? resource.category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : resource.tags,
      fileUrl: fileUrl ?? resource.fileUrl,
      externalUrl: externalUrl ?? resource.externalUrl,
    });
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete resource
router.delete("/:id", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (req.user.role === "representative" && resource.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await ResourceBookmark.destroy({ where: { resourceId: resource.id } });
    await ResourceAccessLog.destroy({ where: { resourceId: resource.id } });
    await resource.destroy();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle bookmark
router.post("/:id/bookmark", authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ResourceBookmark.findOne({ where: { resourceId: id, userId: req.user.id } });
    if (existing) {
      await existing.destroy();
      return res.json({ bookmarked: false });
    }
    await ResourceBookmark.create({ resourceId: id, userId: req.user.id });
    res.json({ bookmarked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List bookmarks
router.get("/bookmarks", authenticate(), async (req, res) => {
  try {
    const bms = await ResourceBookmark.findAll({ where: { userId: req.user.id } });
    const ids = bms.map((b) => b.resourceId);
    const resources = await Resource.findAll({ where: { id: ids } });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 