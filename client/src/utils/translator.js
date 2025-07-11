
import axios from 'axios';
import { API_BASE } from './network.js';

/**
 * Translate text via backend proxy (server handles Azure credentials).
 * @param {string|string[]} text - The text to translate.
 * @param {string} to - Target language code (default 'sw').
 * @param {string} [from] - Source language code (optional).
 * @returns {Promise<string|string[]>} Translated text in same structure.
 */
export async function translate(text, to = 'sw', from) {
  const { data } = await axios.post(`${API_BASE}/api/translate`, { text, to, from });
  return data;
} 