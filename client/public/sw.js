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
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((resp) => {
        if (request.method === "GET" && resp.status === 200 && request.url.startsWith(self.location.origin)) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        }
        return resp;
      })
    )
  );
});

self.addEventListener('sync', (event)=>{
  if(event.tag==='cbp-sync'){
    event.waitUntil(handleSync());
  }
});

async function handleSync(){
  const { listQueued, removeQueued } = await import('/src/utils/db.js');
  const actions = await listQueued();
  for(const action of actions){
    try{
      if(action.type==='issue'){
        await fetch('/api/issues', {method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${action.token}`}, body:JSON.stringify(action.payload)});
      } else if(action.type==='message'){
        await fetch('/api/messages/send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${action.token}`},body:JSON.stringify(action.payload)});
      } else if(action.type==='event'){
        await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json', Authorization:`Bearer ${action.token}`},body:JSON.stringify(action.payload)});
      }
      await removeQueued(action.id);
    }catch(err){console.error('sync error',err);}
  }
} 