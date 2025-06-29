import fs from "fs";
import path from "path";
import crypto from "crypto";

// @vitalets/google-translate-api provides a default export which is the translate
// function when used in ESM. Import it directly to avoid situations where the
// default gets nested under a `default` property, which led to `translate is
// not a function` runtime errors in certain bundling scenarios.
import translate from "@vitalets/google-translate-api";

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