// Punt d'entrada principal de l'aplicació.
// Des d'aquí només cridem la inicialització.

import {
  setupInstallPrompt,
  monitorDisplayMode,
} from "./services/pwaService.js";
import { initializeApp } from "./init.js";

// Configuració del PWA (instal·lació, display mode, etc.)
setupInstallPrompt();
monitorDisplayMode();

// Quan el DOM estigui carregat, inicialitzem l'app
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});
