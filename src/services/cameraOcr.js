/**
 * @file cameraOcr.js
 * @description Gestiona la funcionalitat d'OCR a través de la càmera o galeria,
 * utilitzant Tesseract.js i omplint camps de formulari basats en el text extret.
 * @module cameraOcr
 */

// Importacions de mòduls externs
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

// --- Constants de Configuració ---
const OCR_LANGUAGE = "spa";
const TESSERACT_ENGINE_MODE = 1; // OEM: 1 (LSTM only)
const TESSERACT_PAGE_SEG_MODE = 3; // PSM: 3 (Auto page segmentation)
const TESSERACT_CHAR_WHITELIST =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-";
const IMAGE_MAX_DIMENSION = 1200;
const IMAGE_QUALITY = 0.95;
const IMAGE_TYPE = "image/png";
const MODAL_TRANSITION_DURATION = 300;
const PROGRESS_HIDE_DELAY = 1000;

// --- Selectors del DOM (Cachejats) ---
let cameraBtn,
  cameraGalleryModal,
  modalContent,
  optionCameraBtn,
  optionGalleryBtn,
  cameraInput,
  progressContainer,
  progressBar,
  progressText;

// --- Classes CSS ---
const VISIBLE_CLASS = "visible";
const HIDDEN_CLASS = "hidden";

// --- Variables d'Estat ---
let isProcessing = false;

/**
 * Busca i cacheja els elements del DOM necessaris per a la funcionalitat.
 * @returns {boolean} True si tots els elements essencials existeixen, false altrament.
 */
function cacheDomElements() {
  cameraBtn = document.getElementById("camera-in-dropdown");
  cameraGalleryModal = document.getElementById("camera-gallery-modal");
  modalContent = cameraGalleryModal?.querySelector(".modal-bottom-content");
  optionCameraBtn = document.getElementById("option-camera");
  optionGalleryBtn = document.getElementById("option-gallery");
  cameraInput = document.getElementById("camera-input");
  progressContainer = document.getElementById("ocr-progress-container");
  progressBar = document.getElementById("ocr-progress");
  progressText = document.getElementById("ocr-progress-text");

  const elements = {
    cameraBtn,
    cameraGalleryModal,
    modalContent,
    optionCameraBtn,
    optionGalleryBtn,
    cameraInput,
    progressContainer,
    progressBar,
    progressText,
  };
  for (const key in elements) {
    if (!elements[key]) {
      console.warn(
        `[cameraOcr] Element DOM requerit no trobat a l'inicialitzar: ${key}`
      );
      return false;
    }
  }
  return true;
}

// --- Funcions Auxiliars ---
function openModal() {
  if (!cameraGalleryModal) return;
  cameraGalleryModal.classList.remove(HIDDEN_CLASS);
  requestAnimationFrame(() => {
    cameraGalleryModal.classList.add(VISIBLE_CLASS);
    optionCameraBtn?.focus();
  });
}

function closeModal() {
  if (!cameraGalleryModal) return;
  cameraGalleryModal.classList.remove(VISIBLE_CLASS);
  cameraBtn?.focus();
  setTimeout(() => {
    cameraGalleryModal.classList.add(HIDDEN_CLASS);
  }, MODAL_TRANSITION_DURATION);
}

function handleOutsideClick(event) {
  if (
    cameraGalleryModal?.classList.contains(VISIBLE_CLASS) &&
    !modalContent?.contains(event.target) &&
    !cameraBtn?.contains(event.target)
  ) {
    closeModal();
  }
}

function triggerCameraCapture() {
  if (!cameraInput) return;
  cameraInput.setAttribute("capture", "environment");
  cameraInput.click();
  closeModal();
}

function triggerGallerySelection() {
  if (!cameraInput) return;
  cameraInput.removeAttribute("capture");
  cameraInput.click();
  closeModal();
}

function updateOcrProgress(percent, statusText) {
  if (progressContainer?.classList.contains(HIDDEN_CLASS)) {
    progressContainer.classList.remove(HIDDEN_CLASS);
  }
  if (progressBar) {
    progressBar.value = percent;
  }
  if (progressText) {
    progressText.textContent = statusText;
  }
}

function hideOcrProgress() {
  if (
    progressContainer &&
    !progressContainer.classList.contains(HIDDEN_CLASS)
  ) {
    setTimeout(() => {
      progressContainer.classList.add(HIDDEN_CLASS);
      if (progressBar) progressBar.value = 0;
      if (progressText) progressText.textContent = "";
    }, PROGRESS_HIDE_DELAY);
  }
}

