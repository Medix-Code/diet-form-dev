// Definim el nom del caché i els fitxers a "cachejar"
const CACHE_NAME = "dieta-cache-v20250209221404"";
const urlsToCache = [
  "./",
  "./index.html",
  "./404.html",
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

// Event 'install': fem "pre-cache" dels fitxers
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instal·lant...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[ServiceWorker] Guardar fitxers al caché");
        for (const url of urlsToCache) {
          try {
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
});

// Event 'fetch': interceptem peticions de xarxa i mirem si estan en caché
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[ServiceWorker] Servint des de caché:", event.request.url);
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => networkResponse)
        .catch((error) => {
          console.error("[ServiceWorker] Error durant el fetch:", error);
          throw error;
        });
    })
  );
});

// Event 'activate': esborrem les caches antics que no concordin amb la versió actual
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activant...");
  const cacheWhitelist = [CACHE_NAME]; // Només volem conservar aquesta versió
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
});

// Captura i registra errors globals al Service Worker
self.addEventListener("error", (event) => {
  console.error("[ServiceWorker] Error capturat:", event.message);
});
