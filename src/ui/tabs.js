/**
 * @file tabs.js
 * @description Configuració i gestió de la navegació entre les pestanyes principals (Dades / Serveis).
 * @module tabs
 */

// Importa la funció per actualitzar estils des de servicesPanelManager
import { updateExternalStylesForCurrentService } from "../services/servicesPanelManager.js"; // Ajusta la ruta si cal

// --- Constants ---
const TABS = {
  DADES: "dades",
  SERVEIS: "serveis",
};
const DOM_IDS = {
  TAB_DADES: `tab-${TABS.DADES}`,
  TAB_SERVEIS: `tab-${TABS.SERVEIS}`,
  CONTENT_DADES: `${TABS.DADES}-tab-content`,
  CONTENT_SERVEIS: `${TABS.SERVEIS}-tab-content`,
};
const CSS_CLASSES = {
  ACTIVE_TAB: "active", // Classe per a la pestanya i contingut actiu
  ERROR_TAB: "error-tab", // Classe per indicar error en una pestanya
};

// --- Variables d'Estat del Mòdul ---
let currentTab = TABS.DADES; // Inicialitza amb la pestanya per defecte

// --- Funcions Públiques / Exportades ---

/** Retorna l'ID de la pestanya actualment activa ('dades' o 'serveis'). */
export function getCurrentTab() {
  return currentTab;
}

/**
 * Configura els listeners inicials per a les pestanyes.
 * @export
 */
export function setupTabs() {
  const tabDadesElement = document.getElementById(DOM_IDS.TAB_DADES);
  const tabServeisElement = document.getElementById(DOM_IDS.TAB_SERVEIS);

  if (!tabDadesElement || !tabServeisElement) {
    console.error("Tabs: No s'han trobat els elements de les pestanyes.");
    return;
  }

  tabDadesElement.addEventListener("click", () => switchToTab(TABS.DADES));
  tabServeisElement.addEventListener("click", () => switchToTab(TABS.SERVEIS));

  // Mostra la pestanya inicial per defecte
  switchToTab(currentTab); // Usa la variable d'estat inicial
  console.log("Sistema de pestanyes configurat.");
}

// --- Funcions Privades ---

/**
 * Canvia la visualització a la pestanya especificada.
 * @param {('dades'|'serveis')} tabName - L'ID de la pestanya a activar.
 */
function switchToTab(tabName) {
  if (tabName !== TABS.DADES && tabName !== TABS.SERVEIS) {
    console.warn(`Intent de canviar a una pestanya invàlida: ${tabName}`);
    return;
  }

  // Actualitza l'estat intern
  currentTab = tabName;
  console.log(`Canviant a la pestanya: ${currentTab}`);

  // Obté referències als elements (es podrien cachejar si no canvien)
  const tabDadesElement = document.getElementById(DOM_IDS.TAB_DADES);
  const tabServeisElement = document.getElementById(DOM_IDS.TAB_SERVEIS);
  const dadesContentElement = document.getElementById(DOM_IDS.CONTENT_DADES);
  const serveisContentElement = document.getElementById(
    DOM_IDS.CONTENT_SERVEIS
  );

  if (
    !tabDadesElement ||
    !tabServeisElement ||
    !dadesContentElement ||
    !serveisContentElement
  ) {
    console.error(
      "Tabs: Falten elements de pestanya o contingut en switchToTab."
    );
    return;
  }

  // (Opcional) Neteja indicadors d'error en canviar de pestanya
  tabDadesElement.classList.remove(CSS_CLASSES.ERROR_TAB);
  tabServeisElement.classList.remove(CSS_CLASSES.ERROR_TAB);

  // Activa/Desactiva pestanyes i continguts
  const isDadesActive = tabName === TABS.DADES;

  tabDadesElement.classList.toggle(CSS_CLASSES.ACTIVE_TAB, isDadesActive);
  tabServeisElement.classList.toggle(CSS_CLASSES.ACTIVE_TAB, !isDadesActive);
  dadesContentElement.classList.toggle(CSS_CLASSES.ACTIVE_TAB, isDadesActive);
  serveisContentElement.classList.toggle(
    CSS_CLASSES.ACTIVE_TAB,
    !isDadesActive
  );

  // **CORRECCIÓ CLAU:** Si la pestanya activada és la de 'serveis',
  // cridem la funció per actualitzar els estils dels botons externs.
  if (tabName === TABS.SERVEIS) {
    // Comprova si la funció existeix abans de cridar-la (bona pràctica)
    if (typeof updateExternalStylesForCurrentService === "function") {
      updateExternalStylesForCurrentService();
    } else {
      console.warn(
        "La funció 'updateExternalStylesForCurrentService' no s'ha pogut importar o no existeix a servicesPanelManager."
      );
    }
  }
}
