import axios from "axios";
import { get, set, del, keys } from "idb-keyval";
import { toast } from "react-toastify";

// Cache expiration (ms)
const MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days for better offline support

// Create a unique cache key for requests
const getCacheKey = (config) => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `resp-${url}-${params}`;
};

axios.interceptors.response.use(
  async (response) => {
    if (response.config.method === "get" && response.status === 200) {
      const key = getCacheKey(response.config);
      const payload = {
        ts: Date.now(),
        data: response.data,
        url: response.config.url,
        status: response.status
      };
      await set(key, payload);
    }
    return response;
  },
  async (error) => {
    const { config } = error;
    if (config && config.method === "get") {
      const key = getCacheKey(config);
      const cached = await get(key);
      
      // Check if we have valid cached data
      if (cached && Date.now() - cached.ts < MAX_AGE) {
        console.info('Using cached data for:', config.url);
        
        // Only show toast if we're actually offline
        if (!navigator.onLine) {
          toast.info("Offline: showing cached data", { 
            toastId: 'cached-data', 
            autoClose: 3000 
          });
        }
        
        return {
          ...error.response,
          config,
          status: 200,
          data: cached.data,
          fromCache: true,
        };
      }
      
      // If no cached data and we're offline, provide appropriate fallback
      if (!navigator.onLine) {
        if (config.url && config.url.includes('/api/policies/')) {
          // For policy endpoints, try to get from localStorage as fallback
          if (config.url.endsWith('/comments')) {
            return {
              ...error.response,
              config,
              status: 200,
              data: [],
              offlinePlaceholder: true,
            };
          } else {
            // Try to get policy from localStorage cache
            const policyId = config.url.split('/').pop();
            const policies = JSON.parse(localStorage.getItem('policies_cache') || '[]');
            const policy = policies.find(p => p.id === policyId);
            
            if (policy) {
              return {
                ...error.response,
                config,
                status: 200,
                data: policy,
                fromCache: true,
              };
            }
          }
        }
        
        // Generic offline fallback
        return {
          ...error.response,
          config,
          status: 200,
          data: [],
          offlinePlaceholder: true,
        };
      }
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
      url: url,
      status: 200
    };
    await set(key, payload);
  } catch (error) {
    console.warn('Failed to warm cache for:', url, error);
  }
};

// Check if data is available in cache
export const getCachedData = async (url) => {
  try {
    const key = `resp-${url}`;
    const cached = await get(key);
    if (cached && Date.now() - cached.ts < MAX_AGE) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get cached data for:', url, error);
    return null;
  }
};

// Clear expired cache entries
export const cleanupCache = async () => {
  try {
    const allKeys = await keys();
    const now = Date.now();
    
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith('resp-')) {
        const cached = await get(key);
        if (cached && now - cached.ts > MAX_AGE) {
          await del(key);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup cache:', error);
  }
}; 