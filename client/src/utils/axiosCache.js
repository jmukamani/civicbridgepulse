import axios from "axios";
import { get, set } from "idb-keyval";
import { toast } from "react-toastify";

// Cache expiration (ms)
const MAX_AGE = 1000 * 60 * 60; // 1 hour

axios.interceptors.response.use(
  async (response) => {
    if (response.config.method === "get" && response.status === 200) {
      const key = `resp-${response.config.url}`;
      const payload = {
        ts: Date.now(),
        data: response.data,
      };
      await set(key, payload);
    }
    return response;
  },
  async (error) => {
    const { config } = error;
    if (config && config.method === "get" && !navigator.onLine) {
      const cached = await get(`resp-${config.url}`);
      if (cached && Date.now() - cached.ts < MAX_AGE) {
        toast.info("Offline: showing cached data", { toastId: 'cached-data', autoClose: 3000 });
        return {
          ...error.response,
          config,
          status: 200,
          data: cached.data,
          fromCache: true,
        };
      }
      // No cached copy – gracefully return empty placeholder to avoid runtime crashes
      return {
        ...error.response,
        config,
        status: 200,
        data: [],
        offlinePlaceholder: true,
      };
    }
    return Promise.reject(error);
  }
);

// Utility function to manually cache important data
export const warmCache = async (url, data) => {
  try {
    const key = `resp-${url}`;
    const payload = {
      ts: Date.now(),
      data: data,
    };
    await set(key, payload);
  } catch (error) {
    console.warn('Failed to warm cache for:', url, error);
  }
};

// Check if data is available in cache
export const getCachedData = async (url) => {
  try {
    const cached = await get(`resp-${url}`);
    if (cached && Date.now() - cached.ts < MAX_AGE) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get cached data for:', url, error);
    return null;
  }
}; 