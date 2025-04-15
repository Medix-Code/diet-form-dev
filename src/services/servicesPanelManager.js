/**
 * @file servicesPanelManager.js
 * @description Gestiona la visualització i navegació entre els diferents panells de servei
 *              i actualitza l'estil dels controls associats.
 * @module servicesPanelManager
 */

// --- Constants ---
const DOM_IDS = {
  CONTAINER: "services-container",
  BUTTONS_CONTAINER: "service-buttons-container",
  OPTIONS_MENU: "options-menu",
  OPTIONS_TOGGLE_BTN: "options-toggle",
  CLEAR_BTN: "clear-selected-service", // Afegit per claredat
  CAMERA_BTN: "camera-in-dropdown", // Afegit per claredat
};
const SELECTORS = {
  SERVICE_PANEL: ".service",
  SERVICE_BUTTON: ".service-button",
};
const CSS_CLASSES = {
  // IMPORTANT: Assegura't que aquesta classe CSS realment fa 'display: none !important;'
  SERVICE_HIDDEN: "hidden",
  BUTTON_ACTIVE: "active-square",
  SERVICE_COLORS: ["service-1", "service-2", "service-3", "service-4"],
  OPTIONS_MENU_HIDDEN: "hidden",
};

// --- Variables d'Estat del Mòdul ---
let currentServiceIndex = 0;
let servicePanels = [];
let serviceButtons = [];
let servicesContainerElement = null;
let serviceButtonsContainerElement = null;
let optionsMenuElement = null;
let optionsToggleButtonElement = null;
let isInitialized = false;

// --- Funcions Privades ---

/** Crea els botons de navegació (S1, S2...) dinàmicament. */
function _createServiceButtons() {
  if (!serviceButtonsContainerElement || !servicePanels.length) return;
  serviceButtonsContainerElement.innerHTML = "";
  serviceButtons = [];
  servicePanels.forEach((_, index) => {
    const btn = document.createElement("button");
    const colorClass = CSS_CLASSES.SERVICE_COLORS[index] || "";
    // Afegim la classe base explícitament per si el selector canvia
    btn.className = `service-button ${colorClass}`; // Classe base + color
    btn.textContent = `S${index + 1}`;
    btn.type = "button";
    btn.setAttribute("aria-label", `Mostrar Servei ${index + 1}`);
    btn.addEventListener("click", () => {
      showService(index);
    });
    serviceButtonsContainerElement.appendChild(btn);
    serviceButtons.push(btn);
  });
}

/** Assigna listeners al menú d'opcions. */
function _attachOptionsMenuListeners() {
  if (!optionsMenuElement || !optionsToggleButtonElement) return;
  optionsToggleButtonElement.addEventListener("click", (e) => {
    e.stopPropagation();
    optionsMenuElement.classList.toggle(CSS_CLASSES.OPTIONS_MENU_HIDDEN);
  });
  document.addEventListener("click", (event) => {
    if (
      !optionsToggleButtonElement.contains(event.target) &&
      !optionsMenuElement.contains(event.target) &&
      !optionsMenuElement.classList.contains(CSS_CLASSES.OPTIONS_MENU_HIDDEN)
    ) {
      optionsMenuElement.classList.add(CSS_CLASSES.OPTIONS_MENU_HIDDEN);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !optionsMenuElement.classList.contains(CSS_CLASSES.OPTIONS_MENU_HIDDEN)
    ) {
      optionsMenuElement.classList.add(CSS_CLASSES.OPTIONS_MENU_HIDDEN);
      optionsToggleButtonElement.focus();
    }
  });
  optionsMenuElement.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      optionsMenuElement.classList.add(CSS_CLASSES.OPTIONS_MENU_HIDDEN);
    }
  });
}

/** Actualitza l'estil dels botons externs. */
function _updateExternalButtonStyles(index) {
  const colorClass = CSS_CLASSES.SERVICE_COLORS[index] || "";
  const clearButton = document.getElementById(DOM_IDS.CLEAR_BTN);
  const cameraButton = document.getElementById(DOM_IDS.CAMERA_BTN);
  const baseClearClass = "clear-selected-btn";
  const baseCameraClass = "camera-btn";
  const baseOptionsClass = "options-btn";

  const updateButton = (button, baseClass) => {
    if (button) {
      button.classList.remove(...CSS_CLASSES.SERVICE_COLORS);
      if (colorClass) button.classList.add(colorClass);
      // Assegura la classe base (per si classList.remove l'hagués tret per error, poc probable)
      if (!button.classList.contains(baseClass)) {
        button.classList.add(baseClass);
      }
    }
  };

  updateButton(clearButton, baseClearClass);
  updateButton(cameraButton, baseCameraClass);
  updateButton(optionsToggleButtonElement, baseOptionsClass); // optionsToggleButtonElement ja està cachejat
}

// --- Funcions Públiques ---

