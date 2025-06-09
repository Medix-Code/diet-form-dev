/**
 * @file cameraOcr.js
 * @description Gestiona la funcionalidad de OCR a través de la cámara o galería,
 *              utilizando Tesseract.js, rellenando campos de formulario basados
 *              en patrones predefinidos, y adaptando el estilo del modal al servicio activo.
 * @module cameraOcr
 */

import { showToast } from "../ui/toast.js";
import {
  getCurrentServiceIndex,
  getModeForService,
} from "../services/servicesPanelManager.js";
import { setControlsDisabled } from "../ui/uiControls.js";

// --- Constantes de Configuración ---
const OCR_LANGUAGE = "spa";
const TESSERACT_ENGINE_MODE = 1;
const TESSERACT_CHAR_WHITELIST =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:/-ÀÉÍÓÚÈÒÀÜÏÇÑ";
const IMAGE_MAX_DIMENSION = 1500;
const IMAGE_QUALITY = 0.95;
const IMAGE_TYPE = "image/png";
const MODAL_TRANSITION_DURATION = 300;
const PROGRESS_HIDE_DELAY = 1000;

const TESSERACT_PARAMS = {
  tessedit_char_whitelist: TESSERACT_CHAR_WHITELIST,
  tessedit_pageseg_mode: 6,
  load_system_dawg: false,
  load_freq_dawg: false,
};

// --- Selectores del DOM ---
const DOM_SELECTORS = {
  CAMERA_MODAL: "camera-gallery-modal",
  MODAL_CONTENT: ".modal-bottom-content",
  OPTION_CAMERA: "option-camera",
  OPTION_GALLERY: "option-gallery",
  CAMERA_INPUT: "camera-input",
  OCR_PROGRESS_CONTAINER: ".ocr-progress-container",
  OCR_PROGRESS_TEXT: ".ocr-progress-text",
  OCR_SCAN_BTN: ".btn-ocr-inline",
  END_TIME_INPUT: ".end-time",
};

// --- Clases CSS ---
const CSS_CLASSES = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
  MODAL_OPEN: "modal-open",
  INPUT_WARNING: "input-warning",
  SERVICE_COLORS: ["service-1", "service-2", "service-3", "service-4"],
};

// --- Patrones de OCR ---
const OCR_PATTERNS = {
  ORIGIN_TIME: {
    id: "originTime",
    label: "Hora Origen",
    fieldIdSuffix: "origin-time",
    lineKeywordRegex: /mobilitzat|ltat/i,
  },
  DESTINATION_TIME: {
    id: "destinationTime",
    label: "Hora Destino",
    fieldIdSuffix: "destination-time",
    lineKeywordRegex: /arribada|hospital|aaah/i,
  },
  END_TIME: {
    id: "endTime",
    label: "Hora Final",
    fieldIdSuffix: "end-time",
    lineKeywordRegex: /^\d{2}\/\d{2}\/\d{2}/,
    valueRegex: /(\d{1,2}:\d{2})/,
  },
};

// --- Variables de Módulo ---
let cameraGalleryModal,
  modalContentElement,
  optionCameraBtn,
  optionGalleryBtn,
  cameraInput;
let isProcessing = false;
let isInitialized = false;

// =============================================================================
// --- FUNCIONES PRIVADAS DE GESTIÓN DEL DOM Y UI ---
// =============================================================================

function _cacheDomElements() {
  cameraGalleryModal = document.getElementById(DOM_SELECTORS.CAMERA_MODAL);
  modalContentElement = cameraGalleryModal?.querySelector(
    DOM_SELECTORS.MODAL_CONTENT
  );
  optionCameraBtn = document.getElementById(DOM_SELECTORS.OPTION_CAMERA);
  optionGalleryBtn = document.getElementById(DOM_SELECTORS.OPTION_GALLERY);
  cameraInput = document.getElementById(DOM_SELECTORS.CAMERA_INPUT);

  if (
    !cameraGalleryModal ||
    !modalContentElement ||
    !optionCameraBtn ||
    !optionGalleryBtn ||
    !cameraInput
  ) {
    console.error(
      "[cameraOcr] Faltan elementos DOM esenciales para la funcionalidad del Modal OCR."
    );
    return false;
  }
  return true;
}

function _openCameraModal() {
  if (!cameraGalleryModal || !modalContentElement) return;

  document.body.classList.add(CSS_CLASSES.MODAL_OPEN);
  const currentServiceIdx = getCurrentServiceIndex();
  const currentColorClass = CSS_CLASSES.SERVICE_COLORS[currentServiceIdx] || "";
  modalContentElement.classList.remove(...CSS_CLASSES.SERVICE_COLORS);
  if (currentColorClass) modalContentElement.classList.add(currentColorClass);

  cameraGalleryModal.classList.remove(CSS_CLASSES.HIDDEN);
  requestAnimationFrame(() =>
    cameraGalleryModal.classList.add(CSS_CLASSES.VISIBLE)
  );
  optionCameraBtn?.focus();
}

