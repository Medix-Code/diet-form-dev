/**
 * Lògica de formulari: recollir dades, comparar, gestionar estat inicial, etc.
 */

import {
  getSignatureConductor,
  getSignatureAjudant,
} from "./signatureService.js";

import { getCurrentDietType } from "../utils/utils.js";

// ESTAT LOCAL del mòdul
let initialFormDataStr = "";

/**
 * Actualitza l'estat inicial (string JSON del formulari)
 */
export function setInitialFormDataStr(str) {
  initialFormDataStr = str;
}

/**
 * Retorna l'estat inicial (string JSON)
 */
export function getInitialFormDataStr() {
  return initialFormDataStr;
}

/**
 * Afegeix listeners als inputs per:
 *  - Treure la classe "input-error" si l'usuari corregeix l'error
 *  - Debounce checkIfFormChanged
 */
export function addInputListeners() {
  // Seleccionem tots els inputs d’interès (camps obligatoris i altres)
  const watchSelector = [
    "#date",
    "#diet-type",
    "#vehicle-number",
    "#person1",
    "#person2",
    ".service-number",
    ".origin",
    ".origin-time",
    ".destination",
    ".destination-time",
    ".end-time",
  ].join(", ");

  const allInputs = document.querySelectorAll(watchSelector);

  // Definim una versió "debounced" de checkIfFormChanged
  const debouncedCheck = debounce(checkIfFormChanged, 300);

  allInputs.forEach((inp) => {
    // Al fer 'input', provem de treure error si es corregeix
    inp.addEventListener("input", () => {
      if (isFieldNowValid(inp)) {
        inp.classList.remove("input-error");
      }
      // També comprovem canvis amb debounce
      debouncedCheck();
    });
  });
  // 🔹 Afegim la solució pel problema de Firefox amb el selector de data
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      this.blur(); // Treu el focus perquè Firefox accepti el valor immediatament
    });
  }
}

/**
 * Tanca teclat en prémer Enter si hi ha 'enterkeyhint="done"'
 */
export function addDoneBehavior() {
  const doneInputs = document.querySelectorAll('input[enterkeyhint="done"]');
  doneInputs.forEach((inp) => {
    inp.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        inp.blur();
      }
    });
  });
}

/**
 * Comprova si hi ha canvis al formulari respecte a l'estat inicial
 * i habilita o deshabilita el botó "Guardar" en conseqüència
 */
export function checkIfFormChanged() {
  const saveBtn = document.getElementById("save-diet");
  if (!saveBtn) return;

  const currentStr = getAllFormDataAsString();
  if (currentStr === initialFormDataStr) {
    // sense canvis
    saveBtn.disabled = true;
    saveBtn.classList.add("disabled-button");
  } else {
    // hi ha canvis
    saveBtn.disabled = false;
    saveBtn.classList.remove("disabled-button");
  }
}

/**
 * Retorna tot el formulari en forma de string JSON
 */
export function getAllFormDataAsString() {
  const { generalData, servicesData } = gatherAllData();
  return JSON.stringify({ generalData, servicesData });
}

/**
 * Recull totes les dades del formulari en objectes "quan es guarda"
 */
export function gatherAllData() {
  const dateVal = document.getElementById("date").value.trim();

  let dietTypeVal =
    document.getElementById("diet-type").value.trim() || getCurrentDietType();

  const vehicleVal = document.getElementById("vehicle-number").value.trim();
  const p1 = document.getElementById("person1").value.trim();
  const p2 = document.getElementById("person2").value.trim();

  // Recollim el valor del camp "Empresa" (selecció única)
  const empresaEl = document.getElementById("empresa");
  const empresaVal = empresaEl ? empresaEl.value.trim() : "";

  // Recollim dades de cada servei
  const servicesEls = document.querySelectorAll(".service");
  const servicesData = Array.from(servicesEls).map((s) => ({
    serviceNumber: s.querySelector(".service-number")?.value.trim() || "",
    origin: s.querySelector(".origin")?.value.trim() || "",
    originTime: s.querySelector(".origin-time")?.value.trim() || "",
    destination: s.querySelector(".destination")?.value.trim() || "",
    destinationTime: s.querySelector(".destination-time")?.value.trim() || "",
    endTime: s.querySelector(".end-time")?.value.trim() || "",
  }));

  return {
    generalData: {
      date: dateVal,
      dietType: dietTypeVal,
      vehicleNumber: vehicleVal,
      person1: p1,
      person2: p2,
      empresa: empresaVal, // Afegim el nou camp aquí
      signatureConductor: getSignatureConductor(),
      signatureAjudant: getSignatureAjudant(),
    },
    servicesData,
  };
}

/**
 * Elimina classes d'error dels camps d'un servei
 */
export function removeErrorClasses(serviceElement) {
  const fields = serviceElement.querySelectorAll(
    ".service-number, .origin, .origin-time, .destination, .destination-time, .end-time"
  );
  fields.forEach((f) => f.classList.remove("input-error"));
}

/* -------------------------------------------------------
   AUXILIARS
--------------------------------------------------------*/

/**
 * Funció de "debounce" genèrica
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Comprovem si un input "ara" és vàlid (només comprovació simple).
 * - Per ex. si té text i no està buit
 * - Si és select, que tingui un valor...
 */
function isFieldNowValid(inp) {
  const val = inp.value?.trim() || "";
  // Ex. si l'input és "service-number-1" necessitem >= 9 digits?
  // Per ara, fem un check genèric: no estigui buit.
  // Pots refinar-ho segons la lògica que vulguis.
  return val.length > 0;
}
