// Service worker do Gira: guarda os arquivos do app para abrir mais rápido.
// As APIs (IA e fotos) NUNCA passam pelo cache.
// Oficial e teste ficam no mesmo endereço: cada um usa o próprio cache.
const ENV = self.registration.scope.includes("/teste/") ? "gira-teste" : "gira";
const CACHE = ENV + "-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];
const NEVER_CACHE = [
  "api.pexels.com",
  "images.pexels.com",
  "generativelanguage.googleapis.com",
  "api.anthropic.com"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(APP_FILES.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(ENV + "-v") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Chamadas de IA e de fotos: direto para a rede, sem cache.
  if (NEVER_CACHE.some(host => url.hostname === host || url.hostname.endsWith("." + host))) return;
  if (!/^https?:$/.test(url.protocol)) return;
  // A versão oficial não mexe nos arquivos da versão de teste.
  if (ENV === "gira" && url.origin === self.location.origin && url.pathname.includes("/teste/")) return;

  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const isLib = url.hostname === "cdnjs.cloudflare.com";
  if (!sameOrigin && !isFont && !isLib) return;

  // Página principal: rede primeiro (para pegar atualizações), cache se estiver offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Demais arquivos do app, fontes e bibliotecas: cache primeiro, atualizando em segundo plano.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
