// js/app.js
import { initializeApp } from "./init.js";
import { showInstallPrompt } from "./pwa.js";

/* --------------------------------------------------
   DOMContentLoaded
-----------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  showInstallPrompt();
  initializeApp();
});