function _closeCameraModal() {
  if (!cameraGalleryModal) return;
  document.body.classList.remove(CSS_CLASSES.MODAL_OPEN);
  cameraGalleryModal.classList.remove(CSS_CLASSES.VISIBLE);
  setTimeout(
    () => cameraGalleryModal.classList.add(CSS_CLASSES.HIDDEN),
    MODAL_TRANSITION_DURATION
  );
}

function _handleOutsideClick(event) {
  if (
    cameraGalleryModal?.classList.contains(CSS_CLASSES.VISIBLE) &&
    !modalContentElement?.contains(event.target)
  ) {
    _closeCameraModal();
  }
}

function _triggerCameraCapture() {
  if (!cameraInput) return;
  cameraInput.setAttribute("capture", "environment");
  cameraInput.click();
  _closeCameraModal();
}

function _triggerGallerySelection() {
  if (!cameraInput) return;
  cameraInput.removeAttribute("capture");
  cameraInput.click();
  _closeCameraModal();
}

function _getActiveServicePanelElement() {
  return document.querySelector(".service:not(.hidden)");
}

function _updateOcrProgress(statusText) {
  const currentServicePanel = _getActiveServicePanelElement();
  const progressContainer = currentServicePanel?.querySelector(
    DOM_SELECTORS.OCR_PROGRESS_CONTAINER
  );
  if (!progressContainer) return;

  progressContainer.classList.remove(CSS_CLASSES.HIDDEN);
  const progressText = progressContainer.querySelector(
    DOM_SELECTORS.OCR_PROGRESS_TEXT
  );
  if (progressText) progressText.textContent = statusText;
}

function _hideOcrProgress() {
  const currentServicePanel = _getActiveServicePanelElement();
  const progressContainer = currentServicePanel?.querySelector(
    DOM_SELECTORS.OCR_PROGRESS_CONTAINER
  );
  if (progressContainer) {
    setTimeout(
      () => progressContainer.classList.add(CSS_CLASSES.HIDDEN),
      PROGRESS_HIDE_DELAY
    );
  }
}

function _scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}

// =============================================================================
// --- FUNCIONES PRIVADAS DE PROCESAMIENTO OCR ---
// =============================================================================

function _normalizeTime(timeStr) {
  if (!timeStr) return "";
  const cleaned = timeStr.replace(/[^\d:-]/g, "").replace(/-/g, ":");
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

async function _resizeImage(file) {
  const img = await createImageBitmap(file);
  const { width: originalWidth, height: originalHeight } = img;
  if (Math.max(originalWidth, originalHeight) <= IMAGE_MAX_DIMENSION) {
    img.close();
    return file;
  }
  const ratio = Math.min(
    IMAGE_MAX_DIMENSION / originalWidth,
    IMAGE_MAX_DIMENSION / originalHeight
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(originalWidth * ratio);
  canvas.height = Math.round(originalHeight * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("La conversión de canvas a blob ha fallado.")),
      IMAGE_TYPE,
      IMAGE_QUALITY
    );
  });
}

async function _preprocessImage(blob) {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(100%) contrast(180%) brightness(110%)";
  ctx.drawImage(img, 0, 0);
  img.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (processedBlob) =>
        processedBlob
          ? resolve(processedBlob)
          : reject(new Error("El preprocesamiento de la imagen ha fallado.")),
      IMAGE_TYPE,
      1.0
    );
  });
}

function _safeSetFieldValue(fieldId, value, fieldName) {
  const element = document.getElementById(fieldId);
  if (element) {
    element.value = value;
    console.log(`[OCR Fill] ${fieldName} (${fieldId}) = "${value}"`);
  } else {
    console.warn(
      `[OCR Fill] No se encontró el campo ${fieldName} con ID ${fieldId}`
    );
  }
}

