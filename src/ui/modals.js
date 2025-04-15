/**
 * @file modals.js
 * @description Gestiona l'obertura, tancament i contingut de diversos modals de l'aplicació.
 * @module modals
 */

// Importacions de Serveis i Utilitats
import { loadDietById, deleteDietHandler } from "../services/dietService.js"; // Serveis per a accions
import { getDietDisplayInfo, capitalizeFirstLetter } from "../utils/utils.js"; // Utilitats per formatar
import { getAllDiets } from "../db/indexedDbDietRepository.js"; // Accés directe a BD per llistar

// --- Constants ---
const CSS_CLASSES = {
  MODAL_VISIBLE: "visible", // Classe per fer visible un modal (si s'usa classList)
  MODAL_OPEN_BODY: "modal-open", // Classe per al body
  HIDDEN: "hidden",
  DIET_ITEM: "diet-item",
  DIET_DATE: "diet-date",
  DIET_ICONS: "diet-icons",
  DIET_DELETE_BTN: "diet-delete", // Classe específica botó eliminar dieta
  DIET_LOAD_BTN: "diet-load", // Classe específica botó carregar dieta
  LIST_ITEM_BTN: "list-item-btn", // Classe base per botons de llista
  LIST_ITEM_BTN_LOAD: "list-item-btn--load", // Modificador
  LIST_ITEM_BTN_DELETE: "list-item-btn--delete", // Modificador
};
const DOM_IDS = {
  DIET_MODAL: "diet-modal",
  DIET_OPTIONS_LIST: "diet-options",
  NO_DIETS_TEXT: "no-diets-text",
  CONFIRM_MODAL: "confirm-modal",
  CONFIRM_MESSAGE: "confirm-message",
  CONFIRM_TITLE: ".modal-title", // Selector dins del confirm modal
  CONFIRM_YES_BTN: "confirm-yes",
  CONFIRM_NO_BTN: "confirm-no",
};
const SELECTORS = {
  MODAL: ".modal",
  MODAL_CLOSE_BTN: ".close-modal, .close-modal-btn",
};
const DATA_ATTRIBUTES = {
  DIET_ID: "data-diet-id",
  DIET_DATE: "data-diet-date",
  DIET_TYPE: "data-diet-type",
};

// --- Variables d'Estat / Cache ---
let dietModalElement = null;
let dietOptionsListElement = null;
let noDietsTextElement = null;
let confirmModalElement = null;
let confirmMsgElement = null;
let confirmTitleElement = null;
let confirmYesBtn = null;
let confirmNoBtn = null;
let currentConfirmResolve = null;
let activeModal = null; // Referència al modal obert actualment per gestionar Escape

// --- Funcions Privades ---

/** Obre un modal genèric. */
function _openGenericModal(modalElement) {
  if (!modalElement || activeModal) return; // Evita obrir si ja n'hi ha un
  activeModal = modalElement; // Guarda referència
  modalElement.style.display = "block"; // O 'flex'
  document.body.classList.add(CSS_CLASSES.MODAL_OPEN_BODY);
  document.addEventListener("keydown", _handleGlobalEscape); // Afegeix listener Escape

  const firstFocusable = modalElement.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}

/** Tanca un modal genèric. */
function _closeGenericModal(modalElement) {
  if (!modalElement || modalElement !== activeModal) return; // Només tanca l'actiu
  modalElement.style.display = "none";
  document.body.classList.remove(CSS_CLASSES.MODAL_OPEN_BODY);
  document.removeEventListener("keydown", _handleGlobalEscape); // Treu listener Escape
  activeModal = null; // Reseteja referència
  // TODO: Retornar focus
}

/** Gestiona la tecla Escape globalment per tancar el modal actiu. */
function _handleGlobalEscape(event) {
  if (event.key === "Escape" && activeModal) {
    // Excepció: No tanquem el modal de confirmació amb Escape directament aquí,
    // ja que té la seva pròpia lògica de cancel·lació.
    if (activeModal.id !== DOM_IDS.CONFIRM_MODAL) {
      _closeGenericModal(activeModal);
    }
  }
}

