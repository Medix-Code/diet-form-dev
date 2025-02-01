/**
 * Configuració dels botons principals (Generar PDF, Guardar Dieta, Gestionar Dietes)
 */

import { generateAndDownloadPdf } from "../services/pdfService.js";
import { onClickSaveDiet } from "../services/dietService.js";
import { openDietModal } from "./modals.js";

export function setupMainButtons() {
  const generatePdfButton = document.querySelector(".generate-pdf");
  if (generatePdfButton) {
    generatePdfButton.addEventListener("click", generateAndDownloadPdf);
  }

  const saveDietButton = document.getElementById("save-diet");
  if (saveDietButton) {
    saveDietButton.addEventListener("click", onClickSaveDiet);
  }

  const manageDietsButton = document.getElementById("manage-diets");
  if (manageDietsButton) {
    manageDietsButton.addEventListener("click", openDietModal);
  }
}
