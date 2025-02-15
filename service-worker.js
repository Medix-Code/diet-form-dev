// Definim el nom del caché i els fitxers a "cachejar"
const CACHE_NAME = "dieta-cache-v20250215143058";

// NOTA: NO incloem index.html ni 404.html en el pre-cache
// per evitar que es quedin 'encallats' en cache-first.
const urlsToCache = [
  "./css/main.css",
  "./manifest.json",
  "./service-worker.js",

  // ► Fitxers
  "./src/app.js",
  "./src/init.js",
  "./src/models/diet.js",
  "./src/db/indexedDbDietRepository.js",
  "./src/services/dietService.js",
  "./src/services/formService.js",
  "./src/services/signatureService.js",
  "./src/services/pdfService.js",
  "./src/services/pwaService.js",
  "./src/services/servicesPanelManager.js",
  "./src/ui/clearService.js",
  "./src/ui/mainButtons.js",
  "./src/ui/modals.js",
  "./src/ui/pickers.js",
  "./src/ui/tabs.js",
  "./src/ui/toast.js",
  "./src/ui/theme.js",
  "./src/utils/restrictions.js",
  "./src/utils/validation.js",
  "./src/utils/utils.js",

  // ► Arxius estàtics
  "./assets/images/icons-192.png",
  "./assets/images/icons-512.png",
  "./assets/images/icons-192-maskable.png",
  "./assets/images/icons-512-maskable.png",
  "./template.pdf",

  // ► Dependència externa (CDN)
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
];

// --- INSTALL ---
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instal·lant...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[ServiceWorker] Guardar fitxers al caché (precache)");
        for (const url of urlsToCache) {
          try {
            // 'no-cache' per assegurar-nos que realment agafa la versió més recent del servidor
            const response = await fetch(url, { cache: "no-cache" });
            if (!response.ok) {
              throw new Error(
                `Error en la sol·licitud per ${url}: ${response.statusText}`
              );
            }
            await cache.put(url, response);
            console.log(`[ServiceWorker] Fitxer en caché: ${url}`);
          } catch (error) {
            console.error(`[ServiceWorker] Error cachejant ${url}:`, error);
          }
        }
      })
      .catch((error) => {
        console.error("[ServiceWorker] Error durant la instal·lació:", error);
      })
  );

  // skipWaiting() fa que, tan bon punt acabi la instal·lació,
  // el SW nou passi de 'waiting' a 'activate' sense esperar pestanyes antigues
  self.skipWaiting();
});

// --- FETCH ---
self.addEventListener("fetch", (event) => {
  // Si és una petició HTML (navegació), fem network-first:
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Un cop rebuda la resposta, l'emmagatzemem a la caché
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si no hi ha xarxa, tornem el que hi hagi en la caché (si hi és)
          return caches.match(event.request);
        })
    );
  }
  // Si és un fitxer CSS (o altres fitxers que vulguis actualitzar sempre)
  else if (event.request.destination === "style") {
    event.respondWith(
      fetch(event.request, { cache: "reload" })
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
  // Per la resta de fitxers (JS, imatges, etc.), fem cache-first
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log(
            "[ServiceWorker] Servint des de caché:",
            event.request.url
          );
          return cachedResponse;
        }
        // Si no el trobem en caché, el descarreguem de la xarxa
        return fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch((error) => {
            console.error("[ServiceWorker] Error durant el fetch:", error);
            throw error;
          });
      })
    );
  }
});

// --- ACTIVATE ---
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activant...");
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("[ServiceWorker] Eliminant caché antic:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // clients.claim() fa que el nou SW "reclami" pestanyes immediatament
  self.clients.claim();
});

// Captura i registra errors globals al Service Worker
self.addEventListener("error", (event) => {
  console.error("[ServiceWorker] Error capturat:", event.message);
});
