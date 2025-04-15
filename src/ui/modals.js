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
  // Modals Específics
  DIET_MODAL: "diet-modal",
  DIET_OPTIONS_LIST: "diet-options",
  NO_DIETS_TEXT: "no-diets-text",
  CONFIRM_MODAL: "confirm-modal",
  CONFIRM_MESSAGE: "confirm-message",
  CONFIRM_TITLE: ".modal-title", // Selector dins del confirm modal
  CONFIRM_YES_BTN: "confirm-yes",
  CONFIRM_NO_BTN: "confirm-no",
  // Altres modals (es gestionen per ID o selectors genèrics)
  ABOUT_MODAL: "about-modal",
  SIGNATURE_MODAL: "signature-modal",
  DOTACIO_MODAL: "dotacio-modal",
  CAMERA_GALLERY_MODAL: "camera-gallery-modal",
};
const SELECTORS = {
  MODAL: ".modal", // Selector genèric per identificar modals
  MODAL_CLOSE_BTN: ".close-modal, .close-modal-btn", // Qualsevol botó de tancar
  MODAL_TRIGGER: 'a[href^="#"]', // Enllaços que apunten a IDs (per setupModalGenerics)
  FOCUSABLE_ELEMENTS:
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', // Elements enfocables
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
let currentConfirmResolve = null; // Funció resolve de la promesa de confirmació actual
let activeModalElement = null; // Referència al modal obert actualment
let previousActiveElement = null; // Element que tenia el focus abans d'obrir el modal
let currentOutsideClickListener = null; // Referència al listener de clic fora actiu
let currentEscapeKeyListener = null; // Referència al listener d'Escape actiu

// --- Funcions Privades ---

/** Obre un modal genèric. */
function _openGenericModal(modalElement) {
  if (!modalElement || activeModalElement) {
    console.warn(
      "Intent d'obrir modal invàlid o un altre ja actiu.",
      modalElement?.id
    );
    return;
  }

  previousActiveElement = document.activeElement;
  activeModalElement = modalElement;

  modalElement.style.display = "block"; // O 'flex'
  document.body.classList.add(CSS_CLASSES.MODAL_OPEN_BODY);

  // Defineix i afegeix listener per clic fora
  currentOutsideClickListener = (event) => {
    // Comprova si el clic és DIRECTAMENT sobre l'overlay del modal actiu
    if (event.target === activeModalElement) {
      console.log(`Clic fora detectat per al modal #${activeModalElement.id}`);
      if (
        activeModalElement.id === DOM_IDS.CONFIRM_MODAL &&
        currentConfirmResolve
      ) {
        currentConfirmResolve(false); // Cancel·la confirmació
        _closeConfirmModal();
      } else if (activeModalElement.id !== DOM_IDS.CONFIRM_MODAL) {
        _closeGenericModal(); // Tanca altres modals
      }
    }
  };
  // Afegim al document per capturar clics fora
  document.addEventListener("click", currentOutsideClickListener, true); // Usem captura per assegurar-nos que s'executa abans que altres listeners interns

  // Defineix i afegeix listener per Escape
  currentEscapeKeyListener = (event) => {
    if (event.key === "Escape" && activeModalElement) {
      console.log(
        `Tecla Escape detectada per al modal #${activeModalElement.id}`
      );
      if (
        activeModalElement.id === DOM_IDS.CONFIRM_MODAL &&
        currentConfirmResolve
      ) {
        currentConfirmResolve(false); // Cancel·la confirmació
        _closeConfirmModal();
      } else if (activeModalElement.id !== DOM_IDS.CONFIRM_MODAL) {
        _closeGenericModal(); // Tanca altres modals
      }
    }
  };
  document.addEventListener("keydown", currentEscapeKeyListener, true);

  const firstFocusable = modalElement.querySelector(
    SELECTORS.FOCUSABLE_ELEMENTS
  );
  firstFocusable?.focus();

  console.log(`Modal obert: #${modalElement.id}`);
}

/** Tanca el modal genèric actualment actiu. */
function _closeGenericModal() {
  if (!activeModalElement) return;

  const modalToClose = activeModalElement;

  modalToClose.style.display = "none";
  document.body.classList.remove(CSS_CLASSES.MODAL_OPEN_BODY);

  // Elimina els listeners GLOBALS que vam afegir en obrir
  if (currentOutsideClickListener) {
    document.removeEventListener("click", currentOutsideClickListener, true);
    currentOutsideClickListener = null;
  }
  if (currentEscapeKeyListener) {
    document.removeEventListener("keydown", currentEscapeKeyListener, true);
    currentEscapeKeyListener = null;
  }

  console.log(`Modal tancat: #${modalToClose.id}`);
  activeModalElement = null;

  // Retorna focus només si hi havia un element previ i no estem tancant per obrir un altre modal immediatament
  previousActiveElement?.focus();
  previousActiveElement = null;
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
  // Afegim text ocult per accessibilitat, la icona va per CSS si s'usa :before/:after o directament com img
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
    if (confirmed) {
      // loadDietById hauria de tancar el modal de dietes internament si té èxit
      loadDietById(dietId);
    }
  } else if (deleteButton) {
    event.stopPropagation();
    const dietId = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_ID);
    const dietDate = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_DATE);
    const dietType = deleteButton.getAttribute(DATA_ATTRIBUTES.DIET_TYPE);
    if (dietId) {
      // deleteDietHandler ja gestiona la confirmació
      deleteDietHandler(dietId, dietDate, dietType);
    }
  }
}

