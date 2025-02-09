/**
 * Botó per netejar el servei seleccionat
 */

import {
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

  // Actualitza el botó directament
  const serviceColors = ["service-1", "service-2", "service-3", "service-4"];
  clearBtn.className = `clear-selected-btn ${
    serviceColors[getCurrentServiceIndex()]
  }`;

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
