import { useEffect } from "react";
import { listQueued } from "../utils/db.js";

const useQueueSync = () => {
  useEffect(() => {
    const register = async () => {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const items = await listQueued();
        if (items.length) {
          await reg.sync.register('cbp-sync');
        }
      }
    };
    register();
  }, []);
};
export default useQueueSync; 