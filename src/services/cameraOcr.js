/* cameraOcr.js
   Ejemplo con un solo botón de cámara y un solo input de archivo.
   En función del texto OCR, rellena:
     - Campos de horas (origin-time, destination-time, end-time)
     - Campos de servicio (service-number, origin, destination)
*/

import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

/**
 * Inicializa la lógica de OCR con un botón y un modal personalizado.
 */
export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraGalleryModal = document.getElementById("camera-gallery-modal");
  const modalContent = cameraGalleryModal.querySelector(
    ".modal-bottom-content"
  );
  const optionCameraBtn = document.getElementById("option-camera");
  const optionGalleryBtn = document.getElementById("option-gallery");
  const cameraInput = document.getElementById("camera-input");

  // Comprovem que tots els elements existeixin
  if (!cameraBtn || !cameraInput || !cameraGalleryModal || !modalContent) {
    console.warn("[cameraOcr] Falten elements per inicialitzar.");
    return;
  }

  function openModal() {
    // 1) Traiem .hidden per mostrar-lo de nou en el flux
    cameraGalleryModal.classList.remove("hidden");
    // 2) Forcem reflow i afegim .visible per iniciar la transició
    requestAnimationFrame(() => {
      cameraGalleryModal.classList.add("visible");
    });
  }

  function closeModal() {
    // 1) Traiem .visible per iniciar la transició de sortida
    cameraGalleryModal.classList.remove("visible");

    // 2) Esperem uns 300ms (mateix temps que transition: 0.3s) i afegim .hidden
    setTimeout(() => {
      cameraGalleryModal.classList.add("hidden");
    }, 300);
  }

  // 1) Obrir modal en fer clic al botó principal
  cameraBtn.addEventListener("click", openModal);

  // 2) Escoltar clics al document per tancar si fem clic fora
  optionCameraBtn.addEventListener("click", closeModal);
  optionGalleryBtn.addEventListener("click", closeModal);

  document.addEventListener("click", (e) => {
    if (
      cameraGalleryModal.classList.contains("visible") &&
      !modalContent.contains(e.target) &&
      !cameraBtn.contains(e.target)
    ) {
      closeModal();
    }
  });

  // 3) Quan fem clic als botons internes del modal, el tanquem
  [optionCameraBtn, optionGalleryBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
      cameraGalleryModal.classList.remove("visible");
      cameraGalleryModal.classList.add("hidden");
    });
  });

  // 4) Lògica de càmera i galeria
  optionCameraBtn.addEventListener("click", () => {
    cameraInput.setAttribute("capture", "environment");
    cameraInput.value = "";
    cameraInput.click();
  });

  optionGalleryBtn.addEventListener("click", () => {
    cameraInput.removeAttribute("capture");
    cameraInput.value = "";
    cameraInput.click();
  });

  // 5) Quan l'usuari selecciona/toma la foto => OCR
  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn("[cameraOcr] No hi ha fitxer seleccionat.");
      showToast("No se ha seleccionado ninguna imagen", "error");
      return;
    }

    // Elements per a la barra de progrés
    const progressContainer = document.getElementById("ocr-progress-container");
    const progressBar = document.getElementById("ocr-progress");
    const progressText = document.getElementById("ocr-progress-text");

    if (progressContainer && progressBar && progressText) {
      progressContainer.classList.remove("hidden");
      progressBar.value = 0;
      progressText.textContent = "Escanejant...";
    }

    try {
      showToast("Procesando imagen...", "info");
      console.log("[cameraOcr] Procesando OCR...");

      const result = await window.Tesseract.recognize(file, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progressPercent = Math.floor(m.progress * 100);
            if (progressBar) progressBar.value = progressPercent;
            if (progressText)
              progressText.textContent = `Escanejant ${progressPercent}%`;
          }
        },
      });

      const ocrText = result.data.text;
      if (!ocrText) {
        showToast("No se ha detectado texto en la imagen", "error");
        return;
      }

      fillFormFieldsFromOcr(ocrText);
      showToast("OCR completado con éxito", "success");
    } catch (error) {
      console.error("[cameraOcr] Error en OCR:", error);
      showToast("Error al procesar la imagen: " + error.message, "error");
    } finally {
      cameraInput.value = "";
      if (progressContainer && progressBar) {
        progressBar.value = 100;
        setTimeout(() => {
          progressContainer.classList.add("hidden");
        }, 1000);
      }
    }
  });
}

/**
 * Analiza el texto OCR y rellena:
 *   - Campos de horas (origin-time, destination-time, end-time)
 *   - Campos de servicio (service-number, origin, destination)
 *
 * Cada foto debe contener solo un tipo de datos.
 */
function fillFormFieldsFromOcr(ocrText) {
  const textLower = ocrText.toLowerCase();
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Comprobamos si hay datos de horas
  const hasTimeData =
    /status:\s*mobilitzat/.test(textLower) ||
    /status:\s*arribada\s+hospital/.test(textLower) ||
    /altech\s+v\./.test(textLower);

  // Comprobamos si hay datos de servicio (solo si no se detectan datos de horas)
  const hasServiceData =
    !hasTimeData &&
    (/\b\d{9,10}\b/.test(textLower) ||
      /municipi/.test(textLower) ||
      /hospital\s*desti/.test(textLower));

  if (hasTimeData) {
    fillTimes(textLower, suffix);
    showToast("¡Datos de horas completados!", "success");
  } else if (hasServiceData) {
    fillServiceData(textLower, suffix);
    showToast("¡Datos de servicio completados!", "success");
  } else {
    showToast("No se ha detectado información para completar.", "error");
  }
}

/**
 * Rellena los campos de horas:
 *   - origin-time, destination-time, end-time
 */
function fillTimes(processedText, suffix) {
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  // 1) Hora de origen: usamos "status: mobilitzat"
  const mobilitzatMatch = processedText.match(
    /s?t?a?t?u?s?:?\s*mobil\w*\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (mobilitzatMatch?.[1]) {
    document.getElementById(`origin-time-${suffix}`).value = normalizeTime(
      mobilitzatMatch[1]
    );
  }

  // 2) Hora de destino: "status: arribada hospital"
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
    // Si no se encuentra la hora final, usamos la hora actual
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById(`end-time-${suffix}`).value = `${hh}:${mm}`;
  }
}

/**
 * Rellena los campos de servicio (Nº, Origen, Destino)
 */
function fillServiceData(processedText, suffix) {
  // 1) Nº de servicio bajo "Afectats"
  const serviceNumberMatch = processedText.match(
    /afectats\s*(?:\r?\n)+\s*(\d{9})/i
  );
  const serviceNumber = serviceNumberMatch?.[1] || "000000000";
  document.getElementById(`service-number-${suffix}`).value = serviceNumber;

  // 2) Origen: Capturamos todo el texto tras "Municipi"
  const originMatch = processedText.match(/municipi\s*(?:\r?\n)+\s*(.*)/i);
  if (originMatch?.[1]) {
    const originClean = originMatch[1].replace(/\r?\n+/g, " ").trim();
    document.getElementById(`origin-${suffix}`).value = originClean;
  } else {
    console.warn(
      `[OCR] No se ha encontrado el origen entre "Municipi" y "SubMunicipi 2"`
    );
  }

  // 3) Destino bajo "Hospital Desti"
  const destinationMatch = processedText.match(
    /hospital\s*desti\s*(?:\r?\n)+\s*(.*)/i
  );
  if (destinationMatch?.[1]) {
    document.getElementById(`destination-${suffix}`).value =
      destinationMatch[1].trim();
  } else {
    console.warn(`[OCR] No se ha encontrado el destino`);
  }
}
