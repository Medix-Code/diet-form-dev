/**
 * Lògica de modals
 */

import { loadDietById, deleteDietHandler } from "../services/dietService.js";
import { getDietDisplayInfo, capitalizeFirstLetter } from "../utils/utils.js";
import { getAllDiets } from "../db/indexedDbDietRepository.js";

export function setupModalGenerics() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    const modalId = modal.id;
    const triggerSelector = `[href="#${modalId}"]`;
    const closeBtns = modal.querySelectorAll(".close-modal, .close-modal-btn");

    document.querySelectorAll(triggerSelector).forEach((trig) => {
      trig.addEventListener("click", (evt) => {
        evt.preventDefault();
        openGenericModal(modal);
      });
    });

    closeBtns.forEach((b) => {
      b.addEventListener("click", () => {
        closeGenericModal(modal);
      });
    });

    window.addEventListener("click", (evt) => {
      if (evt.target === modal) {
        closeGenericModal(modal);
      }
    });
  });
}

export function openGenericModal(modal) {
  modal.style.display = "block";
  document.body.classList.add("modal-open");
}

function closeGenericModal(modal) {
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

export function openDietModal() {
  const dietModal = document.getElementById("diet-modal");
  if (!dietModal) return;
  dietModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDietOptions();
}

export function closeDietModal() {
  const dietModal = document.getElementById("diet-modal");
  if (dietModal) {
    dietModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

export async function displayDietOptions() {
  const dietOptionsList = document.getElementById("diet-options");
  const noDietsText = document.getElementById("no-diets-text");
  dietOptionsList.innerHTML = "";

  const savedDiets = await getAllDiets();
  if (!savedDiets || !savedDiets.length) {
    dietOptionsList.classList.add("hidden");
    noDietsText.classList.remove("hidden");
    return;
  }

  dietOptionsList.classList.remove("hidden");
  noDietsText.classList.add("hidden");

  savedDiets.forEach((diet) => {
    const { ddmmaa, franjaText } = getDietDisplayInfo(diet.date, diet.dietType);

    // Creem l'element contenedor per la dieta amb la nova estructura
    const dietItem = document.createElement("div");
    dietItem.classList.add("diet-item");

    // Creem la part del resum, que mostrarà la data i la franja horària
    const summary = document.createElement("div");
    summary.classList.add("diet-summary");
    summary.innerHTML = `
      <span>
        <i class="fas fa-calendar-alt" style="color:#7e0101; margin-right:5px;"></i>
        ${ddmmaa} - ${capitalizeFirstLetter(franjaText)}
      </span>
    `;

    // Creem el contenidor d'accions (inicialment ocult)
    const actions = document.createElement("div");
    actions.classList.add("diet-actions");
    actions.innerHTML = `
      <button type="button" class="diet-load">
        <i class="icon-load"></i> Carregar
      </button>
      <button type="button" class="diet-delete">
        <i class="icon-delete"></i> Eliminar
      </button>
    `;

    // Insertem el resum i el contenidor d'accions dins de dietItem
    dietItem.appendChild(summary);
    dietItem.appendChild(actions);

    // Fes que tot l'element diet-item sigui clicable per desplegar/contraure el menú
    summary.addEventListener("click", () => {
      dietItem.classList.toggle("expanded");
    });

    // Botó "Carregar": sol·licita confirmació i carrega la dieta
    const loadButton = actions.querySelector(".diet-load");
    loadButton.addEventListener("click", (evt) => {
      evt.stopPropagation();
      const confirmTitle = "Cargar dieta";
      const confirmMessage = `¿Quieres cargar la dieta de la ${franjaText} del ${ddmmaa}?`;
      showConfirmModal(confirmMessage, confirmTitle).then((yes) => {
        if (yes) loadDietById(diet.id);
      });
    });

    // Botó "Eliminar": crida la funció per eliminar la dieta
    const deleteButton = actions.querySelector(".diet-delete");
    deleteButton.addEventListener("click", (evt) => {
      evt.stopPropagation();
      deleteDietHandler(diet.id, diet.date, diet.dietType);
    });

    dietOptionsList.appendChild(dietItem);
  });
}

/**
 * Mostra un modal de confirmació i retorna una Promise<boolean>
 */
export function showConfirmModal(message, title = "Confirmar acció") {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const msgEl = document.getElementById("confirm-message");
    const titleEl = modal.querySelector(".modal-title");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    titleEl.textContent = title;
    msgEl.textContent = message;

    modal.style.display = "block";
    document.body.classList.add("modal-open");
    yesBtn.focus();

    function closeModal() {
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
      window.removeEventListener("click", outsideClick);
      document.removeEventListener("keydown", trapFocus);
    }

    function onYes() {
      resolve(true);
      closeModal();
    }

    function onNo() {
      resolve(false);
      closeModal();
    }

    function outsideClick(evt) {
      if (evt.target === modal) {
        resolve(false);
        closeModal();
      }
    }

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
    window.addEventListener("click", outsideClick);

    function trapFocus(evt) {
      const focusables = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (evt.key === "Tab") {
        if (evt.shiftKey && document.activeElement === first) {
          evt.preventDefault();
          last.focus();
        } else if (!evt.shiftKey && document.activeElement === last) {
          evt.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", trapFocus, { once: true });
  });
}
