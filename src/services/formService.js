/**
 * @file formService.js
 * @description Gestiona l'estat del formulari principal, la recollida de dades,
 *              la detecció de canvis i la interacció bàsica dels inputs.
 * @module formService
 */

import {
  getSignatureConductor,
  getSignatureAjudant,
} from "./signatureService.js";
import { getCurrentDietType } from "../utils/utils.js";
// Importa debounce des d'utils si existeix, sinó defineix-lo aquí o importa des de signatureService si està allà
// import { debounce } from '../utils/utils.js';

// --- Constants ---
// IDs i Selectors principals
const FORM_CONTAINER_ID = "main-content"; // Assumeix que hi ha un contenidor principal
const DATE_INPUT_ID = "date";
const DIET_TYPE_SELECT_ID = "diet-type";
const VEHICLE_INPUT_ID = "vehicle-number";
const PERSON1_INPUT_ID = "person1";
const PERSON2_INPUT_ID = "person2";
const EMPRESA_SELECT_ID = "empresa";
const SAVE_BUTTON_ID = "save-diet";
const SERVICE_CONTAINER_SELECTOR = ".service"; // Classe per a cada contenidor de servei

// Selectors dins de cada servei
const SERVICE_FIELD_SELECTORS = {
  serviceNumber: ".service-number",
  origin: ".origin",
  originTime: ".origin-time",
  destination: ".destination",
  destinationTime: ".destination-time",
  endTime: ".end-time",
};

// Selector general per als camps que s'han de vigilar per canvis
const WATCHED_FIELDS_SELECTOR = `
    #${DATE_INPUT_ID},
    #${DIET_TYPE_SELECT_ID},
    #${VEHICLE_INPUT_ID},
    #${PERSON1_INPUT_ID},
    #${PERSON2_INPUT_ID},
    #${EMPRESA_SELECT_ID},
    ${SERVICE_CONTAINER_SELECTOR} ${Object.values(SERVICE_FIELD_SELECTORS).join(
  ", "
)}
`;

const CSS_CLASSES = {
  INPUT_ERROR: "input-error", // Classe per marcar errors (gestionada externament)
  DISABLED_BUTTON: "disabled-button",
};

const DEBOUNCE_DELAY = 300; // ms

// --- Variables d'Estat del Mòdul ---
let initialFormDataStr = ""; // Emmagatzema l'estat inicial com a string JSON
let saveButtonElement = null;

// --- Funcions Privades ---

/** Funció Debounce (reutilitzada o importada) */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Recull les dades actuals del formulari i les retorna com un objecte estructurat.
 * @returns {{generalData: object, servicesData: object[]}|null} Objecte amb les dades o null si hi ha error.
 */
function getFormDataObject() {
  try {
    const generalData = {
      date: document.getElementById(DATE_INPUT_ID)?.value.trim() || "",
      dietType:
        document.getElementById(DIET_TYPE_SELECT_ID)?.value.trim() ||
        getCurrentDietType(),
      vehicleNumber:
        document.getElementById(VEHICLE_INPUT_ID)?.value.trim() || "",
      person1: document.getElementById(PERSON1_INPUT_ID)?.value.trim() || "",
      person2: document.getElementById(PERSON2_INPUT_ID)?.value.trim() || "",
      empresa: document.getElementById(EMPRESA_SELECT_ID)?.value.trim() || "",
      signatureConductor: getSignatureConductor(),
      signatureAjudant: getSignatureAjudant(),
    };

    const serviceElements = document.querySelectorAll(
      SERVICE_CONTAINER_SELECTOR
    );
    const servicesData = Array.from(serviceElements).map((serviceElement) => {
      const service = {};
      for (const [fieldName, selector] of Object.entries(
        SERVICE_FIELD_SELECTORS
      )) {
        service[fieldName] =
          serviceElement.querySelector(selector)?.value.trim() || "";
      }
      return service;
    });

    return { generalData, servicesData };
  } catch (error) {
    console.error("Error recollint les dades del formulari:", error);
    return null; // Indica que hi ha hagut un problema
  }
}

// --- Funcions Públiques / Exportades ---

/**
 * Emmagatzema l'estat actual del formulari com a estat inicial per a comparacions futures.
 * @export
 */
export function captureInitialFormState() {
  const data = getFormDataObject();
  initialFormDataStr = data ? JSON.stringify(data) : "";
  // Assegura que el botó de desar comença desactivat
  checkIfFormChanged();
  console.log("Estat inicial del formulari capturat.");
}

/**
 * Retorna l'estat inicial capturat (string JSON).
 * @export
 */
export function getInitialFormDataStr() {
  return initialFormDataStr;
}

/**
 * Comprova si el formulari ha canviat respecte a l'estat inicial capturat.
 * Actualitza l'estat (activat/desactivat) del botó de desar.
 * @export
 */
