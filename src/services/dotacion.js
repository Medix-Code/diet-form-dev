/*******************************************************
 * dotacionn.js
 *
 * Ahora, si la dotación ya existe (mismo Vehículo + Conductor + Ayudante
 * ignorando mayúsculas), se SOBRESCRIBE en lugar de lanzar un error.
 * Además, los campos Conductor/Ayudante muestran
 * el borde rojo si faltan (clase .input-error) sobre
 * la .input-with-icon en lugar del input directamente.
 *******************************************************/

import {
  getSignatureConductor,
  getSignatureAjudant,
  setSignatureConductor,
  setSignatureAjudant,
  updateSignatureIcons,
} from "./signatureService.js";

import { showToast } from "../ui/toast.js";

const DOTACIONS_KEY = "dotacions"; // Clave para localStorage
let dotacions = [];

/**
 * Inicializa la lógica de las dotaciones.
 */
export function initDotacion() {
  loadDotacionsFromStorage();

  const addDotacioBtn = document.getElementById("add-dotacio");
  addDotacioBtn?.addEventListener("click", addDotacioFromMainForm);

  const openDotacioBtn = document.getElementById("open-dotacio-modal");
  openDotacioBtn?.addEventListener("click", openDotacioModal);

  const closeDotacioBtn = document.getElementById("close-dotacio-modal");
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // Cerrar el modal si se hace clic fuera
  const dotacioModal = document.getElementById("dotacio-modal");
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) {
      closeDotacioModal();
    }
  });

  displayDotacioOptions();

  // ─────────────────────────────────────────────
  // AÑADIMOS LISTENERS PARA LIMPIAR .input-error
  // cuando el usuario empieza a escribir en Vehículo, Conductor y Ayudante
  // ─────────────────────────────────────────────

  // Vehículo (es directamente un <input>)
  const vehicleInput = document.getElementById("vehicle-number");
  vehicleInput?.addEventListener("input", () => {
    vehicleInput.classList.remove("input-error");
  });

  // Conductor (la clase .input-error se aplica al DIV .input-with-icon)
  const conductorInput = document.getElementById("person1");
  const conductorGroup = conductorInput?.closest(".input-with-icon");
  conductorInput?.addEventListener("input", () => {
    conductorGroup?.classList.remove("input-error");
  });

  // Ayudante (igual que Conductor)
  const ajudantInput = document.getElementById("person2");
  const ajudantGroup = ajudantInput?.closest(".input-with-icon");
  ajudantInput?.addEventListener("input", () => {
    ajudantGroup?.classList.remove("input-error");
  });
}

/**
 * Carga el array de dotaciones desde el localStorage.
 */
function loadDotacionsFromStorage() {
  const savedDotacions = localStorage.getItem(DOTACIONS_KEY);
  dotacions = savedDotacions ? JSON.parse(savedDotacions) : [];
}

/**
 * Guarda el array de dotaciones en el localStorage.
 */
function saveDotacions() {
  localStorage.setItem(DOTACIONS_KEY, JSON.stringify(dotacions));
}

/**
 * Se llama cuando el usuario hace clic en "Guardar" (#add-dotacio).
 * - Comprueba si hay Vehículo, Conductor y Ayudante.
 * - Si la dotación ya existe, la sobrescribe.
 * - Si no existe, crea una nueva.
 * - Muestra .input-error en el borde si faltan campos.
 */
function addDotacioFromMainForm() {
  // Inputs básicos
  const vehicleInput = document.getElementById("vehicle-number");

  // Conductor y Ayudante (inputs + contenedor .input-with-icon)
  const conductorInput = document.getElementById("person1");
  const ajudantInput = document.getElementById("person2");

  // Contenedores (para marcar el borde rojo si faltan)
  const conductorGroup = conductorInput?.closest(".input-with-icon");
  const ajudantGroup = ajudantInput?.closest(".input-with-icon");

  // Limpiar clases de error previas
  [vehicleInput, conductorGroup, ajudantGroup].forEach((el) => {
    el?.classList.remove("input-error");
  });

  // Valores
  const vehiculo = (vehicleInput?.value || "").trim();
  const conductor = (conductorInput?.value || "").trim();
  const ayudante = (ajudantInput?.value || "").trim();

  // Firmas (opcional)
  const firmaConductor = getSignatureConductor();
  const firmaAjudant = getSignatureAjudant();

  let valid = true;

  // ─────────────────────────────────────────────
  // Validamos campos obligatorios
  // ─────────────────────────────────────────────
  if (!vehiculo) {
    vehicleInput?.classList.add("input-error");
    valid = false;
  }
  if (!conductor) {
    conductorGroup?.classList.add("input-error");
    valid = false;
  }
  if (!ayudante) {
    ajudantGroup?.classList.add("input-error");
    valid = false;
  }

  if (!valid) {
    showToast(
      "Faltan campos obligatorios (Vehículo, Conductor, Ayudante).",
      "error"
    );
    return;
  }

  // ─────────────────────────────────────────────
  // Comprobamos si ya existe la misma dotación
  // (ignorando mayúsculas/minúsculas)
  // ─────────────────────────────────────────────
  const vLower = vehiculo.toLowerCase();
  const cLower = conductor.toLowerCase();
  const aLower = ayudante.toLowerCase();

  // Buscamos el índice si coincide Vehículo/Conductor/Ayudante
  const existingIndex = dotacions.findIndex(
    (d) =>
      d.numero.toLowerCase() === vLower &&
      d.conductor.toLowerCase() === cLower &&
      d.ajudant.toLowerCase() === aLower
  );

  if (existingIndex !== -1) {
    // Ya existía, por lo que SOBRESCRIBIMOS la dotación
    dotacions[existingIndex].numero = vehiculo;
    dotacions[existingIndex].conductor = conductor;
    dotacions[existingIndex].ajudant = ayudante;
    dotacions[existingIndex].firmaConductor = firmaConductor;
    dotacions[existingIndex].firmaAjudant = firmaAjudant;

    saveDotacions();
    showToast("¡Dotación sobrescrita correctamente!", "success");
    displayDotacioOptions();
    return;
  }

  // ─────────────────────────────────────────────
  // Si no existía, creamos una nueva dotación
  // ─────────────────────────────────────────────
  const nuevaDotacion = {
    numero: vehiculo,
    conductor: conductor,
    ajudant: ayudante,
    firmaConductor: firmaConductor,
    firmaAjudant: firmaAjudant,
  };

  dotacions.push(nuevaDotacion);
  saveDotacions();

  showToast("¡Nueva dotación guardada correctamente!", "success");
  displayDotacioOptions();
}

