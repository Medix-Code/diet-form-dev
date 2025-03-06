//validation.js
/**
 * Lógica de validación
 */

import { validateServiceNumber } from "../services/servicesPanelManager.js";

/**
 * Valida la pestaña "Datos".
 * Verifica campos obligatorios como fecha y tipo de dieta.
 */
export function validateDadesTab() {
  let valid = true;
  const dateInput = document.getElementById("date");
  const dietTypeSelect = document.getElementById("diet-type");

  // Eliminar clases de error previas
  [dateInput, dietTypeSelect].forEach((el) =>
    el.classList.remove("input-error")
  );

  function markError(el) {
    el.classList.add("input-error");
    valid = false;
  }

  // Campos obligatorios en pestaña "Datos"
  if (!dateInput.value.trim()) markError(dateInput);
  if (!dietTypeSelect.value.trim()) markError(dietTypeSelect);

  return valid; // Devuelve true si no hay errores, false en caso contrario
}

/**
 * Valida la pestaña "Servicios".
 * - El primer número de servicio (service-number-1) es obligatorio.
 * - Los otros (service-number-2, 3, 4) son opcionales,
 *   pero si se ha introducido algo, deben cumplir el formato (9 dígitos).
 */
export function validateServeisTab() {
  let valid = true;

  // -------------------------------------------------
  // 1) Validación para service-number-1 (obligatorio)
  // -------------------------------------------------
  const service1Number = document.getElementById("service-number-1");
  service1Number.classList.remove("input-error");

  function markError(el) {
    el.classList.add("input-error");
    valid = false;
  }

  const s1val = service1Number.value.trim();
  if (!s1val) {
    // Campo obligatorio vacío
    markError(service1Number);
  } else if (s1val.length < 9) {
    // Debe tener 9 dígitos
    markError(service1Number);
  } else if (!validateServiceNumber(s1val)) {
    // Formato no válido (debe ser exactamente 9 dígitos)
    markError(service1Number);
  }

  // -------------------------------------------
  // 2) Validación para service-number-2,3,4 (opcionales)
  //    Solo se valida el formato si el usuario ha introducido algo.
  // -------------------------------------------
  for (let i = 2; i <= 4; i++) {
    const serviceNumInput = document.getElementById(`service-number-${i}`);
    if (!serviceNumInput) continue; // Por si acaso no existe en el DOM
    serviceNumInput.classList.remove("input-error");

    const val = serviceNumInput.value.trim();
    if (val) {
      // Si el usuario ha introducido algo, validamos que tenga 9 dígitos
      if (val.length < 9 || !validateServiceNumber(val)) {
        markError(serviceNumInput);
      }
    }
  }

  return valid; // true si todo OK, false si hay errores en cualquiera
}

/**
 * Validación mínima para guardar (ejemplo).
 * Comprueba "Datos" y al menos el primer servicio correcto.
 */
export function validateMinFieldsForSave() {
  const dadesOK = validateDadesTab();
  const serveisOK = validateServeisTab();
  return dadesOK && serveisOK;
}

/**
 * Validación para generar el PDF (puedes reusarla o personalizarla).
 */
export function validateForPdf() {
  return validateMinFieldsForSave();
}

/**
 * Valida la coherencia de los horarios (origin-time, destination-time, end-time)
 * en todos los servicios. Si hay alguna incoherencia, devuelve false.
 */
export function validateServiceTimesForAll() {
  const allServices = document.querySelectorAll(".service");
  for (let service of allServices) {
    const originTime = service.querySelector(".origin-time")?.value;
    const destinationTime = service.querySelector(".destination-time")?.value;
    const endTime = service.querySelector(".end-time")?.value;

    if (originTime && destinationTime && endTime) {
      const originMinutes = timeToMinutes(originTime);
      const destinationMinutes = timeToMinutes(destinationTime);
      const endMinutes = timeToMinutes(endTime);

      if (originMinutes > destinationMinutes) return false;
      if (destinationMinutes > endMinutes) return false;
      if (originMinutes > endMinutes) return false;
    }
  }
  return true;
}

/**
 * Convierte "HH:MM" a la cantidad total de minutos.
 */
function timeToMinutes(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}