/** Traps focus inside the confirm modal. */
function _trapConfirmFocus(event) {
  if (
    !confirmModalElement ||
    confirmModalElement !== activeModalElement ||
    event.key !== "Tab"
  )
    return;
  const focusables = Array.from(
    confirmModalElement.querySelectorAll(SELECTORS.FOCUSABLE_ELEMENTS)
  ).filter((el) => el.offsetParent !== null);
  if (focusables.length === 0) return;
  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
}

/** Neteja listeners específics del modal de confirmació (Sí/No i Trap Focus). */
function _cleanupConfirmModalListeners() {
  if (confirmNoBtn) confirmNoBtn.removeEventListener("click", _handleConfirmNo);
  if (confirmYesBtn)
    confirmYesBtn.removeEventListener("click", _handleConfirmYes);
  document.removeEventListener("keydown", _trapConfirmFocus); // Neteja el trap
  currentConfirmResolve = null; // Molt important!
  // console.log("Listeners interns del modal de confirmació netejats.");
}

/** Gestiona clic "Sí". */
function _handleConfirmYes() {
  if (currentConfirmResolve) currentConfirmResolve(true);
  _closeConfirmModal();
}

/** Gestiona clic "No". */
function _handleConfirmNo() {
  if (currentConfirmResolve) currentConfirmResolve(false);
  _closeConfirmModal();
}

/** Tanca el modal de confirmació i neteja els seus listeners interns. */
function _closeConfirmModal() {
  _cleanupConfirmModalListeners(); // Neteja Sí/No/Trap
  _closeGenericModal(); // Crida genèrica per ocultar i netejar listeners globals
}

// --- Funcions Públiques / Exportades ---

/**
 * Configura els listeners per a modals genèrics que s'obren amb enllaços `href="#modal-id"`.
 * També inicialitza el cache d'elements per al modal de confirmació.
 * @export
 */
export function setupModalGenerics() {
  // Cacheig inicial elements modal de confirmació
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
      console.error(
        "Falten elements dins del modal de confirmació. Funcionalitat desactivada."
      );
      confirmModalElement = null;
    }
    // No afegim listener de clic fora aquí, es gestiona globalment quan s'obre
  } else {
    console.warn("Modal de confirmació no trobat durant la inicialització.");
  }

  // Configura triggers genèrics (com el botó "About")
  const modalTriggers = document.querySelectorAll(SELECTORS.MODAL_TRIGGER);
  modalTriggers.forEach((trigger) => {
    try {
      const modalId = trigger.getAttribute("href")?.substring(1);
      if (!modalId) return;
      const targetModal = document.getElementById(modalId);

      // Assegura't que és un modal que volem gestionar aquí
      if (targetModal && targetModal.matches(SELECTORS.MODAL)) {
        // Evita afegir listeners múltiples
        if (trigger.dataset.modalSetup === "true") return;
        trigger.dataset.modalSetup = "true";

        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          // Comprova si ja hi ha un modal obert abans d'obrir-ne un altre
          if (activeModalElement && activeModalElement !== targetModal) {
            console.warn(
              `S'ha intentat obrir el modal #${modalId} mentre #${activeModalElement.id} estava actiu.`
            );
            // Opcional: podries tancar l'antic primer?
            // _closeGenericModal();
            // setTimeout(() => _openGenericModal(targetModal), 10); // Petita espera
            return; // Per ara, simplement no obrim el nou
          }
          _openGenericModal(targetModal);
        });

        // Configura botons de tancar interns
        const closeButtons = targetModal.querySelectorAll(
          SELECTORS.MODAL_CLOSE_BTN
        );
        closeButtons.forEach((btn) => {
          if (btn.dataset.modalCloseSetup === "true") return;
          btn.dataset.modalCloseSetup = "true";
          btn.addEventListener("click", () => _closeGenericModal()); // Tanca l'actiu
        });
      }
    } catch (error) {
      console.error(
        `Error configurant trigger per a modal: ${trigger.getAttribute(
          "href"
        )}`,
        error
      );
    }
  });
  console.log("Listeners per a modals genèrics configurats.");
}