export function checkIfFormChanged() {
  if (!saveButtonElement) {
    saveButtonElement = document.getElementById(SAVE_BUTTON_ID);
    if (!saveButtonElement) return; // Si no troba el botó, no fa res
  }

  const currentData = getFormDataObject();
  const currentStr = currentData ? JSON.stringify(currentData) : "";

  const hasChanged = currentStr !== initialFormDataStr;

  saveButtonElement.disabled = !hasChanged;
  saveButtonElement.classList.toggle(CSS_CLASSES.DISABLED_BUTTON, !hasChanged);
}

/**
 * Afegeix listeners als camps del formulari per detectar canvis.
 * @export
 */
export function addInputListeners() {
  const container = document.getElementById(FORM_CONTAINER_ID);
  if (!container) {
    console.error(
      `Form Service: Contenidor principal amb ID '${FORM_CONTAINER_ID}' no trobat.`
    );
    return;
  }

  // Usem delegació d'esdeveniments en el contenidor principal per eficiència
  const debouncedCheck = debounce(checkIfFormChanged, DEBOUNCE_DELAY);

  container.addEventListener("input", (event) => {
    // Comprova si l'element que ha disparat l'event és un dels que volem vigilar
    if (event.target.matches(WATCHED_FIELDS_SELECTOR)) {
      // Quan un camp canvia, activa la comprovació de canvis (amb debounce)
      debouncedCheck();

      // NOTA: La lògica per treure la classe 'input-error' s'ha eliminat d'aquí.
      // Aquesta classe l'hauria de gestionar el sistema de validació principal
      // (p.ex., les funcions validateDadesTab, validateServeisTab) quan es revalidi
      // el formulari, no només basant-se en si el camp ja no està buit.
      // Si es volgués mantenir aquí, la lògica de `isFieldNowValid` hauria de ser
      // molt més completa o coordinada amb les validacions externes.
    }
  });

  // Solució específica per Firefox amb date picker (mantinguda si cal)
  const dateInput = document.getElementById(DATE_INPUT_ID);
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      this.blur(); // Força l'acceptació del valor
      debouncedCheck(); // Comprova canvis també al 'change' per si 'input' no s'activa
    });
  }

  // Listener per als selects, ja que 'input' pot no funcionar en tots els navegadors
  container.addEventListener("change", (event) => {
    if (
      event.target.matches("select") &&
      event.target.matches(WATCHED_FIELDS_SELECTOR)
    ) {
      debouncedCheck();
    }
  });

  console.log("Listeners d'inputs del formulari configurats amb delegació.");
}

/**
 * Afegeix el comportament de tancar teclat en prémer 'Enter' a inputs amb 'enterkeyhint="done"'.
 * @export
 */
export function addDoneBehavior() {
  const container = document.getElementById(FORM_CONTAINER_ID);
  if (!container) return;

  container.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      event.target.matches('input[enterkeyhint="done"]')
    ) {
      event.preventDefault(); // Evita l'enviament del formulari si n'hi hagués
      event.target.blur(); // Amaga el teclat virtual
    }
  });
}

/**
 * Retorna les dades actuals del formulari en format d'objecte.
 * Aquesta és la funció principal per obtenir les dades abans de desar o generar PDF.
 * @export
 * @returns {{generalData: object, servicesData: object[]}|null} Objecte amb les dades o null si hi ha error.
 */
export function gatherAllData() {
  // Simplement crida a la funció interna que fa la feina
  return getFormDataObject();
}

/**
 * Funció per eliminar les classes d'error d'un element de servei específic.
 * Pot ser cridada externament pel sistema de validació.
 * @param {Element} serviceElement - L'element DOM del contenidor del servei.
 * @export
 */
export function removeErrorClassesFromService(serviceElement) {
  if (!serviceElement) return;
  Object.values(SERVICE_FIELD_SELECTORS).forEach((selector) => {
    serviceElement
      .querySelector(selector)
      ?.classList.remove(CSS_CLASSES.INPUT_ERROR);
  });
}

// NOTA: setInitialFormDataStr i getAllFormDataAsString es podrien eliminar si
// només s'usa captureInitialFormState i gatherAllData/getFormDataObject.
// Ho mantenim per compatibilitat amb el codi anterior si cal.

/**
 * Actualitza l'estat inicial (string JSON del formulari) - Mantenim per possible compatibilitat.
 * @param {string} str - El nou estat inicial com a string JSON.
 */
export function setInitialFormDataStr(str) {
  initialFormDataStr = str || "";
}

/**
 * Retorna tot el formulari en forma de string JSON - Mantenim per possible compatibilitat.
 * @returns {string} String JSON de les dades actuals del formulari.
 */
export function getAllFormDataAsString() {
  const data = getFormDataObject();
  return data ? JSON.stringify(data) : "";
}
