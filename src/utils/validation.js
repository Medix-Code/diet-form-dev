//validation.js
/**
 * Lógica de validación
 */

import { showToast } from "../ui/toast.js";
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
 * Valida la pestaña "Servicios", agrupando los errores por tipo:
 * 1) no-numéricos,
 * 2) menos de 9 dígitos
 * 3) S1 vacío (obligatorio).
 */
export function validateServeisTab() {
  let valid = true;

  const errorMap = {
    emptyRequiredS1: false,
    nonNumeric: [],
    digitShort: [],
  };

  function markError(el) {
    el.classList.add("input-error");
    valid = false;
  }

  /**
   * Valida un único input de servicio.
   * @param {HTMLElement} el - El input a validar
   * @param {number} index - El número del servicio (1,2,3,4)
   * @param {boolean} isRequired - Si es obligatorio o no
   */
  function validateOneServiceNumber(el, index, isRequired) {
    el.classList.remove("input-error");
    const val = el.value.trim();

    // Si está vacío y es obligatorio (S1)
    if (!val && isRequired) {
      markError(el);
      errorMap.emptyRequiredS1 = true;
      return;
    }

    // Si está vacío y no es obligatorio (S2, S3, S4), no hacemos nada
    if (!val && !isRequired) {
      return;
    }

    // ***********************
    // 1) Comprobar si es numérico
    // ***********************
    const soloDigitos = /^\d+$/.test(val); // true si todos los caracteres son dígitos
    if (!soloDigitos) {
      markError(el);
      errorMap.nonNumeric.push(index);
      return; // Si ya es no-numérico, no verificamos la longitud
    }

    // ***********************
    // 2) Comprobar si tiene 9 dígitos
    // ***********************
    if (val.length < 9) {
      markError(el);
      errorMap.digitShort.push(index);
    }
  }

  // ================
  // 1) S1 obligatorio
  // ================
  const service1El = document.getElementById("service-number-1");
  validateOneServiceNumber(service1El, 1, true);

  // ================
  // 2) S2, S3, S4 opcionales
  // ================
  for (let i = 2; i <= 4; i++) {
    const el = document.getElementById(`service-number-${i}`);
    if (el) {
      validateOneServiceNumber(el, i, false);
    }
  }

  // Si no ha habido errores, retornamos true
  if (valid) return true;

  // Construimos un solo mensaje de error (si corresponde)
  const messages = [];
  // Si S1 está vacío
  // (Podrías no poner ningún mensaje para forzar el “Completa los campos...” a nivel superior)
  /*
  if (errorMap.emptyRequiredS1) {
    messages.push("El servicio S1 es obligatorio (9 dígitos).");
  }
  */

  // Si hay servicios no numéricos
  if (errorMap.nonNumeric.length > 0) {
    const sList = formatServiceList(errorMap.nonNumeric);
    messages.push(`El servicio ${sList} debe contener solo dígitos (0-9).`);
  }

  // Si hay servicios con < 9 dígitos
  if (errorMap.digitShort.length > 0) {
    const sList = formatServiceList(errorMap.digitShort);
    messages.push(`El servicio ${sList} debe tener 9 dígitos.`);
  }

  if (messages.length > 0) {
    showToast(messages.join("\n"), "error");
  }

  return false;
}

/**
 * Recibe una lista de índices [2,3] y retorna un string
 * "S2 y S3" o "S2, S3 y S4" para 3+ elementos.
 */
function formatServiceList(indexes) {
  // indexes p.ej. [2, 3, 4]
  // Queremos "S2, S3 y S4"
  const sList = indexes.map((i) => `S${i}`);
  if (sList.length === 1) return sList[0];
  if (sList.length === 2) return sList.join(" y ");
  return sList.slice(0, -1).join(", ") + " y " + sList[sList.length - 1];
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
