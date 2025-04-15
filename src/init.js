// init.js (dins src/init.js)
import { openDatabase } from "./db/indexedDbDietRepository.js";
import {
  setTodayDate,
  easterEgg,
  setDefaultDietSelect,
} from "./utils/utils.js"; // Agrupat setDefaultDietSelect
import { initServices } from "./services/servicesPanelManager.js";
import { initSignature } from "./services/signatureService.js";
import { setupTabs } from "./ui/tabs.js";
import { setupMainButtons } from "./ui/mainButtons.js";
import { setupClearSelectedService } from "./ui/clearService.js";
import { setupModalGenerics } from "./ui/modals.js";
import { setupDatePickers, setupTimePickers } from "./ui/pickers.js";
import { setupServiceNumberRestrictions } from "./utils/restrictions.js";
import { initSettingsPanel } from "./ui/settingsPanel.js";
import * as formService from "./services/formService.js";
import { initPwaInstall } from "./services/pwaService.js"; // Importa la funció d'inicialització correcta
import { initCameraOcr } from "./services/cameraOcr.js";
import { initDotacion } from "./services/dotacion.js";
// No cal importar isAppInstalled ni requestInstallPromptAfterAction aquí si no s'usen directament a init.js

/**
 * Funció principal que orquestra la inicialització de tota l'aplicació.
 * S'executa quan el DOM està llest.
 */
export async function initializeApp() {
  console.log("initializeApp() iniciant...");

  // --- Inicialitzacions bàsiques i dades ---
  setTodayDate();
  setDefaultDietSelect();
  await openDatabase(); // Espera que la BD estigui llesta si altres mòduls la necessiten immediatament

  // --- Inicialització de Serveis de Fons ---
  initServices();
  initSignature();
  initDotacion();
  initCameraOcr(); // Pot inicialitzar la lògica, encara que el botó estigui amagat

  // --- Configuració de la Interfície d'Usuari (UI) ---
  setupTabs();
  setupMainButtons();
  setupClearSelectedService();
  setupModalGenerics();
  setupDatePickers();
  setupTimePickers();
  initSettingsPanel();

  // --- Configuració de Lògica de Formulari i Validacions ---
  setupServiceNumberRestrictions();
  formService.addInputListeners();
  formService.addDoneBehavior();
  // Considera si realment necessites desar l'estat inicial aquí o si es pot gestionar d'una altra manera
  try {
    formService.setInitialFormDataStr(formService.getAllFormDataAsString());
  } catch (e) {
    console.warn("No s'ha pogut desar l'estat inicial del formulari:", e);
  }

  // --- Inicialització del Servei PWA ---
  // Aquesta única crida s'encarrega de tot: listeners, comprovacions d'estat, etc.
  initPwaInstall();

  // --- Altres ---
  easterEgg();

  console.log("initializeApp() completada.");
}
