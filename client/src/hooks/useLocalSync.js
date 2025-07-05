import { useEffect } from 'react';
import useOnlineStatus from './useOnlineStatus.js';
import { syncLocalChanges } from '../utils/localDB.js';
import { getToken } from '../utils/auth.js';
import { cleanupOldData } from '../utils/localDB.js';
import { markMessageSynced, markMessageFailed } from '../utils/localDB.js';

/**
 * Hook that attempts to push local unsynced changes when back online.
 * Falls back to service-worker Background Sync when supported; otherwise
 * runs sync in the foreground every time we regain connectivity.
 */
const useLocalSync = () => {
  const online = useOnlineStatus();

  useEffect(() => {
    // listen for service worker messages
    if('serviceWorker' in navigator){
      const handler = (event)=>{
        const { type, localId, serverId } = event.data || {};
        if(type === 'messageSynced' && localId) {
          markMessageSynced(localId, serverId);
        } else if(type === 'messageFailed'){
          markMessageFailed(localId);
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  useEffect(() => {
    if (!online) return;

    const runSync = async () => {
      const token = getToken();
      if (!token) return;
      // If Background Sync API is available, let the service worker handle it.
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register('cbp-sync');
          return;
        } catch (_) {
          // fallthrough to manual
        }
      }
      // Manual sync fallback
      await syncLocalChanges(token);
      await cleanupOldData();
    };

    runSync();
  }, [online]);
};

export default useLocalSync; 