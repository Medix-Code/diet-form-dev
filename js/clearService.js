// js/clearService.js

import {
  updateClearButtonColor,
  getCurrentServiceIndex,
  clearServiceFields,
} from "./services.js";
import { removeErrorClasses, checkIfFormChanged } from "./formHandlers.js";

/**
 * Configura el botó per netejar el servei seleccionat.
 */
export function setupClearSelectedService() {
  const clearBtn = document.getElementById("clear-selected-service");
  const allServices = document.querySelectorAll(".service");
  if (!clearBtn || !allServices.length) return;

  updateClearButtonColor(clearBtn, getCurrentServiceIndex());
  clearBtn.addEventListener("click", () => {
    const index = getCurrentServiceIndex();
    const activeService = allServices[index];
    if (activeService) {
      clearServiceFields(activeService);
      removeErrorClasses(activeService);
      checkIfFormChanged();
    }
  });
}
