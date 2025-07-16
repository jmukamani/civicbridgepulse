import axios from "axios";

function getApiBase() {
  let base = "http://localhost:3000";

  if (typeof window !== "undefined" && window.location && window.location.origin) {
    base = window.location.origin;
  }

  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) {
      base = import.meta.env.VITE_API_BASE;
    }
  } catch (e) {
  }

  if (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE) {
    base = process.env.VITE_API_BASE;
  }

  return base;
}

export const API_BASE = getApiBase();

if (typeof axios !== "undefined") {
  axios.defaults.baseURL = API_BASE;
}

const LOCAL_PATTERN = /^https?:\/\/localhost:5000/i;
if (typeof window !== "undefined") {
  axios.interceptors.request.use((config) => {
    if (typeof config.url === "string" && LOCAL_PATTERN.test(config.url)) {
      config.url = config.url.replace(LOCAL_PATTERN, "");
    }
    return config;
  });

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    if (args.length > 0 && typeof args[0] === "string" && LOCAL_PATTERN.test(args[0])) {
      args[0] = args[0].replace(LOCAL_PATTERN, API_BASE);
    } else if (args[0] && typeof args[0].url === "string" && LOCAL_PATTERN.test(args[0].url)) {
      args[0].url = args[0].url.replace(LOCAL_PATTERN, API_BASE);
    }
    return nativeFetch(...args);
  };
} 