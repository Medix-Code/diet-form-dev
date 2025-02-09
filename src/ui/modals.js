/* modalDiet.js o similar */

import { loadDietById, deleteDietHandler } from "../services/dietService.js";
import { getDietDisplayInfo, capitalizeFirstLetter } from "../utils/utils.js";
import { getAllDiets } from "../db/indexedDbDietRepository.js";

/**
 * Setup general dels modals (about, etc.)
 */
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

/**
 * Obrir el modal de gestió de dietes
 */
export function openDietModal() {
  const dietModal = document.getElementById("diet-modal");
  if (!dietModal) return;
  dietModal.style.display = "block";
  document.body.classList.add("modal-open");
  displayDietOptions();
}

/**
 * Tancar el modal de gestió de dietes
 */
export function closeDietModal() {
  const dietModal = document.getElementById("diet-modal");
  if (dietModal) {
    dietModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

/**
 * Mostrar les dietes guardades, tot en una línia (text a esquerra + 2 icones a dreta)
 */
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

    // Contenidor de la dieta (una línia)
    const dietItem = document.createElement("div");
    dietItem.classList.add("diet-item");

    // Span text: "fecha - comida/cena"
    const dateSpan = document.createElement("span");
    dateSpan.classList.add("diet-date");
    dateSpan.textContent = `${ddmmaa} - ${capitalizeFirstLetter(franjaText)}`;

    // Contenidor d'icones (carregar + eliminar)
    const iconsContainer = document.createElement("div");
    iconsContainer.classList.add("diet-icons");

    // Botó "Eliminar"
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("diet-delete");
    deleteBtn.setAttribute("aria-label", "Eliminar dieta");
    deleteBtn.innerHTML = `<img src="assets/icons/delete.svg" alt="Eliminar" class="icon" />`;

    // Botó "Carregar"
    const loadBtn = document.createElement("button");
    loadBtn.classList.add("diet-load");
    loadBtn.setAttribute("aria-label", "Cargar dieta");
    loadBtn.innerHTML = `<img src="assets/icons/upload.svg" alt="Cargar" class="icon" />`;

    // Event: Carregar la dieta
    loadBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      const confirmTitle = "Cargar dieta";
      const confirmMessage = `¿Quieres cargar la dieta de la ${franjaText} del ${ddmmaa}?`;
      showConfirmModal(confirmMessage, confirmTitle).then((yes) => {
        if (yes) loadDietById(diet.id);
      });
    });

    // Event: Eliminar la dieta
    deleteBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      deleteDietHandler(diet.id, diet.date, diet.dietType);
    });

    // Muntem
    iconsContainer.appendChild(deleteBtn);
    iconsContainer.appendChild(loadBtn);

    dietItem.appendChild(dateSpan);
    dietItem.appendChild(iconsContainer);

    dietOptionsList.appendChild(dietItem);
  });
}

/**
 * Mostra un modal de confirmació (reutilitzable) i retorna una Promise<boolean>
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
