import axios from "axios";

// Determine API base URL: prefer Vite env when available, else fallbacks
let base = window.location.origin;

// 1. Try process.env (useful for Jest/node tests)
if (process?.env?.VITE_API_BASE) {
  base = process.env.VITE_API_BASE;
}

// 2. Try Vite import.meta.env – but wrap in eval so CommonJS (Jest) parser doesn’t puke
try {
  // eslint-disable-next-line no-eval
  const viteEnv = eval('typeof import!=="undefined" && import.meta && import.meta.env ? import.meta.env : null');
  if (viteEnv?.VITE_API_BASE) {
    base = viteEnv.VITE_API_BASE;
  }
} catch {
  // ignore – likely running in a non-Vite environment (e.g., Jest)
}

export const API_BASE = base;

// 1. Axios default base URL
axios.defaults.baseURL = API_BASE;

// 2. Replace any hard-coded localhost URLs in existing axios calls
const LOCAL_PATTERN = /^https?:\/\/localhost:5000/i;
axios.interceptors.request.use((config) => {
  if (typeof config.url === "string" && LOCAL_PATTERN.test(config.url)) {
    config.url = config.url.replace(LOCAL_PATTERN, "");
  }
  return config;
});

// 3. Monkey-patch global fetch to rewrite localhost URLs
const nativeFetch = window.fetch.bind(window);
window.fetch = (...args) => {
  if (args.length > 0 && typeof args[0] === "string" && LOCAL_PATTERN.test(args[0])) {
    args[0] = args[0].replace(LOCAL_PATTERN, API_BASE);
  } else if (args[0] && typeof args[0].url === "string" && LOCAL_PATTERN.test(args[0].url)) {
    args[0].url = args[0].url.replace(LOCAL_PATTERN, API_BASE);
  }
  return nativeFetch(...args);
}; 