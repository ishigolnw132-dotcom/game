const CACHE='code-quest-3d-v7';
const BASE=new URL('./',self.location.href);
const asset=(p)=>new URL(p,BASE).toString();
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['manifest.json','favicon.svg','icon-192.png','icon-512.png'].map(asset))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url),basePath=BASE.pathname;if(request.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(basePath)||url.pathname.includes('auth')||url.pathname.endsWith('/school-config.json')||url.pathname.includes('/school/'))return;event.respondWith(fetch(request).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(x=>x||caches.match(asset('index.html')))))})
