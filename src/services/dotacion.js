/*******************************************************
 * dotacion.js
 *
 * Ahora, si la dotación ya existe (mismo vehículo + conductor + ayudante ignorando mayúsculas),
 * se sobrescribe en lugar de lanzar un error.
 * Además, los campos conductor/ayudante muestran el borde rojo en el contenedor .input-with-icon
 * si faltan los valores.
 *******************************************************/
import {
  getSignatureConductor,
  getSignatureAjudant,
  setSignatureConductor,
  setSignatureAjudant,
  updateSignatureIcons,
} from "./signatureService.js";
import { showToast } from "../ui/toast.js";

let dotacions = [];

/**
 * Inicializa la lógica de dotaciones.
 */
export function initDotacion() {
  loadDotacionsFromStorage();
  const addDotacioBtn = document.getElementById("add-dotacio");
  addDotacioBtn?.addEventListener("click", addDotacioFromMainForm);
  const openDotacioBtn = document.getElementById("open-dotacio-modal");
  openDotacioBtn?.addEventListener("click", openDotacioModal);
  const closeDotacioBtn = document.getElementById("close-dotacio-modal");
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // Evento para cerrar modal al hacer clic fuera
  const dotacioModal = document.getElementById("dotacio-modal");
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) {
      closeDotacioModal();
    }
  });

  displayDotacioOptions();

  // Configuración de escuchadores para errores de entrada
  const inputsConfig = [
    { id: "vehicle-number", groupSelector: null }, // Vehicle es el propio input
    { id: "person1", groupSelector: ".input-with-icon" },
    { id: "person2", groupSelector: ".input-with-icon" },
  ];

  inputsConfig.forEach((config) => {
    const input = document.getElementById(config.id);
    if (!input) return;
    const group = config.groupSelector
      ? input.closest(config.groupSelector)
      : null;

    input.addEventListener("input", () => {
      if (config.groupSelector) {
        group?.classList.remove("input-error");
      } else {
        input.classList.remove("input-error");
      }
    });
  });
}

/**
 * Carga las dotaciones desde el almacenamiento local.
 */
function loadDotacionsFromStorage() {
  const saved = localStorage.getItem("dotacions");
  dotacions = saved ? JSON.parse(saved) : [];
}

/**
 * Guarda las dotaciones en el almacenamiento local.
 */
function saveDotacions() {
  localStorage.setItem("dotacions", JSON.stringify(dotacions));
}

/**
 * Maneja el evento de guardado de una nueva dotación.
 * Valida campos obligatorios y sobrescribe si existe.
 */
function addDotacioFromMainForm() {
  const vehicleInput = document.getElementById("vehicle-number");
  const conductorInput = document.getElementById("person1");
  const ajudantInput = document.getElementById("person2");
  const conductorGroup = conductorInput?.closest(".input-with-icon");
  const ajudantGroup = ajudantInput?.closest(".input-with-icon");

  // Limpiar errores previos
  [vehicleInput, conductorGroup, ajudantGroup].forEach((el) =>
    el?.classList.remove("input-error")
  );

  const vehiculo = (vehicleInput?.value || "").trim();
  const conductor = (conductorInput?.value || "").trim();
  const ajudant = (ajudantInput?.value || "").trim();
  const firmaConductor = getSignatureConductor();
  const firmaAjudant = getSignatureAjudant();

  let valid = true;

  // Validación de campos obligatorios
  if (!vehiculo) {
    vehicleInput?.classList.add("input-error");
    valid = false;
  }
  if (!conductor) {
    conductorGroup?.classList.add("input-error");
    valid = false;
  }
  if (!ajudant) {
    ajudantGroup?.classList.add("input-error");
    valid = false;
  }

  //Declaración de errorFields
  const errorFields = []; //

  // Validación de campos obligatorios
  if (!vehiculo) {
    vehicleInput?.classList.add("input-error");
    errorFields.push("Vehículo");
    valid = false;
  }
  if (!conductor) {
    conductorGroup?.classList.add("input-error");
    errorFields.push("Conductor");
    valid = false;
  }
  if (!ajudant) {
    ajudantGroup?.classList.add("input-error");
    errorFields.push("Ayudante");
    valid = false;
  }

  if (!valid) {
    showToast(
      `Faltan campos obligatorios: ${errorFields.join(", ")}.`,
      "error"
    );
    return;
  }

  // Comprobar existencia previa
  const vLower = vehiculo.toLowerCase();
  const cLower = conductor.toLowerCase();
  const aLower = ajudant.toLowerCase();

  const existingIndex = dotacions.findIndex(
    (d) =>
      d.numero.toLowerCase() === vLower &&
      d.conductor.toLowerCase() === cLower &&
      d.ajudant.toLowerCase() === aLower
  );

  if (existingIndex !== -1) {
    // Sobrescribir datos existentes
    dotacions[existingIndex] = {
      numero: vehiculo,
      conductor: conductor,
      ajudant: ajudant,
      firmaConductor: firmaConductor,
      firmaAjudant: firmaAjudant,
    };
    showToast("Dotación actualizada correctamente", "success");
  } else {
    // Agregar nueva dotación
    const nuevaDotacio = {
      numero: vehiculo,
      conductor: conductor,
      ajudant: ajudant,
      firmaConductor: firmaConductor,
      firmaAjudant: firmaAjudant,
    };
    dotacions.push(nuevaDotacio);
    showToast("Nueva dotación guardada correctamente", "success");
  }

  saveDotacions();
  displayDotacioOptions();
}