function _processAndFillForm(ocrText) {
  console.log("--- TEXTO COMPLETO RECONOCIDO POR TESSERACT ---");
  const normalizedOcrText = ocrText.replace(/-/g, ":");
  console.log(`Valor de ocrText (normalizado):`, normalizedOcrText);
  console.log("-------------------------------------------");

  if (!normalizedOcrText.trim()) {
    showToast("No se pudo reconocer texto en esta imagen.", "warning");
    return;
  }

  const currentServiceIndex = getCurrentServiceIndex();
  const currentMode = getModeForService(currentServiceIndex) || "3.6";
  const suffix = `-${currentServiceIndex + 1}`;
  let filledFieldsInThisScan = {};

  const lines = normalizedOcrText.split("\n");

  Object.values(OCR_PATTERNS).forEach((pattern) => {
    if (
      (currentMode === "3.11" || currentMode === "3.22") &&
      pattern.id === "destinationTime"
    )
      return;

    const fieldId = `${pattern.fieldIdSuffix}${suffix}`;
    const fieldElement = document.getElementById(fieldId);

    if (
      fieldElement?.value &&
      !fieldElement.classList.contains(CSS_CLASSES.INPUT_WARNING)
    ) {
      return;
    }

    for (const line of lines) {
      if (pattern.lineKeywordRegex.test(line.toLowerCase())) {
        let extractedValue = "";

        // Si el patró té un valueRegex (cas de END_TIME)
        if (pattern.valueRegex) {
          const valueMatch = line.match(pattern.valueRegex);
          if (valueMatch && valueMatch[1]) {
            extractedValue = _normalizeTime(valueMatch[1].trim());
          }
        } else {
          const digits = line.replace(/\D/g, "");
          const datePatternIndex = digits.search(/\d{6}/);
          if (datePatternIndex !== -1) {
            const timeDigits = digits.substring(datePatternIndex + 6);
            if (timeDigits.length >= 4) {
              const hours = timeDigits.substring(0, 2);
              const minutes = timeDigits.substring(2, 4);
              extractedValue = _normalizeTime(`${hours}:${minutes}`);
            }
          }
        }

        if (extractedValue) {
          _safeSetFieldValue(fieldId, extractedValue, pattern.label);
          fieldElement?.classList.remove(CSS_CLASSES.INPUT_WARNING);
          filledFieldsInThisScan[pattern.id] = pattern;
          break;
        }
      }
    }
  });

  const originTimeField = document.getElementById(`origin-time${suffix}`);
  const destTimeField = document.getElementById(`destination-time${suffix}`);
  const endTimeField = document.getElementById(`end-time${suffix}`);

  if (
    !endTimeField?.value &&
    (originTimeField?.value || destTimeField?.value)
  ) {
    console.warn(
      "[OCR Fallback] Hora Final no encontrada. Activando fallback."
    );
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    _safeSetFieldValue(endTimeField.id, currentTime, "Hora Final (Actual)");
    endTimeField.classList.add(CSS_CLASSES.INPUT_WARNING);
    filledFieldsInThisScan.endTime = { label: "Hora Final (Actual)" };
  }

  const newlyFilledLabels = Object.values(filledFieldsInThisScan).map(
    (p) => p.label
  );
  if (newlyFilledLabels.length > 0) {
    showToast(`Datos añadidos: ${newlyFilledLabels.join(", ")}.`, "success");
  } else {
    showToast("No se han añadido datos nuevos.", "info");
  }
}

async function _handleFileChange(event) {
  if (isProcessing) return;
  const file = event.target.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  isProcessing = true;
  setControlsDisabled(true);
  _updateOcrProgress("Preparando imagen...");
  _scrollToBottom();

  let worker = null;
  try {
    let imageBlob = await _resizeImage(file);
    imageBlob = await _preprocessImage(imageBlob);

    _updateOcrProgress("Cargando motor OCR...");
    worker = await Tesseract.createWorker(OCR_LANGUAGE, TESSERACT_ENGINE_MODE, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          _updateOcrProgress(
            `Reconociendo texto ${Math.floor(m.progress * 100)}%...`
          );
        }
      },
    });
    await worker.setParameters(TESSERACT_PARAMS);

    const {
      data: { text: ocrText },
    } = await worker.recognize(imageBlob);
    _updateOcrProgress("Análisis completado.");
    _processAndFillForm(ocrText);
  } catch (error) {
    console.error("[cameraOcr] Error OCR:", error);
    showToast(`Error de escaneo: ${error.message || "Desconocido"}`, "error");
    _updateOcrProgress("Error en el escaneo.");
  } finally {
    await worker?.terminate();
    if (cameraInput) cameraInput.value = "";
    _hideOcrProgress();
    setControlsDisabled(false);
    isProcessing = false;
  }
}

// =============================================================================
// --- FUNCIÓN PÚBLICA DE INICIALIZACIÓN ---
// =============================================================================

export function initCameraOcr() {
  if (isInitialized) return;
  if (!_cacheDomElements()) return;

  const scanButtons = document.querySelectorAll(DOM_SELECTORS.OCR_SCAN_BTN);
  const allEndTimeInputs = document.querySelectorAll(
    DOM_SELECTORS.END_TIME_INPUT
  );

  scanButtons.forEach((button) =>
    button.addEventListener("click", _openCameraModal)
  );

  optionCameraBtn.addEventListener("click", _triggerCameraCapture);
  optionGalleryBtn.addEventListener("click", _triggerGallerySelection);
  cameraInput.addEventListener("change", _handleFileChange);

  document.addEventListener("click", _handleOutsideClick);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      cameraGalleryModal?.classList.contains(CSS_CLASSES.VISIBLE)
    ) {
      _closeCameraModal();
    }
  });

  allEndTimeInputs.forEach((input) => {
    const removeWarning = () =>
      input.classList.remove(CSS_CLASSES.INPUT_WARNING);
    input.addEventListener("input", removeWarning);
    input.addEventListener("focus", removeWarning);
  });

  isInitialized = true;
  console.log("[cameraOcr] Funcionalidad OCR inicializada.");
}
