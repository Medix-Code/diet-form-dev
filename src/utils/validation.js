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
 * Valida la pestaña "Servicios".
 * - El primer número de servicio (service-number-1) es obligatorio.
 * - Los otros (service-number-2, 3, 4) son opcionales,
 *   pero si se ha introducido algo, deben cumplir el formato (9 dígitos).
 */
export function validateServeisTab() {
  let valid = true;

  // Mapa de llistes d'errors: quins serveis tenen l'error "digitShort", etc.
  const errorMap = {
    digitShort: [], // Serveis amb menys de 9 dígits
    nonNumeric: [], // Serveis que no són només dígits
    emptyRequiredS1: false, // Per indicar si S1 és buit
  };

  /**
   * Valida un sol <input> de servei.
   * @param {HTMLElement} el  - Element <input>
   * @param {number} index    - Número de servei (1,2,3,4)
   * @param {boolean} required - Si és obligatori o no
   */
  function validateOneServiceNumber(el, index, required) {
    el.classList.remove("input-error");
    const val = el.value.trim();

    // S1 buit (obligatori): marquem error però NO afegim text
    if (!val && required) {
      el.classList.add("input-error");
      valid = false;
      errorMap.emptyRequiredS1 = true;
      return;
    }

    // Si està buit i NO és obligatori, no fem res
    if (!val && !required) return;

    // Si hi ha valor, cal que sigui de 9 dígits
    if (val.length < 9) {
      el.classList.add("input-error");
      valid = false;
      errorMap.digitShort.push(index);
    } else if (!validateServiceNumber(val)) {
      el.classList.add("input-error");
      valid = false;
      errorMap.nonNumeric.push(index);
    }
  }

  // =============== 1) S1 obligatori
  const service1El = document.getElementById("service-number-1");
  validateOneServiceNumber(service1El, 1, true);

  // =============== 2) S2-S4 opcionals
  for (let i = 2; i <= 4; i++) {
    const el = document.getElementById(`service-number-${i}`);
    if (!el) continue;
    validateOneServiceNumber(el, i, false);
  }

  // Si tot està OK, sortim
  if (valid) return true;

  // Construïm un sol missatge per a cada tipus d’error
  const messages = [];

  // 1) S1 està buit però és obligatori
  //    (això és el cas on NO volem un missatge concret,
  //     ja que el "onClickSaveDiet()" mostrarà "Completa los campos..." de forma global)
  //    Si encara així vols un missatge, pots fer:
  /*
  if (errorMap.emptyRequiredS1) {
    messages.push("El servicio S1 es obligatorio.");
  }
  */

  // 2) Serveis amb "digitShort" (menys de 9 dígits)
  if (errorMap.digitShort.length > 0) {
    const serviciosStr = formatServiceList(errorMap.digitShort);
    messages.push(`El servicio ${serviciosStr} debe tener 9 dígitos.`);
  }

  // 3) Serveis amb "nonNumeric"
  if (errorMap.nonNumeric.length > 0) {
    const serviciosStr = formatServiceList(errorMap.nonNumeric);
    messages.push(
      `El servicio ${serviciosStr} solo puede contener 9 dígitos numéricos.`
    );
  }

  // Si tenim algun missatge, el llancem en UN sol toast
  if (messages.length > 0) {
    const finalMessage = messages.join("\n");
    showToast(finalMessage, "error");
  }

  return false;
}

/**
 * Rep una llista d'índex (p. ex. [2,3]) i retorna un string "S2 y S3",
 * o "S2, S3 y S4" per a 3+ elements.
 */
function formatServiceList(indexes) {
  // indexes ex: [2, 3, 4]
  // Volem: "S2, S3 y S4"
  // 1) Transformar cada element a "S2", "S3", ...
  const sList = indexes.map((i) => `S${i}`);
  if (sList.length === 1) return sList[0]; // "S2"
  if (sList.length === 2) return sList.join(" y "); // "S2 y S3"

  // Més de 2 elements: "S2, S3 y S4"
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