async function resizeImage(file) {
  try {
    const img = await createImageBitmap(file);
    const { width: originalWidth, height: originalHeight } = img;

    if (Math.max(originalWidth, originalHeight) <= IMAGE_MAX_DIMENSION) {
      // L'imatge ja està dins dels límits, retorna-la directament com a Blob
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve(new Blob([e.target.result], { type: file.type }));
        reader.readAsArrayBuffer(file);
      });
    }

    const ratio = Math.min(
      IMAGE_MAX_DIMENSION / originalWidth,
      IMAGE_MAX_DIMENSION / originalHeight
    );
    const width = Math.round(originalWidth * ratio);
    const height = Math.round(originalHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("No s'ha pogut obtenir el context 2D del canvas.");

    ctx.drawImage(img, 0, 0, width, height);
    img.close();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No s'ha pogut convertir el canvas a Blob."));
          }
        },
        IMAGE_TYPE,
        IMAGE_QUALITY
      );
    });
  } catch (error) {
    console.error("Error redimensionant la imatge:", error);
    showToast("Error processant la imatge.", "error");
    throw error;
  }
}

async function preprocessImage(blob) {
  try {
    const img = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("No s'ha pogut obtenir el context 2D del canvas.");
    // Ajustos de contrast, brillantor, etc.
    ctx.filter = "grayscale(100%) contrast(150%) brightness(110%)";
    ctx.drawImage(img, 0, 0);
    img.close();
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (processedBlob) => {
          if (processedBlob) {
            resolve(processedBlob);
          } else {
            reject(
              new Error(
                "No s'ha pogut convertir el canvas preprocessat a Blob."
              )
            );
          }
        },
        IMAGE_TYPE,
        1.0
      );
    });
  } catch (error) {
    console.error("Error preprocessant la imatge:", error);
    showToast("Error millorant la imatge.", "error");
    throw error;
  }
}

function normalizeTime(timeStr) {
  if (!timeStr) return "";
  let cleaned = timeStr.replace(/[^\d:-]/g, "");
  cleaned = cleaned.replace(/-/g, ":");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
  }
  return "";
}

function safeSetFieldValue(fieldId, value, fieldName) {
  try {
    const element = document.getElementById(fieldId);
    if (element) {
      element.value = value;
    }
  } catch (error) {
    console.error(
      `[OCR Fill] Error en omplir el camp ${fieldName} (${fieldId}):`,
      error
    );
  }
}

function fillTimes(text, suffix) {
  let timeFound = false;
  const mobilitzatMatch = text.match(
    /status:\s*mobilitzat.*?(\d{1,2}[:\-]\d{1,2}(?:[:\-]\d{2})?)/i
  );
  const originTime = normalizeTime(mobilitzatMatch?.[1]);
  if (originTime) {
    safeSetFieldValue(`origin-time${suffix}`, originTime, "Hora Origen");
    timeFound = true;
  }

  const arribadaMatch = text.match(
    /status:\s*arribada\s*hospital.*?(\d{1,2}[:\-]\d{1,2}(?:[:\-]\d{2})?)/i
  );
  const destinationTime = normalizeTime(arribadaMatch?.[1]);
  if (destinationTime) {
    safeSetFieldValue(
      `destination-time${suffix}`,
      destinationTime,
      "Hora Destí"
    );
    timeFound = true;
  }

  const endMatch = text.match(
    /altech.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})?\s+(\d{1,2}[:\-]\d{1,2}(?:[:\-]\d{2})?)/i
  );
  const endTime = normalizeTime(endMatch?.[2]);
  if (endTime) {
    safeSetFieldValue(`end-time${suffix}`, endTime, "Hora Final");
    timeFound = true;
  } else if (!timeFound) {
    // Si no hem trobat cap hora, posem l'hora actual com a última opció
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    safeSetFieldValue(
      `end-time${suffix}`,
      `${hh}:${mm}`,
      "Hora Final (Actual)"
    );
  }
  return timeFound;
}

