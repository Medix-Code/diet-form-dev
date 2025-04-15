// init.js
import { openDatabase } from "./db/indexedDbDietRepository.js";
import {
  setTodayDate,
  easterEgg,
  setDefaultDietSelect,
} from "./utils/utils.js";
import { initServices } from "./services/servicesPanelManager.js";
import { initSignature } from "./services/signatureService.js";
import { setupTabs } from "./ui/tabs.js";
import { initThemeSwitcher } from "./ui/theme.js";
import { setupMainButtons } from "./ui/mainButtons.js";
import { setupClearSelectedService } from "./ui/clearService.js";
import { setupModalGenerics } from "./ui/modals.js";
import { setupDatePickers, setupTimePickers } from "./ui/pickers.js";
import { setupServiceNumberRestrictions } from "./utils/restrictions.js";
import { initSettingsPanel } from "./ui/settingsPanel.js";
import * as formService from "./services/formService.js";
import { initPwaInstall } from "./services/pwaService.js";
import { initCameraOcr } from "./services/cameraOcr.js";
import { initDotacion } from "./services/dotacion.js";

// SUPOSANT que has copiat funcions toggleAjustesPanel(), openExampleModal(), closeExampleModal()
// en un altre mòdul o aquí mateix.
import {
  toggleAjustesPanel,
  openExampleModal,
  closeExampleModal,
} from "./ui/demoExample.js";

// Exemple: si les constants adjustmentsBtn, modalCloseBtn, etc., no estan definides enlloc, has de fer-ho aquí
// o en un altre mòdul. Aquí ho fem localment per simplicitat:
const ajustesBtn = document.querySelector(".c-ajustes-btn");
const ajustesPanel = document.getElementById("ajustes-panel");
const modalExample = document.getElementById("example-modal");
const modalCloseBtn = modalExample?.querySelector(".c-modal__close-btn");

export async function initializeApp() {
  console.log("initializeApp() iniciant...");

  // 1) Inicialitzacions bàsiques
  setTodayDate();
  setDefaultDietSelect();
  await openDatabase();

  // 2) Serveis de fons
  initServices();
  initSignature();
  initDotacion();
  initCameraOcr();

  // 3) Configuració de la Interfície d'Usuari
  setupTabs();
  setupMainButtons();
  setupClearSelectedService();
  setupModalGenerics();
  setupDatePickers();
  setupTimePickers();
  initSettingsPanel();
  initThemeSwitcher();

  // ***Aquí és on portes el Codi del DOMContentLoaded del snippet***:
  // (aquest codi s'executarà igualment, perquè initializeApp() s'executa un cop el DOM està a punt)
  // ---------------------------------------------------------------------------
  // Panell d'ajustaments
  if (ajustesBtn) {
    ajustesBtn.addEventListener("click", toggleAjustesPanel);
  }

  // Botó de tancar modal d'exemple
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeExampleModal);
  }

  // Si vols obrir el modal de demo en arrencar:
  // openExampleModal();

  // 4) Lògica Formulari
  setupServiceNumberRestrictions();
  formService.addInputListeners();
  formService.addDoneBehavior();
  try {
    formService.setInitialFormDataStr(formService.getAllFormDataAsString());
  } catch (e) {
    console.warn("No s'ha pogut desar l'estat inicial del formulari:", e);
  }

  // 5) Servei PWA
  initPwaInstall();

  // 6) Altres
  easterEgg();

  console.log("initializeApp() completada.");
}
