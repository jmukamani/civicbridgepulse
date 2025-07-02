import fs from "fs";
import path from "path";
import crypto from "crypto";
import gTranslate from "@vitalets/google-translate-api";

let translateAny = gTranslate;
while (translateAny && typeof translateAny !== "function" && translateAny.default) {
  translateAny = translateAny.default;
}
const translate = translateAny;

const CACHE_FILE = path.join("cache", "translations.json");
fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {}
}

const saveCache = () => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
};

export const translateCached = async (text, targetLang) => {
  const hash = crypto.createHash("sha256").update(text + targetLang).digest("hex");
  if (cache[hash]) return cache[hash];
  const res = await translate(text, { to: targetLang });
  cache[hash] = res.text;
  saveCache();
  return res.text;
}; 