import fs from "fs";
import mammoth from "mammoth";
import { translateCached } from "./translationCache.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractText = async (filePath, mimeType) => {
  const buffer = fs.readFileSync(filePath);
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (mimeType === "application/pdf") {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const txt = await page.getTextContent();
        fullText += txt.items.map((t) => t.str).join(" ") + " \n";
      }
      return fullText.trim();
    } catch (err) {
      console.error("PDF extract error", err);
    }
  }
  // fallback plain text
  return "";
};

export const generateSummary = (text, maxSentences = 5) => {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 20);
  return sentences.slice(0, maxSentences).join(" ");
};

export const translateToSwahili = async (text) => {
  try {
    return await translateCached(text, "sw");
  } catch (err) {
    console.error("Translation error", err);
    return "";
  }
}; 