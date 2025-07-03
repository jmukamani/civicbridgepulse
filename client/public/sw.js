// Load idb-keyval in this classic worker context so we can manipulate IndexedDB without disallowed dynamic import()
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/idb-keyval-iife.min.js');

const CACHE_NAME = "cbp-cache-v1";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = ["/", "/index.html", OFFLINE_URL, "/manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (request.url.includes('/socket.io/')) {
    return; 
  }

  // API requests: network first, fallback to cache
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return resp;
        })
        .catch(async () => {
          // Avoid Cache API for non-GET requests (e.g. POST) – it would throw and break the response chain
          if (request.method === 'GET') {
            const cached = await caches.match(request);
            if (cached) return cached;
          }
          // graceful fallback empty response so callers still receive a valid Response object
          return new Response(JSON.stringify({ message: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        })
    );
    return;
  }

  // Other GET requests: cache-first
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((resp) => {
        if (resp && resp.status === 200 && request.method === "GET" && request.url.startsWith(self.location.origin)) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        }
        return resp;
      }).catch(()=> cached || new Response('offline',{status:503}))
    )
  );
});

self.addEventListener('sync', (event)=>{
  if(event.tag==='cbp-sync'){
    event.waitUntil(handleSync());
  }
});

async function handleSync(){
  // Use idb-keyval via the global idbKeyval object provided by the importScripts call above
  const keys = await idbKeyval.keys();
  for (const key of keys) {
    if (typeof key !== 'string' || !key.startsWith('q-')) continue;

    const action = await idbKeyval.get(key);
    if (!action) continue;

    try {
      if (action.type === 'issue') {
        await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify(action.payload),
        });
      } else if (action.type === 'message') {
        await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify(action.payload),
        });
      } else if (action.type === 'event') {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify(action.payload),
        });
      } else if (action.type === 'pollVote') {
        await fetch(`/api/polls/${action.payload.pollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify({ selected: action.payload.selected }),
        });
      } else if (action.type === 'thread') {
        await fetch('/api/forums/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify(action.payload),
        });
      } else if (action.type === 'forumPost') {
        await fetch(`/api/forums/threads/${action.payload.threadId}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${action.token}` },
          body: JSON.stringify({ content: action.payload.content }),
        });
      }

      // If we got here without throwing, the request completed – remove from the queue
      await idbKeyval.del(key);
    } catch (err) {
      console.error('sync error', err);
    }
  }
}

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body,
    data: data.data,
    icon: '/favicon-96x96.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = '/' ;
  event.waitUntil(clients.openWindow(url));
}); 