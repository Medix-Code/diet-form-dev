/* cameraOcr.js
   Exemple amb un sol botó de càmera i un sol input de fitxer.
   En funció del text OCR, omple:
     - Camps d'hores (origin-time, destination-time, end-time)
     - Camps de servei (service-number, origin, destination)
*/
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraGalleryModal = document.getElementById("camera-gallery-modal");
  const optionCameraBtn = document.getElementById("option-camera");
  const optionGalleryBtn = document.getElementById("option-gallery");
  const cameraInput = document.getElementById("camera-input");

  // Si falten elements, sortim
  if (!cameraBtn || !cameraInput || !cameraGalleryModal) {
    console.warn("[cameraOcr] Botons o modal no trobats.");
    return;
  }

  // Quan cliquem el botó principal, obrim el modal
  cameraBtn.addEventListener("click", () => {
    cameraGalleryModal.classList.remove("hidden");
  });

  // Detectar clics a qualsevol lloc i tancar el modal si el clic NO és dins
  document.addEventListener("click", (event) => {
    if (
      !modalContent.contains(event.target) && // Si el clic no és dins del modal
      !cameraBtn.contains(event.target) // I tampoc al botó d'obrir-lo
    ) {
      cameraGalleryModal.classList.add("hidden");
    }
  });

  // Al clicar "Cámara"
  optionCameraBtn.addEventListener("click", () => {
    cameraInput.setAttribute("capture", "environment");
    cameraInput.value = "";
    cameraInput.click();
    cameraGalleryModal.classList.add("hidden");
  });

  // Al clicar "Galería"
  optionGalleryBtn.addEventListener("click", () => {
    cameraInput.removeAttribute("capture");
    cameraInput.value = "";
    cameraInput.click();
    cameraGalleryModal.classList.add("hidden");
  });

  // Quan seleccionem (o fem la foto)
  cameraInput.addEventListener("change", async (event) => {
    // ... [Resta de codi OCR, igual que abans] ...
  });
}

/**
 * Analitza el text OCR i omple:
 *   - Camps d'hores (origin-time, destination-time, end-time)
 *   - Camps de servei (service-number, origin, destination)
 *
 * Cada foto ha de contenir només un tipus de dades.
 */
function fillFormFieldsFromOcr(ocrText) {
  const textLower = ocrText.toLowerCase();
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Comprovem si hi ha dades d'hores
  const hasTimeData =
    /status:\s*mobilitzat/.test(textLower) ||
    /status:\s*arribada\s+hospital/.test(textLower) ||
    /altech\s+v\./.test(textLower);

  // Comprovem si hi ha dades de servei (només si no es detecta informació d'hores)
  // Ara el número de servei és un bloc de 9-10 dígits, i es busca també "municipi" o "hospital desti"
  const hasServiceData =
    !hasTimeData &&
    (/\b\d{9,10}\b/.test(textLower) ||
      /municipi/.test(textLower) ||
      /hospital\s*desti/.test(textLower));

  if (hasTimeData) {
    fillTimes(textLower, suffix);
    showToast("Dades d'hores omplertes!", "success");
  } else if (hasServiceData) {
    fillServiceData(textLower, suffix);
    showToast("Dades de servei omplertes!", "success");
  } else {
    showToast("No s'ha detectat informació per omplir.", "error");
  }
}

/* -----------------------------------------
   Funció per omplir camps d'Hores
----------------------------------------- */
function fillTimes(processedText, suffix) {
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  // 1) Hora d'origen: utilitzem "status: mobilitzat"
  const mobilitzatMatch = processedText.match(
    /s?t?a?t?u?s?:?\s*mobil\w*\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (mobilitzatMatch?.[1]) {
    document.getElementById(`origin-time-${suffix}`).value = normalizeTime(
      mobilitzatMatch[1]
    );
  }

  // 2) Hora de destinació: "status: arribada hospital"
  const arribadaMatch = processedText.match(
    /s?t?a?t?u?s?:?\s*a?r?r?i?b?a?d?a?\s+h?o?s?p?i?t?a?l?\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (arribadaMatch?.[1]) {
    document.getElementById(`destination-time-${suffix}`).value = normalizeTime(
      arribadaMatch[1]
    );
  }

  // 3) Hora final: "altech"
  let endMatch = processedText.match(
    /altech\s*[^\n]*\s*\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (!endMatch) {
    endMatch = processedText.match(
      /altech\s*[^\n]*\n\s*\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
    );
  }

  if (endMatch?.[1]) {
    document.getElementById(`end-time-${suffix}`).value = normalizeTime(
      endMatch[1]
    );
  } else {
    // Fallback: si no es troba l'hora final, usem l'hora actual
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById(`end-time-${suffix}`).value = `${hh}:${mm}`;
  }
}

/* -----------------------------------------
   Funció per omplir camps de Servei (Nº, Origen, Destinació)
----------------------------------------- */
function fillServiceData(processedText, suffix) {
  // 1) Número de servei sota "Afectats"
  const serviceNumberMatch = processedText.match(
    /afectats\s*(?:\r?\n)+\s*(\d{9})/i
  );
  const serviceNumber = serviceNumberMatch?.[1] || "000000000";
  document.getElementById(`service-number-${suffix}`).value = serviceNumber;

  // 2) Origen: Captura TOT el text entre "Municipi" i "SubMunicipi 2"

  const originMatch = processedText.match(/municipi\s*(?:\r?\n)+\s*(.*)/i);
  if (originMatch?.[1]) {
    // Substituïm salts de línia per espais, si vols que quedi més net
    const originClean = originMatch[1].replace(/\r?\n+/g, " ").trim();
    document.getElementById(`origin-${suffix}`).value = originClean;
  } else {
    console.warn(
      `[OCR] No s'ha trobat l'origen entre "Municipi" i "SubMunicipi 2"`
    );
  }

  // 3) Destinació sota "Hospital Desti"
  const destinationMatch = processedText.match(
    /hospital\s*desti\s*(?:\r?\n)+\s*(.*)/i
  );
  if (destinationMatch?.[1]) {
    document.getElementById(`destination-${suffix}`).value =
      destinationMatch[1].trim();
  } else {
    console.warn(`[OCR] No s'ha trobat la destinació`);
  }
}
