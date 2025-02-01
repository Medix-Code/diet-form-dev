/**
 * Botó per netejar el servei seleccionat
 * Abans era "clearService.js"
 */

import {
  updateClearButtonColor,
  getCurrentServiceIndex,
  clearServiceFields,
} from "../services/servicesPanelManager.js";
import {
  removeErrorClasses,
  checkIfFormChanged,
} from "../services/formService.js";

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
