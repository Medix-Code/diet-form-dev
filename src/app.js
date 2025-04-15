// app.js
// Punt d'entrada principal de l'aplicació.
// Només s'encarrega d'importar i executar la inicialització principal
// quan el DOM estigui llest.

import { initializeApp } from "./init.js";

// Quan el DOM estigui completament carregat, inicialitzem l'aplicació.
// Tota la lògica d'inicialització, inclosa la del PWA,
// resideix dins de initializeApp().
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp(); // Si el DOM ja està carregat
}

console.log("App.js carregat, esperant DOMContentLoaded per inicialitzar...");
