// Definim el nom del caché i els fitxers a “cachejar”
const CACHE_NAME = "dieta-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
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

// Event 'install': fem "pre-cache" dels fitxers
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instal·lant...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[ServiceWorker] Guardar ficheros al cache");
        for (const url of urlsToCache) {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (!response.ok) {
              throw new Error(
                `Error en la sol·licitud per ${url}: ${response.statusText}`
              );
            }
            await cache.put(url, response);
            console.log(`[ServiceWorker] Ficheros en cache: ${url}`);
          } catch (error) {
            console.error(`[ServiceWorker] Error cachejant ${url}:`, error);
          }
        }
      })
      .catch((error) => {
        console.error("[ServiceWorker] Error durante la instalación:", error);
      })
  );
});

// Event 'fetch': interceptem peticions de xarxa i mirem si està en cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[ServiceWorker] Servint des de cache:", event.request.url);
        return cachedResponse;
      }
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
});

// Event 'activate': esborrem caches antics que no concordin amb la versió actual
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activant...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Eliminant cache antic:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Captura i registra errors globals al Service Worker
self.addEventListener("error", (event) => {
  console.error("[ServiceWorker] Error capturat:", event.message);
});
