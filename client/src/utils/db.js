import { set, get, del, update, keys } from "idb-keyval";

export const queueAction = async (action) => {
  await set(`q-${action.id}`, action);
};

export const listQueued = async () => {
  const k = await keys();
  const actions = [];
  for (const key of k) {
    if (typeof key === "string" && key.startsWith("q-")) {
      actions.push(await get(key));
    }
  }
  return actions;
};

export const removeQueued = async (id) => del(`q-${id}`);

export const generateId = () => crypto.randomUUID(); 