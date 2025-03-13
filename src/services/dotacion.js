/**
 * Mòdul per a la gestió de dotacions:
 * - Veure la llista de dotacions en el modal principal (dotacio-modal).
 * - Afegir noves dotacions en un modal secundari (add-dotacio-modal).
 * - Eliminar dotacions existents.
 */

let dotacions = []; // Array de dotacions guardades
let dotacioModal, dotacioOptionsContainer, closeDotacioBtn;
let openAddDotacioBtn, addDotacioModal, closeAddDotacioBtn;
let dotacioForm; // Formulari per afegir una nova dotació

/* ──────────────────────────────
   1) Modal principal de gestió
─────────────────────────────────*/

/**
 * Obre el modal principal (dotacio-modal) i actualitza la llista de dotacions.
 */
function openDotacioModal() {
  if (!dotacioModal) return;
  dotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDotacioOptions();
}

/**
 * Tanca el modal principal (dotacio-modal).
 */
function closeDotacioModal() {
  if (!dotacioModal) return;
  dotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/**
 * Obre el modal secundari per afegir una nova dotació.
 */
function openAddDotacioModal() {
  if (!addDotacioModal) return;
  addDotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
}

/**
 * Tanca el modal secundari d’afegir dotació.
 */
function closeAddDotacioModal() {
  if (!addDotacioModal) return;
  addDotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/**
 * Carrega les dotacions guardades a localStorage i les desarà a `dotacions`.
 */
function loadDotacionsFromStorage() {
  const saved = localStorage.getItem("dotacions");
  if (saved) {
    dotacions = JSON.parse(saved);
  } else {
    dotacions = [];
  }
}

/**
 * Mostra les dotacions al modal principal.
 * Si no n’hi ha cap, mostra un missatge "No hay dotaciones".
 */
export function displayDotacioOptions() {
  if (!dotacioOptionsContainer) return;

  // Neteja la llista
  dotacioOptionsContainer.innerHTML = "";

  // Comprovem si no hi ha dotacions
  const noDotacioText = document.getElementById("no-dotacio-text");
  if (dotacions.length === 0) {
    noDotacioText?.classList.remove("hidden");
    return;
  }
  // Si n’hi ha, amaguem el missatge de "sense dotacions"
  noDotacioText?.classList.add("hidden");

  // Pintem cada dotació
  dotacions.forEach((dotacio, index) => {
    const item = document.createElement("div");
    item.classList.add("dotacio-item");

    const infoSpan = document.createElement("span");
    infoSpan.classList.add("dotacio-info");
    infoSpan.textContent = `${dotacio.numero} - ${dotacio.conductor} y ${dotacio.ayudante}`;

    // Botó d’eliminar
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("dotacio-delete");
    deleteBtn.setAttribute("aria-label", "Eliminar dotación");
    deleteBtn.innerHTML = `<img src="assets/icons/delete.svg" alt="Eliminar" class="icon" />`;

    deleteBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      deleteDotacio(index);
    });

    item.appendChild(infoSpan);
    item.appendChild(deleteBtn);
    dotacioOptionsContainer.appendChild(item);
  });
}

/**
 * Elimina la dotació a l'índex especificat, desa i actualitza la llista.
 */
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  displayDotacioOptions();
}

/**
 * Desa les dotacions actuals a localStorage.
 */
function saveDotacions() {
  localStorage.setItem("dotacions", JSON.stringify(dotacions));
}

/**
 * Processa el formulari d’afegir dotació (event "submit").
 * Afegeix la dotació al llistat i actualitza la vista.
 */
function addDotacioFromForm(e) {
  e.preventDefault(); // Evitem el comportament per defecte (submit de formulari)

  const vehiculo = document.getElementById("dotacio-vehiculo")?.value.trim();
  const conductor = document.getElementById("dotacio-conductor")?.value.trim();
  const ayudante = document.getElementById("dotacio-ayudante")?.value.trim();

  if (!vehiculo || !conductor || !ayudante) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Creem la nova dotació
  const novaDotacio = {
    numero: vehiculo,
    conductor: conductor,
    ayudante: ayudante,
  };

  // L'afegim al nostre array, el desem i actualitzem
  dotacions.push(novaDotacio);
  saveDotacions();

  // Neteja formulari
  dotacioForm?.reset();

  // Tanquem el modal d’afegir i tornem a obrir el modal principal
  closeAddDotacioModal();
  openDotacioModal();
}

/**
 * Inicialitza la lògica de dotacions.
 */
export function initDotacion() {
  // Referències als elements del DOM
  const openDotacioBtn = document.getElementById("open-dotacio-modal"); // Botó per obrir el modal de gestió
  dotacioModal = document.getElementById("dotacio-modal");
  dotacioOptionsContainer = document.getElementById("dotacio-options");
  closeDotacioBtn = document.getElementById("close-dotacio-modal");

  openAddDotacioBtn = document.getElementById("open-add-dotacio-modal");
  addDotacioModal = document.getElementById("add-dotacio-modal");
  closeAddDotacioBtn = document.getElementById("close-add-dotacio-modal");
  dotacioForm = document.getElementById("dotacio-form");

  // Comprovem que els elements bàsics existeixin
  if (!dotacioModal || !dotacioOptionsContainer) {
    console.warn("Elements de dotació no trobats al DOM.");
    return;
  }

  // Assignem events:
  // 1) Obrir el modal principal
  openDotacioBtn?.addEventListener("click", openDotacioModal);
  // 2) Tancar el modal principal
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // 3) Obrir el modal "afegir dotació"
  openAddDotacioBtn?.addEventListener("click", openAddDotacioModal);
  // 4) Tancar el modal "afegir dotació"
  closeAddDotacioBtn?.addEventListener("click", closeAddDotacioModal);

  // 5) Submit del formulari per afegir dotació
  dotacioForm?.addEventListener("submit", addDotacioFromForm);

  // Si es fa clic fora dels modals, els tanquem (si cal)
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) {
      closeDotacioModal();
    } else if (evt.target === addDotacioModal) {
      closeAddDotacioModal();
    }
  });

  // Carreguem les dotacions del localStorage (si n’hi ha)
  loadDotacionsFromStorage();

  // Actualitzem la llista en obrir l'aplicació
  displayDotacioOptions();
}