/** Crea un element de llista (DOM) per a una dieta. */
function _createDietListItem(diet) {
  const { ddmmaa, franjaText } = getDietDisplayInfo(diet.date, diet.dietType);
  const dietItem = document.createElement("div");
  dietItem.className = CSS_CLASSES.DIET_ITEM;

  const dateSpan = document.createElement("span");
  dateSpan.className = CSS_CLASSES.DIET_DATE;
  dateSpan.textContent = `${ddmmaa} - ${capitalizeFirstLetter(franjaText)}`;

  const iconsContainer = document.createElement("div");
  iconsContainer.className = CSS_CLASSES.DIET_ICONS;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = `${CSS_CLASSES.LIST_ITEM_BTN} ${CSS_CLASSES.LIST_ITEM_BTN_DELETE} ${CSS_CLASSES.DIET_DELETE_BTN}`;
  deleteBtn.setAttribute("aria-label", `Eliminar dieta ${ddmmaa}`);
  deleteBtn.innerHTML = `<img src="assets/icons/delete.svg" alt="" class="icon"><span class="btn-text visually-hidden">Eliminar</span>`;
  deleteBtn.setAttribute(DATA_ATTRIBUTES.DIET_ID, diet.id);
  deleteBtn.setAttribute(DATA_ATTRIBUTES.DIET_DATE, diet.date);
  deleteBtn.setAttribute(DATA_ATTRIBUTES.DIET_TYPE, diet.dietType);

  const loadBtn = document.createElement("button");
  loadBtn.className = `${CSS_CLASSES.LIST_ITEM_BTN} ${CSS_CLASSES.LIST_ITEM_BTN_LOAD} ${CSS_CLASSES.DIET_LOAD_BTN}`;
  loadBtn.setAttribute("aria-label", `Carregar dieta ${ddmmaa}`);
  loadBtn.innerHTML = `<img src="assets/icons/upload.svg" alt="" class="icon"><span class="btn-text visually-hidden">Carregar</span>`;
  loadBtn.setAttribute(DATA_ATTRIBUTES.DIET_ID, diet.id);
  loadBtn.setAttribute(DATA_ATTRIBUTES.DIET_DATE, diet.date);
  loadBtn.setAttribute(DATA_ATTRIBUTES.DIET_TYPE, diet.dietType);

  iconsContainer.appendChild(deleteBtn);
  iconsContainer.appendChild(loadBtn);
  dietItem.appendChild(dateSpan);
  dietItem.appendChild(iconsContainer);

  return dietItem;
}

/** Gestiona clics dins la llista de dietes (delegació). */
async function _handleDietListClick(event) {
  const target = event.target;
  const loadButton = target.closest(`.${CSS_CLASSES.DIET_LOAD_BTN}`);
  const deleteButton = target.closest(`.${CSS_CLASSES.DIET_DELETE_BTN}`);

  if (loadButton) {
    event.stopPropagation();
    const dietId = loadButton.getAttribute(DATA_ATTRIBUTES.DIET_ID);
    const dietDate = loadButton.getAttribute(DATA_ATTRIBUTES.DIET_DATE);
    const dietType = loadButton.getAttribute(DATA_ATTRIBUTES.DIET_TYPE);
    if (!dietId) return;
    const { ddmmaa, franjaText } = getDietDisplayInfo(dietDate, dietType);
    const confirmed = await showConfirmModal(
      `¿Quieres cargar la dieta de la ${franjaText} del ${ddmmaa}? Los datos no guardados se perderán.`,
      "Cargar dieta"
    );
    if (confirmed) loadDietById(dietId);
  } else if (deleteButton) {
    event.stopPropagation();
    const dietId = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_ID);
    const dietDate = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_DATE);
    const dietType = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_TYPE);
    if (dietId) deleteDietHandler(dietId, dietDate, dietType); // Ja demana confirmació interna
  }
}

/** Traps focus inside the confirm modal. */
function _trapConfirmFocus(event) {
  /* ... (codi igual que abans) ... */
}
/** Neteja listeners del modal de confirmació. */
function _cleanupConfirmModalListeners() {
  /* ... (codi igual que abans) ... */
}
/** Gestiona clic "Sí". */
function _handleConfirmYes() {
  /* ... (codi igual que abans) ... */
}
/** Gestiona clic "No". */
function _handleConfirmNo() {
  /* ... (codi igual que abans) ... */
}
/** Gestiona clic fora del confirm modal. */
function _handleConfirmOutsideClick(event) {
  /* ... (codi igual que abans) ... */
}
/** Gestiona Escape per al confirm modal. */
function _handleConfirmEscape(event) {
  /* ... (codi igual que abans) ... */
}
/** Tanca confirm modal i neteja listeners. */
function _closeConfirmModal() {
  /* ... (codi igual que abans, crida _closeGenericModal) ... */
}

// --- Funcions Públiques / Exportades ---

