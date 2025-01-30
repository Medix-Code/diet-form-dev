// js/init.js

import { initServices } from "./services.js";
import { initSignature } from "./signature.js";
import { openDatabase } from "./db.js";
import { setupTabs } from "./tabs.js";
import { setupMainButtons } from "./mainButtons.js";
import { setupClearSelectedService } from "./clearService.js";
import { setupModalGenerics } from "./modals.js";
import { setupDatePickers, setupTimePickers } from "./pickers.js";
import { setupServiceNumberRestrictions } from "./restrictions.js";
import {
  addInputListeners,
  addDoneBehavior,
  getAllFormDataAsString,
} from "./formHandlers.js";
import {
  setupInstallPrompt,
  monitorDisplayMode,
  isAppInstalled,
} from "./pwa.js";

import { setTodayDate } from "./utils.js";

let initialFormDataStr = "";

/**
 * Funció principal d'inicialització de l'aplicació
 */
export async function initializeApp() {
  await openDatabase();
  setTodayDate();
  initServices();
  initSignature();

  initAjustesPanel();
  setupTabs();
  setupMainButtons();
  setupClearSelectedService();
  setupModalGenerics();
  setupDatePickers();
  setupTimePickers();
  setupServiceNumberRestrictions();

  addInputListeners();
  addDoneBehavior();

  // Quan iniciem sense cap dieta carregada, definim "estat inicial"
  // que serà l'actual (buit), així si l'usuari no toca res, "no hi ha canvis".
  initialFormDataStr = getAllFormDataAsString();

  // Si no hem carregat cap dieta, teòricament no hi ha canvis, i el botó "Guardar" es podria desactivar.
  // Però l'has demanat "activat en un primer moment". Així que no toquem res: es queda "activat".

  // PWA
  if (isAppInstalled()) {
    localStorage.setItem("isAppInstalled", "true");
  } else {
    localStorage.removeItem("isAppInstalled");
  }
  setupInstallPrompt();
  monitorDisplayMode();
}

/**
 * Funció d'inicialització del panell d'ajustes
 */
function initAjustesPanel() {
  const ajustesBtn = document.getElementById("ajustes");
  const ajustesPanel = document.getElementById("ajustes-panel");
  if (!ajustesBtn || !ajustesPanel) return;

  function togglePanel() {
    ajustesPanel.classList.toggle("hidden");
    ajustesBtn.classList.toggle("open");
  }
  function closePanelOutside(evt) {
    if (!ajustesPanel.contains(evt.target) && evt.target !== ajustesBtn) {
      ajustesPanel.classList.add("hidden");
      ajustesBtn.classList.remove("open");
    }
  }
  function closePanelOnClickInside() {
    ajustesPanel.classList.add("hidden");
    ajustesBtn.classList.remove("open");
  }

  ajustesBtn.addEventListener("click", togglePanel);
  document.addEventListener("click", closePanelOutside);
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") {
      ajustesPanel.classList.add("hidden");
      ajustesBtn.classList.remove("open");
    }
  });
  ajustesPanel.addEventListener("click", (evt) => evt.stopPropagation());
  ajustesPanel.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", closePanelOnClickInside);
  });
}
