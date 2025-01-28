// js/formHandlers.js

import { getSignatureConductor, getSignatureAjudant } from "./signature.js";

let initialFormDataStr = "";

export function setInitialFormDataStr(str) {
  initialFormDataStr = str;
}

export function getInitialFormDataStr() {
  return initialFormDataStr;
}

export function addInputListeners() {
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
  ].join(", ");
  const allInputs = document.querySelectorAll(watchSelector);

  allInputs.forEach((inp) => {
    inp.addEventListener("input", debounce(checkIfFormChanged, 300));
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/** Tanca teclat en prémer Enter si hi ha enterkeyhint="done" */
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

/* Quan no hi ha canvis respecte a l'estat inicial, desactivem "Guardar" */
export function checkIfFormChanged() {
  const saveBtn = document.getElementById("save-diet");
  if (!saveBtn) return;

  const currentStr = getAllFormDataAsString();
  if (currentStr === initialFormDataStr) {
    // no canvis -> disable
    saveBtn.disabled = true;
    saveBtn.classList.add("disabled-button");
  } else {
    // hi ha canvis -> enable
    saveBtn.disabled = false;
    saveBtn.classList.remove("disabled-button");
  }
}

export function getAllFormDataAsString() {
  const { generalData, servicesData } = gatherAllData();
  return JSON.stringify({ generalData, servicesData });
}

export function gatherAllData() {
  const dateVal = document.getElementById("date").value.trim();
  const dietTypeVal = document.getElementById("diet-type").value.trim();
  const vehicleVal = document.getElementById("vehicle-number").value.trim();
  const p1 = document.getElementById("person1").value.trim();
  const p2 = document.getElementById("person2").value.trim();

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
      signatureConductor: getSignatureConductor(),
      signatureAjudant: getSignatureAjudant(),
    },
    servicesData,
  };
}

export function disableSaveButton() {
  const saveBtn = document.getElementById("save-diet");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.add("disabled-button");
  }
}

/**
 * Elimina les classes d'error dels camps d'un servei.
 * @param {HTMLElement} serviceElement - Element del servei.
 */
export function removeErrorClasses(serviceElement) {
  const fields = serviceElement.querySelectorAll(
    ".service-number, .origin, .origin-time, .destination, .destination-time, .end-time"
  );
  fields.forEach((f) => f.classList.remove("input-error"));
}
