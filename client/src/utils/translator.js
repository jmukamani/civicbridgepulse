import axios from 'axios';

// Azure Translator configuration is expected to be provided via environment variables.
// For React, variables must start with REACT_APP_. Create a .env file at project root with:
// REACT_APP_AZURE_TRANSLATOR_KEY=your_key_here
// REACT_APP_AZURE_TRANSLATOR_REGION=your_resource_region
// REACT_APP_AZURE_TRANSLATOR_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/

const {
  REACT_APP_AZURE_TRANSLATOR_KEY: AZURE_KEY,
  REACT_APP_AZURE_TRANSLATOR_REGION: AZURE_REGION,
  REACT_APP_AZURE_TRANSLATOR_ENDPOINT: AZURE_ENDPOINT,
} = process.env;

if (!AZURE_KEY || !AZURE_REGION || !AZURE_ENDPOINT) {
  // eslint-disable-next-line no-console
  console.warn('[translator] Azure Translator environment variables are missing. Translation calls will fail.');
}

/**
 * Translate a text string using Azure Translator.
 * @param {string|string[]} text - Single string or array of strings to translate.
 * @param {string} to - Target language code ("sw" for Swahili, "en" for English, etc.)
 * @param {string} from - Source language code (defaults to auto-detect when undefined)
 * @returns {Promise<string|string[]>} Translated text in the same structure (string or array).
 */
export async function translate(text, to = 'sw', from) {
  if (!AZURE_KEY || !AZURE_REGION || !AZURE_ENDPOINT) {
    throw new Error('Azure Translator environment variables are not set');
  }

  const url = `${AZURE_ENDPOINT}/translate?api-version=3.0&to=${to}` + (from ? `&from=${from}` : '');

  // Ensure payload is an array of objects: [{ Text: "..." }]
  const payload = Array.isArray(text) ? text.map((t) => ({ Text: t })) : [{ Text: text }];

  const { data } = await axios.post(url, payload, {
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Ocp-Apim-Subscription-Region': AZURE_REGION,
      'Content-Type': 'application/json',
    },
  });

  const translations = data.map((item) => item?.translations?.[0]?.text ?? '');
  return Array.isArray(text) ? translations : translations[0];
} 