/**
 * Mòdul de gestió de dotacions.
 */
let dotacions = []; // array local
let dotacioModal, dotacioOptionsContainer, closeDotacioBtn;
let openAddDotacioBtn, addDotacioModal, closeAddDotacioBtn;
let dotacioForm;

/* Funcions "open"/"close" modal principal */
export function openDotacioModal() {
  dotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDotacioOptions();
}
function closeDotacioModal() {
  dotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/* Funcions "open"/"close" modal "add dotació" */
function openAddDotacioModal() {
  addDotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
}
function closeAddDotacioModal() {
  addDotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/* Carregar / Desar al localStorage */
function loadDotacionsFromStorage() {
  const saved = localStorage.getItem("dotacions");
  dotacions = saved ? JSON.parse(saved) : [];
}
function saveDotacions() {
  localStorage.setItem("dotacions", JSON.stringify(dotacions));
}

/* Eliminar i "Carregar" dotació */
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  displayDotacioOptions();
}
function loadDotacio(index) {
  const selected = dotacions[index];
  if (!selected) return;

  // Assignem valors al formulari principal
  document.getElementById("vehicle-number").value = selected.numero;
  document.getElementById("person1").value = selected.conductor;
  document.getElementById("person2").value = selected.ayudante;

  closeDotacioModal(); // Tanca el modal
}

/* Mostra la llista dins #dotacio-options */
function displayDotacioOptions() {
  dotacioOptionsContainer.innerHTML = "";
  const noDotacioText = document.getElementById("no-dotacio-text");

  if (dotacions.length === 0) {
    noDotacioText?.classList.remove("hidden");
    return;
  } else {
    noDotacioText?.classList.add("hidden");
  }

  // Agafem el template
  const template = document.getElementById("dotacio-template");
  if (!template) {
    console.warn("No s'ha trobat el template #dotacio-template!");
    return;
  }

  dotacions.forEach((dotacio, index) => {
    // Clonem el <template>
    const clone = template.content.cloneNode(true);

    // Busquem els elements interns
    const itemDiv = clone.querySelector(".dotacio-item");
    const infoSpan = clone.querySelector(".dotacio-info");
    const loadBtn = clone.querySelector(".dotacio-load");
    const deleteBtn = clone.querySelector(".dotacio-delete");

    // Omplim el text
    infoSpan.textContent = `${dotacio.numero} - ${dotacio.conductor} y ${dotacio.ayudante}`;

    // Assignem index (per identificar la dotació)
    loadBtn.dataset.index = index;
    deleteBtn.dataset.index = index;

    // Lliguem events
    loadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadDotacio(parseInt(loadBtn.dataset.index, 10));
    });
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteDotacio(parseInt(deleteBtn.dataset.index, 10));
    });

    // Afegim l'item clonat al DOM
    dotacioOptionsContainer.appendChild(clone);
  });
}

/* Formulari "Afegir dotació" */
function addDotacioFromForm(evt) {
  evt.preventDefault();
  const veh = document.getElementById("dotacio-vehiculo").value.trim();
  const cond = document.getElementById("dotacio-conductor").value.trim();
  const ayud = document.getElementById("dotacio-ayudante").value.trim();

  if (!veh || !cond || !ayud) {
    alert("Completa todos los campos.");
    return;
  }
  dotacions.push({ numero: veh, conductor: cond, ayudante: ayud });
  saveDotacions();

  dotacioForm.reset();
  closeAddDotacioModal();
  openDotacioModal(); // Actualitza la llista
}

/* Inicialització general */
export function initDotacion() {
  // Agafem referències
  dotacioModal = document.getElementById("dotacio-modal");
  dotacioOptionsContainer = document.getElementById("dotacio-options");
  closeDotacioBtn = document.getElementById("close-dotacio-modal");
  openAddDotacioBtn = document.getElementById("open-add-dotacio-modal");
  addDotacioModal = document.getElementById("add-dotacio-modal");
  closeAddDotacioBtn = document.getElementById("close-add-dotacio-modal");
  dotacioForm = document.getElementById("dotacio-form");

  // Botó principal per obrir modal
  const openDotacioBtn = document.getElementById("open-dotacio-modal");
  openDotacioBtn?.addEventListener("click", openDotacioModal);

  // Tancar modal principal
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // Obrir modal "Afegir"
  openAddDotacioBtn?.addEventListener("click", openAddDotacioModal);
  // Tancar modal "Afegir"
  closeAddDotacioBtn?.addEventListener("click", closeAddDotacioModal);

  // Submit formulari
  dotacioForm?.addEventListener("submit", addDotacioFromForm);

  // Tancar clic fora
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) closeDotacioModal();
    if (evt.target === addDotacioModal) closeAddDotacioModal();
  });

  // Carreguem dotacions existents
  loadDotacionsFromStorage();

  // Pintem la llista
  displayDotacioOptions();
}
