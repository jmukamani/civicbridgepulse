import { set, get, del, update, keys } from "idb-keyval";

const DEFAULT_PRIORITY = 5; // lower = higher priority
const MAX_RETRIES = 5;


export const queueAction = async (action) => {
  const queued = {
    priority: DEFAULT_PRIORITY,
    retries: 0,
    timestamp: Date.now(),
    ...action,
  };
  await set(`q-${action.id}`, queued);


  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('cbp-sync');
    } catch {}
  }
};

export const listQueued = async () => {
  const k = await keys();
  const actions = [];
  for (const key of k) {
    if (typeof key === "string" && key.startsWith("q-")) {
      actions.push(await get(key));
    }
  }
  // Sort: priority asc, timestamp asc
  actions.sort((a,b)=>{
    if(a.priority!==b.priority) return a.priority - b.priority;
    return a.timestamp - b.timestamp;
  });
  return actions;
};

export const removeQueued = async (id) => del(`q-${id}`);

export const incrementRetry = async (id) => {
  await update(`q-${id}`, value => {
    if(!value) return;
    value.retries = (value.retries || 0) + 1;
    if(value.retries >= MAX_RETRIES){
      // exceeding max retries, delete instead
      return undefined;
    }
    return value;
  });
};

export const generateId = () => crypto.randomUUID(); 