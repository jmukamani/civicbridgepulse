// Utility for testing offline functionality
export const testOfflineFeatures = async () => {
  const results = {
    serviceWorkerRegistered: false,
    cacheApiAvailable: false,
    cachedPolicies: 0,
    cachedFiles: 0,
    localStorageData: false
  };

  try {
    // Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      results.serviceWorkerRegistered = !!registration;
    }

    // Check cache API
    if ('caches' in window) {
      results.cacheApiAvailable = true;
      
      // Check policy files cache
      const fileCache = await caches.open('policy-files');
      const fileKeys = await fileCache.keys();
      results.cachedFiles = fileKeys.length;
      
      // Check API cache
      const apiCache = await caches.open('external-api-cache');
      const apiKeys = await apiCache.keys();
      results.cachedPolicies = apiKeys.filter(req => 
        req.url.includes('/api/policies/') && !req.url.includes('/comments')
      ).length;
    }

    // Check localStorage
    const policies = localStorage.getItem('policies_cache');
    results.localStorageData = !!(policies && JSON.parse(policies).length > 0);

    console.log('Offline Features Status:', results);
    return results;
  } catch (error) {
    console.error('Error checking offline features:', error);
    return results;
  }
};

// Clear all caches (useful for testing)
export const clearAllCaches = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Clear localStorage caches
    Object.keys(localStorage).forEach(key => {
      if (key.includes('cache') || key.startsWith('resp-') || key.startsWith('issue_hist_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('All caches cleared');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

// Test function to run in browser console
window.testOffline = testOfflineFeatures;
window.clearCaches = clearAllCaches; 