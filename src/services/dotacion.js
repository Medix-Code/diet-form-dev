/**
 * Lògica per a la gestió de dotacions.
 * Una dotació es compon d'un número i dos noms (ex. conductor i ayudante).
 * Aquest mòdul s'encarrega d'obrir/tancar el modal de dotació, mostrar la llista,
 * afegir noves dotacions i eliminar-les.
 */

// Array per emmagatzemar les dotacions
let dotacions = [];

// Referències als elements del DOM
let dotacioModal;
let dotacioOptionsContainer;
let closeDotacioBtn;
let addDotacioBtn;

/**
 * Inicialitza el mòdul de dotacions.
 * Configura els elements del modal, el botó d'obrir i carrega les dotacions des de localStorage.
 */
export function initDotacion() {
  // Seleccionem els elements del modal
  dotacioModal = document.getElementById("dotacio-modal");
  dotacioOptionsContainer = document.getElementById("dotacio-options");
  closeDotacioBtn = document.getElementById("close-dotacio-modal");
  addDotacioBtn = document.getElementById("add-dotacio");

  if (!dotacioModal || !dotacioOptionsContainer) {
    console.warn("No s'han trobat els elements del modal de dotació.");
    return;
  }

  // Assignem l'event listener al botó d'obrir el modal
  const openDotacioBtn = document.getElementById("open-dotacio-modal");
  if (openDotacioBtn) {
    openDotacioBtn.addEventListener("click", openDotacioModal);
  } else {
    console.warn("No s'ha trobat el botó per obrir el modal de dotació.");
  }

  // Carrega les dotacions guardades
  const savedDotacions = localStorage.getItem("dotacions");
  if (savedDotacions) {
    dotacions = JSON.parse(savedDotacions);
  }

  // Afegir events per tancar i afegir
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);
  addDotacioBtn?.addEventListener("click", addDotacio);

  // Tanca el modal si es fa clic fora del contingut
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) {
      closeDotacioModal();
    }
  });

  // Mostra les dotacions a l'obrir
  displayDotacioOptions();
}

/**
 * Obre el modal de gestió de dotació.
 */
export function openDotacioModal() {
  if (!dotacioModal) return;
  dotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDotacioOptions();
}

/**
 * Tanca el modal de gestió de dotació.
 */
export function closeDotacioModal() {
  if (!dotacioModal) return;
  dotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/**
 * Mostra la llista de dotacions guardades.
 * Si no n'hi ha, mostra un missatge indicant-ho.
 */
export function displayDotacioOptions() {
  if (!dotacioOptionsContainer) return;
  dotacioOptionsContainer.innerHTML = "";

  // Mostra el missatge de "No hay dotaciones guardadas" si la llista està buida
  const noDotacioText = document.getElementById("no-dotacio-text");
  if (dotacions.length === 0) {
    noDotacioText?.classList.remove("hidden");
    return;
  } else {
    noDotacioText?.classList.add("hidden");
  }

  dotacions.forEach((dotacio, index) => {
    // Crea l'element per a cada dotació
    const dotacioItem = document.createElement("div");
    dotacioItem.classList.add("dotacio-item");

    // Contingut de la dotació: "Número - Conductor y Ayudante"
    const infoSpan = document.createElement("span");
    infoSpan.classList.add("dotacio-info");
    infoSpan.textContent = `${dotacio.numero} - ${dotacio.conductor} y ${dotacio.ayudante}`;

    // Botó per eliminar la dotació
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("dotacio-delete");
    deleteBtn.setAttribute("aria-label", "Eliminar dotación");
    deleteBtn.innerHTML = `<img src="assets/icons/delete.svg" alt="Eliminar" class="icon" />`;

    deleteBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      deleteDotacio(index);
    });

    dotacioItem.appendChild(infoSpan);
    dotacioItem.appendChild(deleteBtn);
    dotacioOptionsContainer.appendChild(dotacioItem);
  });
}

/**
 * Afegeix una nova dotació.
 * En aquest exemple s'utilitzen prompts per obtenir les dades.
 * En una aplicació real, és millor utilitzar un formulari propi.
 */
function addDotacio() {
  const numero = prompt("Ingrese el número de la dotación:");
  if (!numero) return;
  const conductor = prompt("Ingrese el nombre del conductor:");
  if (!conductor) return;
  const ayudante = prompt("Ingrese el nombre del ayudante:");
  if (!ayudante) return;

  const novaDotacio = {
    numero: numero.trim(),
    conductor: conductor.trim(),
    ayudante: ayudante.trim(),
  };

  dotacions.push(novaDotacio);
  saveDotacions();
  displayDotacioOptions();
}

/**
 * Elimina la dotació a l'índex donat.
 */
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  displayDotacioOptions();
}

/**
 * Desa les dotacions a localStorage.
 */
function saveDotacions() {
  localStorage.setItem("dotacions", JSON.stringify(dotacions));
}