/**
 * Abre el modal "Gestor de dotaciones" y actualiza la lista.
 */
function openDotacioModal() {
  const modal = document.getElementById("dotacio-modal");
  if (!modal) return;
  modal.style.display = "block";
  document.body.classList.add("modal-open");

  displayDotacioOptions();
}

/**
 * Cierra el modal "Gestor de dotaciones".
 */
function closeDotacioModal() {
  const modal = document.getElementById("dotacio-modal");
  if (!modal) return;
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/**
 * Muestra la lista de dotaciones en el contenedor #dotacio-options
 * utilizando la plantilla <template id="dotacio-template">
 */
function displayDotacioOptions() {
  const container = document.getElementById("dotacio-options");
  const template = document.getElementById("dotacio-template");
  const noDotacioText = document.getElementById("no-dotacio-text");
  if (!container || !template) return;

  container.innerHTML = "";

  if (dotacions.length === 0) {
    noDotacioText?.classList.remove("hidden");
    return;
  } else {
    noDotacioText?.classList.add("hidden");
  }

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

/**
 * Devuelve la cadena a mostrar en la lista, por ejemplo:
 * "G887 - Joselin Manhego y Manel Romero"
 * (solo nombre + primer apellido para conductor y ayudante).
 */
function formatDotacioListText(dotacio) {
  const unidad = dotacio.numero;
  const cShort = shortNameAndSurname(dotacio.conductor);
  const aShort = shortNameAndSurname(dotacio.ajudant);
  return `${unidad} - ${cShort} y ${aShort}`;
}

/**
 * Dado un string "Pep Martí Sans", devuelve "Pep Martí"
 * (nombre + primer apellido).
 */
function shortNameAndSurname(full) {
  if (!full) return "";
  const parts = full.split(" ").filter(Boolean);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
}

/**
 * Cuando se hace clic en "Cargar": carga la dotación en el formulario principal
 * (vehículo, conductor, ayudante y firmas).
 */
function loadDotacio(index) {
  const selected = dotacions[index];
  if (!selected) return;

  // VEHÍCULO
  const vehicleInput = document.getElementById("vehicle-number");
  vehicleInput.value = selected.numero || "";
  // Si Vehículo no está en blanco, quita el error
  if (vehicleInput.value.trim()) {
    vehicleInput.classList.remove("input-error");
  }

  // CONDUCTOR
  const conductorInput = document.getElementById("person1");
  const conductorGroup = conductorInput.closest(".input-with-icon");
  conductorInput.value = selected.conductor || "";
  // Si Conductor no está en blanco, quita el error del DIV
  if (conductorInput.value.trim()) {
    conductorGroup?.classList.remove("input-error");
  }

  // AYUDANTE
  const ajudantInput = document.getElementById("person2");
  const ajudantGroup = ajudantInput.closest(".input-with-icon");
  ajudantInput.value = selected.ajudant || "";
  // Si Ayudante no está en blanco, quita el error del DIV
  if (ajudantInput.value.trim()) {
    ajudantGroup?.classList.remove("input-error");
  }

  // Firmas
  setSignatureConductor(selected.firmaConductor || "");
  setSignatureAjudant(selected.firmaAjudant || "");
  updateSignatureIcons();

  closeDotacioModal();
}

/**
 * Elimina la dotación del array y vuelve a pintar la lista.
 */
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  showToast("¡Dotación eliminada!", "success");
  displayDotacioOptions();
}
