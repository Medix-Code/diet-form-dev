/**
 * Mòdul de gestió de dotacions.
 */
import {
  getSignatureDotacioConductor,
  getSignatureDotacioAyudante,
  clearDotacioSignatures, // <-- Funció opcional per netejar firmes del modal
  setSignatureConductor,
  setSignatureAjudant,
  updateSignatureIcons,
} from "../services/signatureService.js";

let dotacions = []; // array local (dades a localStorage)

let dotacioModal, dotacioOptionsContainer, closeDotacioBtn;
let openAddDotacioBtn, addDotacioModal, closeAddDotacioBtn;
let dotacioForm;

/* ──────────────────────────────────────────
       Funcions per obrir/tancar modal principal
     ──────────────────────────────────────────*/
export function openDotacioModal() {
  dotacioModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDotacioOptions();
}

function closeDotacioModal() {
  dotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/* ────────────────────────────────────────────
       Funcions per obrir/tancar modal "add dotació"
     ────────────────────────────────────────────*/
function openAddDotacioModal() {
  // Obrim el modal d’afegir
  addDotacioModal.style.display = "block";
  document.body.classList.add("modal-open");

  // (Opcional) Netejar camps i signatures si ho desitges
  dotacioForm.reset();
  // Pots també netejar firmes del modal:
  clearDotacioSignatures();
}

function closeAddDotacioModal() {
  addDotacioModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

/* ──────────────────────────────────────────
       Carregar / Desar al localStorage
     ──────────────────────────────────────────*/
function loadDotacionsFromStorage() {
  const saved = localStorage.getItem("dotacions");
  dotacions = saved ? JSON.parse(saved) : [];
}

function saveDotacions() {
  localStorage.setItem("dotacions", JSON.stringify(dotacions));
}

/* ──────────────────────────────────────────
       Eliminar i "Carregar" dotació
     ──────────────────────────────────────────*/
function deleteDotacio(index) {
  dotacions.splice(index, 1);
  saveDotacions();
  displayDotacioOptions();
}

function loadDotacio(index) {
  const selected = dotacions[index];
  if (!selected) return;

  // Assignem valors al formulari principal "Datos" (pestanya principal)
  document.getElementById("vehicle-number").value = selected.numero || "";
  document.getElementById("person1").value = selected.conductor || "";
  document.getElementById("person2").value = selected.ayudante || "";

  // 1) Carreguem les firmes guardades en el "selected"
  //    i les assignem a "signatureConductor" / "signatureAjudant"
  //    per la pestanya principal:
  setSignatureConductor(selected.firmaConductor || "");
  setSignatureAjudant(selected.firmaAyudante || "");

  // 2) Actualitzem la UI dels botons sign-person1 i sign-person2
  //    a la pestanya principal (icona: signature.svg vs signature_ok.svg)
  updateSignatureIcons();

  closeDotacioModal(); // Tanca el modal
}

/* ──────────────────────────────────────────
       Mostrar la llista dins #dotacio-options
     ──────────────────────────────────────────*/
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

/* ──────────────────────────────────────────
       Formulari "Afegir dotació"
     ──────────────────────────────────────────*/
function addDotacioFromForm(e) {
  e.preventDefault();

  const vehiculo = document.getElementById("dotacio-vehiculo")?.value.trim();
  const conductor = document.getElementById("dotacio-conductor")?.value.trim();
  const ayudante = document.getElementById("dotacio-ayudante")?.value.trim();

  // Obtenim la signatura en base64 per al conductor i l'ajudant (modal dotacio)
  const firmaConductor = getSignatureDotacioConductor();
  const firmaAyudante = getSignatureDotacioAyudante();

  if (!vehiculo || (!conductor && !ayudante)) {
    alert(
      "Si us plau, completa el camp de Vehículo i com a mínim un dels camps (Conductor o Ajudant)."
    );
    return;
  }

  const novaDotacio = {
    numero: vehiculo,
    conductor: conductor,
    ayudante: ayudante,
    firmaConductor, // signatura base64
    firmaAyudante, // signatura base64
  };

  // Afegir a l'array, guardar al localStorage
  dotacions.push(novaDotacio);
  saveDotacions();

  // Reset del formulari (opcionalment netejar firmes)
  dotacioForm.reset();
  clearDotacioSignatures(); // neteja el signatureDotacioConductor i signatureDotacioAyudante

  // Tanca modal "afegir" i reobre el modal principal
  closeAddDotacioModal();
  openDotacioModal();
}

/* ──────────────────────────────────────────
       Inicialització general (initDotacion)
     ──────────────────────────────────────────*/
export function initDotacion() {
  dotacioModal = document.getElementById("dotacio-modal");
  dotacioOptionsContainer = document.getElementById("dotacio-options");
  closeDotacioBtn = document.getElementById("close-dotacio-modal");
  openAddDotacioBtn = document.getElementById("open-add-dotacio-modal");
  addDotacioModal = document.getElementById("add-dotacio-modal");
  closeAddDotacioBtn = document.getElementById("close-add-dotacio-modal");
  dotacioForm = document.getElementById("dotacio-form");

  // Botó principal per obrir modal principal (Gestor de dotacions)
  const openDotacioBtn = document.getElementById("open-dotacio-modal");
  openDotacioBtn?.addEventListener("click", openDotacioModal);

  // Tancar modal principal
  closeDotacioBtn?.addEventListener("click", closeDotacioModal);

  // Obrir modal "Afegir"
  openAddDotacioBtn?.addEventListener("click", openAddDotacioModal);

  // Tancar modal "Afegir"
  closeAddDotacioBtn?.addEventListener("click", closeAddDotacioModal);

  // Submit formulari “Afegir Dotació”
  dotacioForm?.addEventListener("submit", addDotacioFromForm);

  // Tancar si fem clic fora
  window.addEventListener("click", (evt) => {
    if (evt.target === dotacioModal) closeDotacioModal();
    if (evt.target === addDotacioModal) closeAddDotacioModal();
  });

  // Carreguem dotacions existents
  loadDotacionsFromStorage();

  // Pintem la llista
  displayDotacioOptions();
}