function fillServiceData(text, suffix) {
  let dataFound = false;
  const serviceNumberMatch = text.match(/\b(\d{9,10})\b/);
  if (serviceNumberMatch?.[1]) {
    safeSetFieldValue(
      `service-number${suffix}`,
      serviceNumberMatch[1],
      "Número Servei"
    );
    dataFound = true;
  }

  const originMatch = text.match(
    /municipi\s*[:\-]?\s*([^\d\n\r][a-z\s\-\'À-ÿ]+)/i
  );
  if (originMatch?.[1]) {
    const originClean = originMatch[1].trim().toUpperCase();
    safeSetFieldValue(`origin${suffix}`, originClean, "Origen");
    dataFound = true;
  }

  const destinationMatch = text.match(
    /(?:hospital|desti)\s*[:\-]?\s*([a-z\s\-\'À-ÿ\d]+)/i
  );
  if (destinationMatch?.[1]) {
    let destinationClean = destinationMatch[1]
      .replace(/desti/i, "")
      .trim()
      .toUpperCase();
    // Eliminem possibles codis numèrics massa llargs
    destinationClean = destinationClean.replace(/\b\d{5,}\b/g, "").trim();
    safeSetFieldValue(`destination${suffix}`, destinationClean, "Destí");
    dataFound = true;
  }
  return dataFound;
}

function processAndFillForm(ocrText) {
  if (!ocrText || !ocrText.trim()) {
    showToast("No s'ha pogut detectar text a la imatge.", "warning");
    return;
  }
  const cleanedText = ocrText.toLowerCase().replace(/\s+/g, " ").trim();
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = `-${currentServiceIndex + 1}`;
  let filledSomething = false;

  const timeFilled = fillTimes(cleanedText, suffix);
  const serviceDataFilled = fillServiceData(cleanedText, suffix);
  filledSomething = timeFilled || serviceDataFilled;

  if (filledSomething) {
    showToast("Camps del formulari actualitzats des de la imatge.", "success");
  } else {
    showToast("No s'ha trobat informació rellevant a la imatge.", "info");
  }
}

async function handleFileChange(event) {
  if (isProcessing) {
    showToast("Ja hi ha un procés d'OCR en marxa.", "warning");
    return;
  }
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Si us plau, selecciona un fitxer d'imatge.", "error");
    if (cameraInput) cameraInput.value = "";
    return;
  }

  isProcessing = true;
  updateOcrProgress(0, "Iniciant escaneig...");
  let worker = null;

  try {
    let imageBlob = await resizeImage(file);
    // Si voleu fer servir preprocessImage, descomenteu la línia següent:
    // imageBlob = await preprocessImage(imageBlob);

    updateOcrProgress(5, "Carregant motor OCR...");
    worker = await Tesseract.createWorker(OCR_LANGUAGE, TESSERACT_ENGINE_MODE, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const percent = Math.max(10, Math.floor(m.progress * 100));
          updateOcrProgress(percent, `Reconeixent text ${percent}%`);
        } else if (m.status === "loading language model") {
          updateOcrProgress(5, "Carregant model idioma...");
        }
      },
    });

    await worker.setParameters({
      tessedit_char_whitelist: TESSERACT_CHAR_WHITELIST,
      load_system_dawg: false,
      load_freq_dawg: false,
    });

    updateOcrProgress(10, "Reconeixent text 10%");
    const {
      data: { text: ocrText },
    } = await worker.recognize(imageBlob);
    updateOcrProgress(100, "Anàlisi completada.");

    processAndFillForm(ocrText);
  } catch (error) {
    console.error("[cameraOcr] Error durant el procés d'OCR:", error);
    showToast(`Error d'OCR: ${error.message || "Error desconegut"}`, "error");
    updateOcrProgress(0, "Error en l'escaneig.");
  } finally {
    if (worker) {
      await worker.terminate();
    }
    if (cameraInput) {
      cameraInput.value = "";
    }
    hideOcrProgress();
    isProcessing = false;
  }
}

/**
 * Inicialitza la funcionalitat d'OCR per càmera/galeria.
 * Aquesta funció S'HA DE CRIDAR quan el DOM estigui llest.
 * Configura els listeners d'esdeveniments necessaris.
 * @export
 */
export function initCameraOcr() {
  // Busquem els elements del DOM
  cacheDomElements();

  // --- Assignació d'Events ---
  cameraBtn?.addEventListener("click", openModal);
  optionCameraBtn?.addEventListener("click", triggerCameraCapture);
  optionGalleryBtn?.addEventListener("click", triggerGallerySelection);
  cameraInput?.addEventListener("change", handleFileChange);

  document.addEventListener("click", handleOutsideClick);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      cameraGalleryModal?.classList.contains(VISIBLE_CLASS)
    ) {
      closeModal();
    }
  });

  console.log("[cameraOcr] Funcionalitat OCR inicialitzada correctament.");
}
