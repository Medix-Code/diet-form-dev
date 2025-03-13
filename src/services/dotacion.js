/**
 * Lògica per a la gestió de dotacions.
 * Una dotació es compon d'un número (aquí considerem "Vehículo") i dos noms (Conductor i Ayudante).
 * Aquest mòdul s'encarrega d'obrir/tancar el modal de dotació, mostrar la llista,
 * afegir noves dotacions i eliminar-les.
 */

// Array per emmagatzemar les dotacions
let dotacions = [];
let openAddDotacioBtn;
let addDotacioModal;
let closeAddDotacioBtn;

// Referències als elements del DOM
let openDotacioBtn;
let dotacioModal;
let dotacioOptionsContainer;
let closeDotacioBtn;
let dotacioForm; // El formulari per afegir dotació

/**
 * Inicialitza el mòdul de dotacions.
 * Configura els elements del modal i carrega les dotacions des de localStorage.
 */
export function initDotacion() {
  openDotacioBtn = document.getElementById("open-dotacio-modal");
  dotacioModal = document.getElementById("dotacio-modal");
  dotacioOptionsContainer = document.getElementById("dotacio-options");
  closeDotacioBtn = document.getElementById("close-dotacio-modal");
  openAddDotacioBtn = document.getElementById("open-add-dotacio-modal");
  addDotacioModal = document.getElementById("add-dotacio-modal");
  closeAddDotacioBtn = document.getElementById("close-add-dotacio-modal");
  dotacioForm = document.getElementById("dotacio-form");

  if (!dotacioModal || !dotacioOptionsContainer) {
    console.warn("No s'han trobat els elements del modal de dotació.");
    return;
  }

  // Assignem l'esdeveniment per obrir el modal de gestió de dotacions
  if (openDotacioBtn) {
    openDotacioBtn.addEventListener("click", openDotacioModal);
  }

  // Assignem event listener per tancar el modal de gestió de dotacions
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // Assignem l'esdeveniment per obrir el modal d'afegir dotació
  if (openAddDotacioBtn) {
    openAddDotacioBtn.addEventListener("click", openAddDotacioModal);
  }

  // Assignem event listener per tancar el modal d'afegir dotació
  closeAddDotacioBtn?.addEventListener("click", closeAddDotacioModal);

  // Assignem l'event submit del formulari per afegir una nova dotació
  if (dotacioForm) {
    dotacioForm.addEventListener("submit", addDotacioFromForm);
  }

  // Tanca el modal si es fa clic fora del contingut
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) {
      closeDotacioModal();
    }
    if (evt.target === addDotacioModal) {
      closeAddDotacioModal();
    }
  });

  // Carrega les dotacions guardades
  const savedDotacions = localStorage.getItem("dotacions");
  if (savedDotacions) {
    dotacions = JSON.parse(savedDotacions);
  }

  // Mostra les dotacions a l'obrir
  displayDotacioOptions();
}

/**
 * Obre el modal de gestió de dotació.
 */
function openAddDotacioModal() {
  if (!addDotacioModal) return;
  addDotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
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

    // Contingut de la dotació: "Vehículo - Conductor y Ayudante"
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
 * Afegeix una nova dotació a partir dels valors del formulari.
 */
function addDotacioFromForm(event) {
  event.preventDefault(); // Evita el comportament per defecte del formulari

  const vehiculo = document.getElementById("dotacio-vehiculo").value;
  const conductor = document.getElementById("dotacio-conductor").value;
  const ayudante = document.getElementById("dotacio-ayudante").value;

  if (!vehiculo || !conductor || !ayudante) {
    alert("Por favor, completa tots els camps.");
    return;
  }

  const novaDotacio = {
    numero: vehiculo.trim(),
    conductor: conductor.trim(),
    ayudante: ayudante.trim(),
  };

  dotacions.push(novaDotacio);
  saveDotacions();
  displayDotacioOptions();
  dotacioForm.reset(); // Neteja el formulari
  closeAddDotacioModal(); // Tanca el modal d'afegir dotació
  openDotacioModal(); // Torna a obrir el modal de gestió de dotacions
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
