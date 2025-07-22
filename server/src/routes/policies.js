import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import PolicyDocument from "../models/PolicyDocument.js";
import { Op } from "sequelize";
import { extractText, generateSummary, translateToSwahili } from "../utils/policyProcessing.js";
import { logInteraction } from "../utils/logInteraction.js";
import { BlobServiceClient } from "@azure/storage-blob";

// Azure Blob Storage config from environment variables
const AZURE_BLOB_CONNECTION_STRING = process.env.AZURE_BLOB_CONNECTION_STRING;
const AZURE_BLOB_CONTAINER = process.env.AZURE_BLOB_CONTAINER || "policies";

// Create the BlobServiceClient using the connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_BLOB_CONNECTION_STRING);
// Get a reference to the container client
const containerClient = blobServiceClient.getContainerClient(AZURE_BLOB_CONTAINER);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Policies
 *   description: Policy document management
 */

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

// Use Multer memory storage for Azure upload
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/policies/upload:
 *   post:
 *     summary: Upload a new policy document
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *                 default: other
 *               summary_en:
 *                 type: string
 *               summary_sw:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: published
 *               budget:
 *                 type: string
 *     responses:
 *       201:
 *         description: Policy document uploaded successfully
 *       400:
 *         description: Validation error or file processing error
 *       403:
 *         description: Access denied - representative or admin required
 *       500:
 *         description: Server error
 */

// Upload policy document (representatives only)
router.post("/upload", authenticate(["representative", "admin"]), upload.single("file"), async (req, res) => {
  try {
    let { title, category = "other", summary_en = "", summary_sw = "", status = "published", budget } = req.body;
    if (!req.file) return res.status(400).json({ message: "file required" });
    // Upload to Azure Blob Storage
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(req.file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);
    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });
    const azureUrl = blockBlobClient.url;
    // Extract text for summary
    if (!summary_en) {
      // Save file temporarily for text extraction
      const tmpDir = path.join("C:", "tmp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = path.join(tmpDir, uniqueName);
      fs.writeFileSync(tmpPath, req.file.buffer);
      const text = await extractText(tmpPath, req.file.mimetype);
      fs.unlinkSync(tmpPath);
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
      filePath: azureUrl, // Store Azure URL
      uploadedBy: req.user.id,
      county: req.user.county || null,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/policies:
 *   get:
 *     summary: List and search policy documents
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Array of policy documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */

// List/Search documents
router.get("/", authenticate(), async (req, res) => {
  try {
    const { q, category } = req.query;
    const where = {};

    // 1) Status filter – only citizens are limited to published docs
    if (req.user.role === "citizen") {
      where.status = "published";
    }

    // 2) County / ownership scoping - include policies with matching county OR no county set
    const userCounty = req.user.county;
    if (req.user.role === "citizen") {
      if (userCounty) {
        where[Op.or] = [
          { county: userCounty },
          { county: null }
        ];
      }
    } else if (req.user.role === "representative") {
      if (userCounty) {
        where[Op.or] = [
          { county: userCounty },
          { county: null }
        ];
      }
    }

    // 3) Optional query filters
    if (category) where.category = category;
    if (q) where.title = { [Op.iLike]: `%${q}%` };

    const docs = await PolicyDocument.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/policies/{id}:
 *   get:
 *     summary: Get policy document metadata
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy document ID
 *     responses:
 *       200:
 *         description: Policy document metadata
 *       403:
 *         description: Access denied - document not published
 *       404:
 *         description: Policy document not found
 *       500:
 *         description: Server error
 */

// Get metadata
router.get("/:id", authenticate(), async (req, res) => {
  const doc = await PolicyDocument.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  if (doc.status !== "published" && req.user.role === "citizen") return res.status(403).json({ message: "Forbidden" });
  await logInteraction(req.user.id, "policy_view", doc.id);
  res.json(doc);
});

/**
 * @swagger
 * /api/policies/{id}/file:
 *   get:
 *     summary: Download policy document file
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy document ID
 *     responses:
 *       200:
 *         description: Policy document file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/msword:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied - document not published
 *       404:
 *         description: Policy document not found
 */

// Serve file
router.get("/:id/file", authenticate(), async (req, res) => {
  const doc = await PolicyDocument.findByPk(req.params.id);
  if (!doc) return res.sendStatus(404);
  if (doc.status !== "published" && req.user.role === "citizen") return res.sendStatus(403);
  // If filePath is an Azure URL, redirect
  if (doc.filePath.startsWith("http")) {
    return res.redirect(doc.filePath);
  }
  // Fallback for legacy local files
  res.sendFile(path.resolve(doc.filePath));
});

// Delete policy document (representative/admin)
router.delete("/:id", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await PolicyDocument.findByPk(id);
    if (!doc) return res.status(404).json({ message: "Policy not found" });
    // remove file from Azure or disk if exists
    if (doc.filePath) {
      if (doc.filePath.startsWith("http")) {
        // Azure Blob delete
        try {
          const urlParts = doc.filePath.split("/");
          const blobName = urlParts[urlParts.length - 1];
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.deleteIfExists();
        } catch (e) {
          console.error("Azure file delete error", e);
        }
      } else if (fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
        } catch (e) {
          console.error("File delete error", e);
        }
      }
    }
    await doc.destroy();
    res.json({ message: "Policy deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update policy document metadata (representative/admin)
router.patch("/:id", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const fields = (({ title, category, summary_en, summary_sw, status, budget }) => ({
      title,
      category,
      summary_en,
      summary_sw,
      status,
      budget,
    }))(req.body);

    // Remove undefined so we only update specified keys
    Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

    const doc = await PolicyDocument.findByPk(id);
    if (!doc) return res.status(404).json({ message: "Policy not found" });

    // Representatives can only update docs from their county (simple scope check)
    if (req.user.role === "representative" && req.user.county && doc.county !== req.user.county) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Parse budget JSON string if provided as string
    if (fields.budget && typeof fields.budget === "string") {
      try {
        fields.budget = JSON.parse(fields.budget);
      } catch {
        return res.status(400).json({ message: "Invalid budget JSON" });
      }
    }

    await doc.update(fields);
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Bulk delete policy documents
 * Body: { ids: ["uuid", ...] }
 */
router.post("/bulk-delete", authenticate(["representative", "admin"]), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "ids array required" });

    const docs = await PolicyDocument.findAll({ where: { id: ids } });
    const unauthorized = docs.some((d) => req.user.role === "representative" && req.user.county && d.county !== req.user.county);
    if (unauthorized) return res.status(403).json({ message: "Some documents cannot be deleted" });

    // Delete files and db rows
    for (const d of docs) {
      if (d.filePath) {
        if (d.filePath.startsWith("http")) {
          // Azure Blob delete
          try {
            const urlParts = d.filePath.split("/");
            const blobName = urlParts[urlParts.length - 1];
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.deleteIfExists();
          } catch (e) {
            console.error("Azure file delete error", e);
          }
        } else if (fs.existsSync(d.filePath)) {
          try {
            fs.unlinkSync(d.filePath);
          } catch (e) {
            console.error("File delete error", e);
          }
        }
      }
      await d.destroy();
    }

    res.json({ message: "Documents deleted", count: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 