/** Obre el modal de gestió de dietes. */
export function openDietModal() {
  if (!dietModalElement) {
    // Cacheig i listener només la primera vegada
    dietModalElement = document.getElementById(DOM_IDS.DIET_MODAL);
    dietOptionsListElement = document.getElementById(DOM_IDS.DIET_OPTIONS_LIST);
    noDietsTextElement = document.getElementById(DOM_IDS.NO_DIETS_TEXT);
    if (dietOptionsListElement) {
      dietOptionsListElement.addEventListener("click", _handleDietListClick);
    } else {
      console.error(
        "El contenidor de la llista de dietes (#diet-options) no s'ha trobat."
      );
      dietModalElement = null;
    }
  }
  if (dietModalElement) {
    _openGenericModal(dietModalElement);
    displayDietOptions();
  }
}

/** Tanca el modal de gestió de dietes. */
export function closeDietModal() {
  // Només tanquem si el modal actiu ÉS el de dietes
  if (activeModalElement && activeModalElement.id === DOM_IDS.DIET_MODAL) {
    _closeGenericModal();
  }
}

/** Mostra les opcions de dietes desades dins del seu contenidor al modal. */
export async function displayDietOptions() {
  if (!dietOptionsListElement)
    dietOptionsListElement = document.getElementById(DOM_IDS.DIET_OPTIONS_LIST);
  if (!noDietsTextElement)
    noDietsTextElement = document.getElementById(DOM_IDS.NO_DIETS_TEXT);
  if (!dietOptionsListElement || !noDietsTextElement) {
    console.error("Elements DOM per a opcions de dietes no disponibles.");
    return;
  }
  dietOptionsListElement.innerHTML = "";
  try {
    const savedDiets = await getAllDiets();
    if (!savedDiets || savedDiets.length === 0) {
      dietOptionsListElement.classList.add(CSS_CLASSES.HIDDEN);
      noDietsTextElement.classList.remove(CSS_CLASSES.HIDDEN);
      noDietsTextElement.textContent = "No hay dietas guardadas.";
    } else {
      dietOptionsListElement.classList.remove(CSS_CLASSES.HIDDEN);
      noDietsTextElement.classList.add(CSS_CLASSES.HIDDEN);
      // Opcional: Ordenar
      // savedDiets.sort((a, b) => new Date(b.date) - new Date(a.date));
      savedDiets.forEach((diet) => {
        const listItem = _createDietListItem(diet);
        dietOptionsListElement.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error("Error obtenint o mostrant les dietes desades:", error);
    dietOptionsListElement.classList.add(CSS_CLASSES.HIDDEN);
    noDietsTextElement.classList.remove(CSS_CLASSES.HIDDEN);
    noDietsTextElement.textContent = "Error al cargar las dietas.";
  }
}

/** Mostra un modal de confirmació reutilitzable. */
export function showConfirmModal(message, title = "Confirmar acció") {
  if (!confirmModalElement) {
    return Promise.reject(new Error("Modal de confirmació no inicialitzat."));
  }
  if (currentConfirmResolve) {
    // Ja hi ha una promesa pendent
    console.warn("Modal de confirmació ja actiu. Petició ignorada.");
    return Promise.resolve(false); // O potser rebutjar l'anterior? Per ara ignorem la nova.
  }
  return new Promise((resolve) => {
    currentConfirmResolve = resolve;
    confirmTitleElement.textContent = title;
    confirmMsgElement.textContent = message;

    // Afegeix listeners interns Sí/No/TrapFocus
    confirmYesBtn.addEventListener("click", _handleConfirmYes);
    confirmNoBtn.addEventListener("click", _handleConfirmNo);
    document.addEventListener("keydown", _trapConfirmFocus);

    // Obre el modal (això afegeix Escape global i Clic Fora global)
    _openGenericModal(confirmModalElement);
    confirmYesBtn.focus(); // Focus inicial
  });
}
