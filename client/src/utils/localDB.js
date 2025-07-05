import Dexie from 'dexie';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import FlexSearch from 'flexsearch';

/**
 * Centralised IndexedDB wrapper using Dexie.
 * Handles: users, representatives, policies, messages tables.
 * Also tracks syncing + timestamps to support quota cleanup.
 */
const db = new Dexie('CBPDB');

// Initial schema (kept for backward-compatibility)
db.version(1).stores({
  users: 'id, name, email, updatedAt',
  representatives: 'id, userId, name, updatedAt',
  policies: 'id, repId, title, updatedAt',
  messages: '++localId, serverId, repId, userId, createdAt, synced',
});

// v2 – add preferences, polls, resources, versioned policies
db.version(2).stores({
  users: 'id, name, email, updatedAt',
  representatives: 'id, userId, name, updatedAt',
  policies: 'id, repId, title, updatedAt, version',
  messages: '++localId, serverId, repId, userId, createdAt, synced',
  preferences: 'id, userId, updatedAt',
  pollQuestions: 'id, updatedAt',
  pollResponses: 'id, pollId, userId, updatedAt',
  resources: 'id, title, updatedAt',
}).upgrade(tx => {
  // populate version field on existing policies during upgrade
  return tx.table('policies').toCollection().modify(p => { p.version = 1; });
});

// v3 – enhanced messages with status + drafts table
db.version(3).stores({
  users: 'id, name, email, updatedAt',
  representatives: 'id, userId, name, updatedAt',
  policies: 'id, repId, title, updatedAt, version',
  messages: '++localId, serverId, threadId, repId, userId, createdAt, status, synced',
  preferences: 'id, userId, updatedAt',
  pollQuestions: 'id, updatedAt',
  pollResponses: 'id, pollId, userId, updatedAt',
  resources: 'id, title, updatedAt',
  drafts: 'id, threadId, updatedAt',
}).upgrade(async tx => {
  // add default status & threadId fields to existing messages if missing
  await tx.table('messages').toCollection().modify(m => {
    if(!m.status) m.status = m.synced ? 'sent' : 'pending';
    if(!('threadId' in m)) m.threadId = null;
  });
});

// v4 – store extracted text of policies for full-text search
db.version(4).stores({
  users: 'id, name, email, updatedAt',
  representatives: 'id, userId, name, updatedAt',
  policies: 'id, repId, title, updatedAt, version',
  messages: '++localId, serverId, threadId, repId, userId, createdAt, status, synced',
  preferences: 'id, userId, updatedAt',
  pollQuestions: 'id, updatedAt',
  pollResponses: 'id, pollId, userId, updatedAt',
  resources: 'id, title, updatedAt',
  drafts: 'id, threadId, updatedAt',
  policyTexts: 'id, version, updatedAt',
});

/* ============== CRUD helpers ============== */
// Users
export const upsertUser = (user) => db.users.put({ ...user, updatedAt: Date.now() });
export const getUser = (id) => db.users.get(id);

// Representatives
export const upsertRepresentative = (rep) => db.representatives.put({ ...rep, updatedAt: Date.now() });
export const getRepresentativesByUser = (userId) => db.representatives.where('userId').equals(userId).toArray();

// Policies (with compression + versioning)
export const upsertPolicy = async (policy) => {
  const existing = policy.id ? await db.policies.get(policy.id) : null;
  const version = existing ? (existing.version || 1) + 1 : 1;
  const { content, ...rest } = policy;
  const compressedContent = content ? compressToUTF16(content) : existing?.compressedContent;
  return db.policies.put({ ...rest, compressedContent, version, updatedAt: Date.now() });
};

export const getPoliciesByRep = async (repId) => {
  const rows = await db.policies.where('repId').equals(repId).toArray();
  return rows.map(r => ({ ...r, content: r.compressedContent ? decompressFromUTF16(r.compressedContent) : undefined }));
};

export const getPolicy = async (id) => {
  const p = await db.policies.get(id);
  if (!p) return null;
  return { ...p, content: p.compressedContent ? decompressFromUTF16(p.compressedContent) : undefined };
};

