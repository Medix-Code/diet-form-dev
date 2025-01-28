// Definimos el nombre del cache y los archivos a cachear
const CACHE_NAME = "dieta-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./css/main.css",
  "./manifest.json",
  "./js/app.js",
  "./js/init.js",
  "./js/utils.js",
  "./js/signature.js",
  "./js/services.js",
  "./js/db.js",
  "./js/pdf.js",
  "./js/pdfTemplate.js",
  "./js/formHandlers.js",
  "./js/clearService.js",
  "./js/modals.js",
  "./js/mainButtons.js",
  "./js/pickers.js",
  "./js/restrictions.js",
  "./js/validation.js",
  "./js/pwa.js",
  "./assets/images/icons-192.png",
  "./assets/images/icons-512.png",
  "./assets/images/icons-vector.svg",
  "./template.pdf",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
];

// Evento que se ejecuta al instalar el Service Worker
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME) // Abre el cache definido
      .then((cache) => {
        console.log("[ServiceWorker] Almacenando archivos en cache");
        return cache.addAll(urlsToCache); // Guarda los archivos especificados
      })
      .catch((error) => {
        console.error("[ServiceWorker] Error durante la instalación:", error); // Maneja errores durante la instalación
      })
  );
});

// Evento que intercepta las peticiones de red
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devuelve el archivo desde el cache si existe
        console.log(
          "[ServiceWorker] Sirviendo desde cache:",
          event.request.url
        );
        return cachedResponse;
      }
      // Si no está en cache, lo obtiene de la red
      return fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch((error) => {
          // Manejo de errores durante la solicitud
          console.error("[ServiceWorker] Error durante el fetch:", error);
          throw error;
        });
    })
  );
});

// Evento que se ejecuta al activar el Service Worker
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // Elimina caches antiguos que no coincidan con el nombre actual
            console.log("[ServiceWorker] Eliminando cache antigua:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Captura y registra errores globales en el Service Worker
self.addEventListener("error", (event) => {
  console.error("[ServiceWorker] Error capturado:", event.message);
});