/** Configura listeners per a modals genèrics. */
export function setupModalGenerics() {
  // Cacheig inicial d'elements del modal de confirmació
  confirmModalElement = document.getElementById(DOM_IDS.CONFIRM_MODAL);
  if (confirmModalElement) {
    confirmMsgElement = document.getElementById(DOM_IDS.CONFIRM_MESSAGE);
    confirmTitleElement = confirmModalElement.querySelector(
      DOM_IDS.CONFIRM_TITLE
    );
    confirmYesBtn = document.getElementById(DOM_IDS.CONFIRM_YES_BTN);
    confirmNoBtn = document.getElementById(DOM_IDS.CONFIRM_NO_BTN);
    if (
      !confirmMsgElement ||
      !confirmTitleElement ||
      !confirmYesBtn ||
      !confirmNoBtn
    ) {
      console.error("Falten elements dins del modal de confirmació.");
      confirmModalElement = null;
    }
  } else {
    console.warn("Modal de confirmació no trobat.");
  }

  // Listeners per triggers genèrics (ex: About)
  const modalTriggers = document.querySelectorAll('a[href^="#"]');
  modalTriggers.forEach((trigger) => {
    const modalId = trigger.getAttribute("href").substring(1);
    const targetModal = document.getElementById(modalId);
    if (
      targetModal &&
      targetModal.classList.contains(SELECTORS.MODAL.substring(1))
    ) {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        _openGenericModal(targetModal);
      });
      const closeButtons = targetModal.querySelectorAll(
        SELECTORS.MODAL_CLOSE_BTN
      );
      closeButtons.forEach((btn) => {
        btn.addEventListener("click", () => _closeGenericModal(targetModal));
      });
      targetModal.addEventListener("click", (event) => {
        if (event.target === targetModal) _closeGenericModal(targetModal);
      });
    }
  });
  console.log("Listeners per a modals genèrics configurats.");
}

/** Obre el modal de gestió de dietes. */
export function openDietModal() {
  if (!dietModalElement) {
    // Cacheig i listener de delegació només la primera vegada
    dietModalElement = document.getElementById(DOM_IDS.DIET_MODAL);
    dietOptionsListElement = document.getElementById(DOM_IDS.DIET_OPTIONS_LIST);
    noDietsTextElement = document.getElementById(DOM_IDS.NO_DIETS_TEXT);
    if (dietOptionsListElement) {
      dietOptionsListElement.addEventListener("click", _handleDietListClick);
    } else {
      console.error("No s'ha trobat el contenidor de la llista de dietes.");
      dietModalElement = null; // Evita obrir si falta la llista
    }
  }
  if (dietModalElement) {
    _openGenericModal(dietModalElement);
    displayDietOptions(); // Actualitza contingut en obrir
  }
}

/** Tanca el modal de gestió de dietes. */
export function closeDietModal() {
  _closeGenericModal(dietModalElement);
}

/** Mostra les opcions de dietes desades. */
export async function displayDietOptions() {
  if (!dietOptionsListElement || !noDietsTextElement) {
    console.error(
      "No es poden mostrar opcions de dietes: elements DOM no trobats."
    );
    return;
  }
  dietOptionsListElement.innerHTML = "";
  try {
    const savedDiets = await getAllDiets();
    if (!savedDiets || savedDiets.length === 0) {
      dietOptionsListElement.classList.add(CSS_CLASSES.HIDDEN);
      noDietsTextElement.classList.remove(CSS_CLASSES.HIDDEN);
    } else {
      dietOptionsListElement.classList.remove(CSS_CLASSES.HIDDEN);
      noDietsTextElement.classList.add(CSS_CLASSES.HIDDEN);
      savedDiets.forEach((diet) => {
        const listItem = _createDietListItem(diet);
        dietOptionsListElement.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error("Error obtenint o mostrant les dietes desades:", error);
    // showToast("Error al carregar les dietes guardades.", "error"); // showToast potser no està disponible aquí
    dietOptionsListElement.classList.add(CSS_CLASSES.HIDDEN);
    noDietsTextElement.classList.remove(CSS_CLASSES.HIDDEN);
    noDietsTextElement.textContent = "Error al carregar les dietes.";
  }
}

/** Mostra un modal de confirmació reutilitzable. */
export function showConfirmModal(message, title = "Confirmar acció") {
  if (!confirmModalElement) {
    console.error("Modal de confirmació no inicialitzat.");
    return Promise.resolve(false);
  }
  if (currentConfirmResolve) {
    console.warn("Intent d'obrir confirmació mentre una altra està activa.");
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    currentConfirmResolve = resolve;
    confirmTitleElement.textContent = title;
    confirmMsgElement.textContent = message;
    confirmYesBtn.addEventListener("click", _handleConfirmYes);
    confirmNoBtn.addEventListener("click", _handleConfirmNo);
    window.addEventListener("click", _handleConfirmOutsideClick); // Compte amb múltiples listeners si no es netegen bé
    document.addEventListener("keydown", _trapConfirmFocus);
    document.addEventListener("keydown", _handleConfirmEscape);
    _openGenericModal(confirmModalElement);
    confirmYesBtn.focus();
  });
}