/** Retorna l'índex del servei actualment seleccionat. */
export const getCurrentServiceIndex = () => currentServiceIndex;

/** Inicialitza el gestor de panells de serveis. */
export function initServices() {
  if (isInitialized) return;

  servicesContainerElement = document.getElementById(DOM_IDS.CONTAINER);
  serviceButtonsContainerElement = document.getElementById(
    DOM_IDS.BUTTONS_CONTAINER
  );
  optionsMenuElement = document.getElementById(DOM_IDS.OPTIONS_MENU);
  optionsToggleButtonElement = document.getElementById(
    DOM_IDS.OPTIONS_TOGGLE_BTN
  );

  if (!servicesContainerElement || !serviceButtonsContainerElement) {
    console.error("Services Panel Manager: Falten contenidors essencials.");
    return;
  }

  servicePanels = Array.from(
    servicesContainerElement.querySelectorAll(SELECTORS.SERVICE_PANEL)
  );
  console.log(
    `Panells de servei trobats: ${servicePanels.length}`,
    servicePanels
  ); // Log per depurar

  if (!servicePanels.length) {
    console.warn("Services Panel Manager: No s'han trobat panells de servei.");
    return;
  }

  _createServiceButtons();
  _attachOptionsMenuListeners();

  // **VISIBILITAT INICIAL CORREGIDA I SIMPLIFICADA:**
  // Mostrem només el primer, la resta s'amaguen per CSS o per la lògica de showService
  currentServiceIndex = 0; // Estat inicial correcte
  // Assegurem que només el primer panell NO té la classe 'hidden' inicialment
  servicePanels.forEach((panel, idx) => {
    // Afegeix 'hidden' a tots EXCEPTE al primer (index 0)
    panel.classList.toggle(
      CSS_CLASSES.SERVICE_HIDDEN,
      idx !== currentServiceIndex
    );
  });

  // Activem el botó inicial i els estils externs
  serviceButtons[currentServiceIndex]?.classList.add(CSS_CLASSES.BUTTON_ACTIVE);
  _updateExternalButtonStyles(currentServiceIndex); // Estableix colors inicials correctes

  isInitialized = true;
  console.log(
    "Services Panel Manager inicialitzat. Servei actiu inicial:",
    currentServiceIndex + 1
  );
}

/**
 * Mostra el panell de servei a l'índex donat i actualitza els estats visuals.
 * @param {number} index - L'índex del servei a mostrar (base 0).
 */
export function showService(index) {
  if (
    index < 0 ||
    index >= servicePanels.length ||
    index === currentServiceIndex
  ) {
    return; // Índex invàlid o ja actiu
  }

  const previousIndex = currentServiceIndex;
  console.log(
    `[Services] Canviant de servei ${previousIndex + 1} a ${index + 1}`
  );

  // **LÒGICA DE VISIBILITAT REVISADA:**
  const panelToHide = servicePanels[previousIndex];
  const panelToShow = servicePanels[index];

  if (panelToHide) {
    panelToHide.classList.add(CSS_CLASSES.SERVICE_HIDDEN);
    console.log(`   - Amagat:`, panelToHide);
  } else {
    console.warn(`   - Panell a amagar (índex ${previousIndex}) no trobat.`);
  }

  if (panelToShow) {
    panelToShow.classList.remove(CSS_CLASSES.SERVICE_HIDDEN);
    console.log(`   - Mostrat:`, panelToShow);
    panelToShow.focus({ preventScroll: true });
    console.log(`   - Focus mogut al panell ${index + 1} (div)`); // Log addicional
  } else {
    console.warn(`   - Panell a mostrar (índex ${index}) no trobat.`);
    // ...
  }

  // Actualitza estat dels botons de navegació (S1, S2...)
  serviceButtons[previousIndex]?.classList.remove(CSS_CLASSES.BUTTON_ACTIVE);
  serviceButtons[index]?.classList.add(CSS_CLASSES.BUTTON_ACTIVE);

  // Actualitza l'índex *després* de les accions visuals
  currentServiceIndex = index;

  // Actualitza estils dels botons externs (clear, camera, options)
  _updateExternalButtonStyles(currentServiceIndex);
}

/** Neteja els camps d'un element de servei específic. */
export function clearServiceFields(serviceElement) {
  // ... (Codi igual, no canvia) ...
  if (!serviceElement) return;
  serviceElement
    .querySelectorAll(
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"])'
    )
    .forEach((input) => {
      input.value = "";
    });
  serviceElement.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0;
  });
  serviceElement.querySelectorAll("textarea").forEach((textarea) => {
    textarea.value = "";
  });
  console.log("Camps del servei netejats (valors).");
}

/** Funció exportada per actualitzar estils externs (per a tabs.js). */
export function updateExternalStylesForCurrentService() {
  _updateExternalButtonStyles(currentServiceIndex);
  console.log(
    `[Services] Estils externs actualitzats per al servei ${
      currentServiceIndex + 1
    }`
  );
}
