// js/app.js
import { setupInstallPrompt, monitorDisplayMode } from "./pwa.js";
import { initializeApp } from "./init.js";

setupInstallPrompt();
monitorDisplayMode();

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});