/**
 * Abre el modal de gestión de dotaciones y actualiza la lista.
 */
function openDotacioModal() {
  const modal = document.getElementById("dotacio-modal");
  if (!modal) return;
  modal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDotacioOptions();
}

/**
 * Cierra el modal de gestión de dotaciones.
 */
function closeDotacioModal() {
  const modal = document.getElementById("dotacio-modal");
  if (!modal) return;
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/**
 * Muestra la lista de dotaciones en el contenedor.
 */
function displayDotacioOptions() {
  const container = document.getElementById("dotacio-options");
  const template = document.getElementById("dotacio-template");
  const noDotacioText = document.getElementById("no-dotacio-text");

  if (!container || !template) return;
  container.innerHTML = "";

  if (dotacions.length === 0) {
    noDotacioText?.classList.remove("hidden");
  } else {
    noDotacioText?.classList.add("hidden");
    dotacions.forEach((dotacio, index) => {
      const clone = template.content.cloneNode(true);
      const infoSpan = clone.querySelector(".dotacio-info");
      const loadBtn = clone.querySelector(".dotacio-load");
      const deleteBtn = clone.querySelector(".dotacio-delete");

      infoSpan.textContent = formatDotacioListText(dotacio);
      loadBtn.dataset.index = index;
      deleteBtn.dataset.index = index;

      loadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        loadDotacio(parseInt(loadBtn.dataset.index, 10));
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteDotacio(parseInt(deleteBtn.dataset.index, 10));
      });

      container.appendChild(clone);
    });
  }
}

/**
 * Formatea la información de una dotación para mostrar en la lista.
 */
function formatDotacioListText(dotacio) {
  const unitat = dotacio.numero;
  const cShort = shortNameAndSurname(dotacio.conductor);
  const aShort = shortNameAndSurname(dotacio.ajudant);
  return `${unitat} - ${cShort} y ${aShort}`;
}

/**
 * Extrae nombre y primer apellido de una cadena completa.
 */
function shortNameAndSurname(fullName) {
  if (!fullName) return "";
  const parts = fullName.split(" ").filter(Boolean);
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || "";
}

/**
 * Carga una dotación existente en el formulario principal.
 */
function loadDotacio(index) {
  const selected = dotacions[index];
  if (!selected) return;

  // ─────────────────────────────────────────────
  // Primero, eliminar todas las clases de error existentes
  // ─────────────────────────────────────────────
  const vehicleInput = document.getElementById("vehicle-number");
  vehicleInput.classList.remove("input-error");

  const conductorInput = document.getElementById("person1");
  const conductorGroup = conductorInput?.closest(".input-with-icon");
  conductorGroup?.classList.remove("input-error");

  const ajudantInput = document.getElementById("person2");
  const ajudantGroup = ajudantInput?.closest(".input-with-icon");
  ajudantGroup?.classList.remove("input-error");

  // Ahora cargar los valores desde la dotación
  vehicleInput.value = selected.numero || "";
  conductorInput.value = selected.conductor || "";
  ajudantInput.value = selected.ajudant || "";

  // Actualizar firmas
  setSignatureConductor(selected.firmaConductor || "");
  setSignatureAjudant(selected.firmaAjudant || "");
  updateSignatureIcons();

  closeDotacioModal();
}

/**
 * Elimina una dotación existente.
 */
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  showToast("Dotación eliminada correctamente", "success");
  displayDotacioOptions();
}
