import express from "express";
import axios from "axios";

const router = express.Router();

// POST /api/translate
// Body: { text: string|string[], to: 'sw', from?: 'en' }
router.post("/", async (req, res) => {
  const { text, to = "sw", from } = req.body;

  if (!text || (Array.isArray(text) && text.length === 0)) {
    return res.status(400).json({ error: "text required" });
  }

  try {
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const key = process.env.AZURE_TRANSLATOR_KEY;
    const region = process.env.AZURE_TRANSLATOR_REGION;

    if (!endpoint || !key || !region) {
      return res.status(500).json({ error: "translator not configured" });
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${to}` + (from ? `&from=${from}` : "");
    const payload = Array.isArray(text) ? text.map((t) => ({ Text: t })) : [{ Text: text }];

    const { data } = await axios.post(url, payload, {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
    });

    const out = data.map((item) => item?.translations?.[0]?.text || "");
    return res.json(Array.isArray(text) ? out : out[0]);
  } catch (err) {
    console.error("Azure translate error", err?.response?.data || err.message);
    return res.status(500).json({ error: "translation-failed" });
  }
});

export default router; 