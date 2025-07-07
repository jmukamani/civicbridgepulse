import axios from "axios";

// Determine API base URL: env var or same origin
export const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

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