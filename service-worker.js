// Nom del caché principal
const CACHE_NAME = "dieta-cache-v2";

// Fitxers essencials per tenir la PWA funcional en mode offline:
const PRECACHE_FILES = [
  "./", // la pàgina principal (opcional, depèn si vols cachejar-la directament)
  "./index.html",
  "./css/main.css",
  "./manifest.json",
  "./src/app.js",
  "./src/init.js",
  // Altres JS bàsics que realment necessites sí o sí
  "./assets/images/icons-192.png",
  "./assets/images/icons-512.png",
];

// Fitxers no essencials o grans que només cachejarem sota demanda:
const RUNTIME_FILES = [
  // PDFs grans
  "./dieta_tsc.pdf",
  // Llibreries grans o externes
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
  // JS complementari (services, utils, etc.) que no cal tenir d'entrada
  "./src/models/diet.js",
  "./src/db/indexedDbDietRepository.js",
  "./src/services/dietService.js",
  "./src/services/formService.js",
  "./src/services/dotacion.js",
  "./src/services/signatureService.js",
  "./src/services/pdfService.js",
  "./src/services/cameraOcr.js",
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
  // I qualsevol altre fitxer que no cal descarregar immediatament
];

// --- INSTALL ---
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instal·lant...");

  // En la instal·lació, només pre-cachejem els fitxers essencials
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Guardant fitxers essencials al caché...");
      return cache.addAll(PRECACHE_FILES);
    })
  );

  // skipWaiting() fa que, tan bon punt acabi la instal·lació,
  // el SW nou passi de 'waiting' a 'activate' sense esperar pestanyes antigues
  self.skipWaiting();
});

// --- FETCH ---
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // Cas 1: Si la URL és a la llista de fitxers "RUNTIME_FILES",
  // fem una estratègia "Network First" amb guardat al cache:
  if (RUNTIME_FILES.some((runtimeUrl) => requestUrl.includes(runtimeUrl))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Desem al cache per a usos futurs
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si falla la xarxa, recuperem del cache (si hi és)
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cas 2: Per a la resta de peticions (inclosos els PRECACHE_FILES),
  // fem un "cache first" simple:
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el tenim en caché, l'usem
      if (cachedResponse) {
        return cachedResponse;
      }
      // Altrament, anem a la xarxa
      return fetch(event.request).catch((error) => {
        console.error("[ServiceWorker] Error durant el fetch:", error);
        return new Response("", {
          status: 404,
          statusText: "Not Found",
        });
      });
    })
  );
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