// Messages
export const addLocalMessage = (msg) => db.messages.add({ ...msg, synced: false, status: 'pending', createdAt: Date.now() });
export const markMessageSynced = (localId, serverId) => db.messages.update(localId, { synced: true, status: 'sent', serverId });
export const markMessageFailed = (localId) => db.messages.update(localId, { status: 'failed' });
export const getMessagesForRep = (repId) => db.messages.where('repId').equals(repId).sortBy('createdAt');

// Preferences
export const upsertPreference = (pref) => db.preferences.put({ ...pref, updatedAt: Date.now() });
export const getPreferencesByUser = (userId) => db.preferences.where('userId').equals(userId).toArray();

// Polls
export const upsertPollQuestion = (question) => db.pollQuestions.put({ ...question, updatedAt: Date.now() });
export const upsertPollResponse = (response) => db.pollResponses.put({ ...response, updatedAt: Date.now() });
export const getPollResponses = (pollId) => db.pollResponses.where('pollId').equals(pollId).toArray();

// Civic Resources
export const upsertResource = (res) => db.resources.put({ ...res, updatedAt: Date.now() });
export const searchResources = (keyword) => db.resources.filter(r => r.title.toLowerCase().includes(keyword.toLowerCase())).toArray();

/* ============== Search helpers ============== */
export const searchMessages = async (query) => {
  // naive search by content (could integrate full-text libs later)
  const words = query.toLowerCase().split(/\s+/);
  return db.messages.filter((m) => words.every((w) => m.content.toLowerCase().includes(w))).toArray();
};

/* ============== Storage quota & cleanup ============== */
export const cleanupOldData = async ({ maxDays = 90 } = {}) => {
  try {
    const { usage, quota } = await navigator.storage.estimate();
    // If we consume >80% of quota OR called manually, purge old messages/policies
    const limitReached = usage && quota && usage / quota > 0.8;
    if (!limitReached) return;

    const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
    await db.transaction('rw', db.messages, db.policies, db.resources, db.pollResponses, async () => {
      await db.messages.where('createdAt').below(cutoff).delete();
      await db.policies.where('updatedAt').below(cutoff).delete();
      await db.resources.where('updatedAt').below(cutoff).delete();
      await db.pollResponses.where('updatedAt').below(cutoff).delete();
    });
  } catch (err) {
    console.error('cleanup error', err);
  }
};

/* ============== Sync helpers ============== */
export const getUnsyncedMessages = () => db.messages.where({ synced: false }).toArray();

export const syncLocalChanges = async (token) => {
  // Sync only messages for now; extend similarly for other tables
  const unsynced = await getUnsyncedMessages();
  for (const msg of unsynced) {
    try {
      const resp = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repId: msg.repId, content: msg.content }),
      });
      if (resp.ok) {
        const { id: serverId } = await resp.json();
        await markMessageSynced(msg.localId, serverId);
      } else {
        await markMessageFailed(msg.localId);
      }
    } catch (err) {
      console.error('sync message error', err);
      await markMessageFailed(msg.localId);
    }
  }
};

// Drafts
export const saveDraft = (draft) => db.drafts.put({ ...draft, updatedAt: Date.now() });
export const getDraft = (id) => db.drafts.get(id);
export const deleteDraft = (id) => db.drafts.delete(id);

// -------- FULL-TEXT INDEX --------
const policyIndex = new FlexSearch.Index({ tokenize: 'forward', cache: 100, encode: 'icase' });

export const initPolicyIndex = async () => {
  const all = await db.policyTexts.toArray();
  all.forEach(({ id, text }) => policyIndex.add(id, text));
};

export const upsertPolicyText = async ({ id, version, text }) => {
  const compressed = compressToUTF16(text);
  await db.policyTexts.put({ id, version, updatedAt: Date.now(), compressed });
  policyIndex.add(id, text);
};

export const searchPoliciesText = async (query, limit = 10) => {
  const ids = policyIndex.search(query, limit);
  const rows = await db.policies.bulkGet(ids);
  return rows.filter(Boolean);
};

export default db; 