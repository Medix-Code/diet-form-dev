/* cameraOcr.js - Codi complet amb optimitzacions per millorar OCR */

import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraGalleryModal = document.getElementById("camera-gallery-modal");
  const modalContent = cameraGalleryModal.querySelector(
    ".modal-bottom-content"
  );
  const optionCameraBtn = document.getElementById("option-camera");
  const optionGalleryBtn = document.getElementById("option-gallery");
  const cameraInput = document.getElementById("camera-input");

  if (!cameraBtn || !cameraInput || !cameraGalleryModal || !modalContent) {
    console.warn("[cameraOcr] Elements no trobats.");
    return;
  }

  cameraBtn.addEventListener("click", openModal);
  document.addEventListener("click", (e) => {
    if (
      cameraGalleryModal.classList.contains("visible") &&
      !modalContent.contains(e.target) &&
      !cameraBtn.contains(e.target)
    ) {
      closeModal();
    }
  });

  [optionCameraBtn, optionGalleryBtn].forEach((btn) =>
    btn.addEventListener("click", closeModal)
  );

  optionCameraBtn.addEventListener("click", () => {
    cameraInput.setAttribute("capture", "environment");
    cameraInput.click();
  });

  optionGalleryBtn.addEventListener("click", () => {
    cameraInput.removeAttribute("capture");
    cameraInput.click();
  });

  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      showToast("No s'ha seleccionat cap imatge.", "error");
      return;
    }

    const progressContainer = document.getElementById("ocr-progress-container");
    const progressBar = document.getElementById("ocr-progress");
    const progressText = document.getElementById("ocr-progress-text");

    progressContainer.classList.remove("hidden");
    progressBar.value = 0;
    progressText.textContent = "Escanejant...";

    try {
      const resizedBlob = await resizeImage(file, 1000);
      const enhancedBlob = await preprocessImage(resizedBlob);

      const result = await Tesseract.recognize(enhancedBlob, "spa", {
        tessedit_pageseg_mode: 3,
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-",
        logger: (m) => {
          if (m.status === "recognizing text") {
            const percent = Math.floor(m.progress * 100);
            progressBar.value = percent;
            progressText.textContent = `Escanejant ${percent}%`;
          }
        },
      });

      const ocrText = result.data.text;
      if (!ocrText.trim()) {
        showToast("No s'ha detectat text.", "error");
        return;
      }

      fillFormFieldsFromOcr(ocrText);
      showToast("OCR completat amb èxit.", "success");
    } catch (error) {
      showToast(`Error OCR: ${error.message}`, "error");
    } finally {
      cameraInput.value = "";
      setTimeout(() => progressContainer.classList.add("hidden"), 1000);
    }
  });

  function openModal() {
    cameraGalleryModal.classList.remove("hidden");
    requestAnimationFrame(() => cameraGalleryModal.classList.add("visible"));
  }

  function closeModal() {
    cameraGalleryModal.classList.remove("visible");
    setTimeout(() => cameraGalleryModal.classList.add("hidden"), 300);
  }
}

// Funció per redimensionar imatge (accelerar OCR)
function resizeImage(file, maxDimension) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height *= maxDimension / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width *= maxDimension / height;
        height = maxDimension;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Millora contrast i escala de grisos
function preprocessImage(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.filter = "brightness(120%) contrast(130%) grayscale(100%)";
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    };
    img.src = URL.createObjectURL(blob);
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
