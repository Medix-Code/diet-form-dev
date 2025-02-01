/**
 * Funcions de validació (abans era "validation.js")
 */

import { validateServiceNumber } from "../services/servicesPanelManager.js";

export function validateMinFieldsForSave() {
  let valid = true;
  const dateInput = document.getElementById("date");
  const dietTypeSelect = document.getElementById("diet-type");
  const service1Number = document.getElementById("service-number-1");

  [dateInput, dietTypeSelect, service1Number].forEach((el) =>
    el.classList.remove("input-error")
  );

  function markError(el) {
    el.classList.add("input-error");
    valid = false;
  }

  if (!dateInput.value.trim()) markError(dateInput);
  if (!dietTypeSelect.value.trim()) markError(dietTypeSelect);

  const s1val = service1Number.value.trim();
  if (!s1val) {
    markError(service1Number);
  } else if (s1val.length < 9) {
    markError(service1Number);
  } else if (!validateServiceNumber(s1val)) {
    markError(service1Number);
  }

  return valid;
}

export function validateForPdf() {
  return validateMinFieldsForSave();
}
