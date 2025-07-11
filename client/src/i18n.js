import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import sw from "./locales/sw/translation.json";
import { translate } from "./utils/translator.js";

// Helper to lazily translate missing keys using Azure Translator and cache them
async function handleMissingKey(lng, ns, key) {
  if (lng === 'en') return; // no need to translate for English
  try {
    const translated = await translate(key, lng);
    if (translated) {
      i18n.addResource(lng, ns, key, translated);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to translate key', key, err);
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    // When a key is missing in the chosen language, keep the English text & try to fetch translation
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      lngs.forEach((lng) => handleMissingKey(lng, ns, key));
    },
    keySeparator: false, // allow using English sentence as a key
  });

export default i18n; 