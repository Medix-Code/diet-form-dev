// js/mainButtons.js

import { generateAndDownloadPdf } from "./pdf.js";
import { onClickSaveDiet } from "./diet.js";
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
