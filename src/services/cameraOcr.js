/**
 * @file cameraOcr.js
 * @description Gestiona la funcionalitat d'OCR a través de la càmera o galeria,
 *              utilitzant Tesseract.js, omplint camps de formulari basats
 *              en patrons predefinits, i adaptant l'estil del modal al servei actiu.
 * @module cameraOcr
 */

// Importacions de mòduls externs
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js"; // Per saber quin servei està actiu

// --- Constants de Configuració OCR/Imatge ---
const OCR_LANGUAGE = "spa";
const TESSERACT_ENGINE_MODE = 1;
const TESSERACT_PAGE_SEG_MODE = 3; // Auto Page Segmentation, pot ajudar
const TESSERACT_CHAR_WHITELIST =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:- /()."; // Llista completa
const IMAGE_MAX_DIMENSION = 1500; // Augmentat lleugerament
const IMAGE_QUALITY = 0.95; // Només per a JPEG
const IMAGE_TYPE = "image/png";
const MODAL_TRANSITION_DURATION = 300;
const PROGRESS_HIDE_DELAY = 1000;
const OCR_SEARCH_WINDOW = 200; // Caràcters a buscar després d'una keyword

// --- IDs i Selectors del DOM ---
const DOM_IDS = {
  CAMERA_BTN: "camera-in-dropdown",
  CAMERA_MODAL: "camera-gallery-modal",
  MODAL_CONTENT: ".modal-bottom-content",
  OPTION_CAMERA: "option-camera",
  OPTION_GALLERY: "option-gallery",
  CAMERA_INPUT: "camera-input",
  OCR_PROGRESS_CONTAINER: "ocr-progress-container",
  OCR_PROGRESS_BAR: "ocr-progress",
  OCR_PROGRESS_TEXT: "ocr-progress-text",
};

// --- Classes CSS ---
const CSS_CLASSES = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
  SERVICE_COLORS: ["service-1", "service-2", "service-3", "service-4"],
};

// --- Configuració de Patrons OCR ---

/** Normalitza una cadena de temps a HH:MM. */
const _normalizeTime = (timeStr) => {
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
  // console.warn(`[OCR Time] Format temps no reconegut: "${timeStr}" -> "${cleaned}"`);
  return "";
};

/** Neteja i posa en majúscules, permetent números i alguns símbols. */
const _cleanTextToUpper = (text) =>
  text ? text.replace(/[:\-]/g, "").trim().toUpperCase() : "";
/** Neteja per a números (només dígits). */
const _cleanDigitsOnly = (text) => (text ? text.replace(/\D/g, "") : "");

// Objecte que defineix com extreure cada camp
const OCR_PATTERNS = {
  // Temps
  ORIGIN_TIME: {
    id: "originTime",
    label: "Hora Origen",
    fieldIdSuffix: "origin-time",
    keywordRegex: /status:\s*mobilitzat/i,
    valueRegex: /(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i,
    postProcess: _normalizeTime,
  },
  DESTINATION_TIME: {
    id: "destinationTime",
    label: "Hora Destí",
    fieldIdSuffix: "destination-time",
    keywordRegex: /status:\s*arribada\s*hospital/i,
    valueRegex: /(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i,
    postProcess: _normalizeTime,
  },
  END_TIME: {
    id: "endTime",
    label: "Hora Final",
    fieldIdSuffix: "end-time",
    keywordRegex: /altech/i,
    valueRegex:
      /(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})?\s+(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i,
    postProcess: _normalizeTime,
  },
  // Dades Servei
  SERVICE_NUMBER: {
    id: "serviceNumber",
    label: "Número Servei",
    fieldIdSuffix: "service-number",
    keywordRegex: /afectats/i, // Busca la paraula clau
    valueRegex: /(\d{9,10})/i, // Busca 9-10 dígits DESPRÉS de la keyword
    postProcess: _cleanDigitsOnly,
  },
  ORIGIN: {
    id: "origin",
    label: "Origen",
    fieldIdSuffix: "origin",
    keywordRegex: /municipi/i,
    valueRegex: /\s*\n?\s*([a-z(\[][a-z\s\-\'()À-ÿ,./]+)/i, // Text que comença amb lletra/( a la línia següent
    postProcess: _cleanTextToUpper,
  },
  DESTINATION: {
    id: "destination",
    label: "Destí",
    fieldIdSuffix: "destination",
    keywordRegex: /hospital\s*desti/i,
    valueRegex: /\s*\n?\s*([a-z\d(\[][a-z\d\s\-\'()À-ÿ,./]+)/i, // Text/números que comencen amb lletra/número/(
    postProcess: (v) =>
      _cleanTextToUpper(v)
        .replace(/\b\d{5,}\b/g, "")
        .trim(), // Neteja números llargs
  },
};

// --- Variables / Cache DOM ---
let cameraBtn = null;
let cameraGalleryModal = null;
let modalContentElement = null;
let optionCameraBtn = null;
let optionGalleryBtn = null;
let cameraInput = null;
let progressContainer = null;
let progressBar = null;
let progressText = null;

// --- Variables d'Estat ---
let isProcessing = false;
let isInitialized = false;

// --- Funcions Privades ---

/** Busca i cacheja els elements DOM necessaris. */
function _cacheDomElements() {
  cameraBtn = document.getElementById(DOM_IDS.CAMERA_BTN);
  cameraGalleryModal = document.getElementById(DOM_IDS.CAMERA_MODAL);
  modalContentElement = cameraGalleryModal?.querySelector(
    DOM_IDS.MODAL_CONTENT
  );
  optionCameraBtn = document.getElementById(DOM_IDS.OPTION_CAMERA);
  optionGalleryBtn = document.getElementById(DOM_IDS.OPTION_GALLERY);
  cameraInput = document.getElementById(DOM_IDS.CAMERA_INPUT);
  progressContainer = document.getElementById(DOM_IDS.OCR_PROGRESS_CONTAINER);
  progressBar = document.getElementById(DOM_IDS.OCR_PROGRESS_BAR);
  progressText = document.getElementById(DOM_IDS.OCR_PROGRESS_TEXT);

  if (
    !cameraBtn ||
    !cameraGalleryModal ||
    !modalContentElement ||
    !optionCameraBtn ||
    !optionGalleryBtn ||
    !cameraInput
  ) {
    console.warn(
      "[cameraOcr] Falten elements DOM essencials per a la funcionalitat OCR/Modal."
    );
    return false;
  }
  if (!progressContainer || !progressBar || !progressText) {
    console.warn("[cameraOcr] Elements de progrés OCR no trobats.");
  }
  return true;
}

/** Obre el modal de Càmera/Galeria, aplicant el color del servei actual. */
function _openCameraModal() {
  if (!cameraGalleryModal || !modalContentElement) return;
  const currentServiceIdx = getCurrentServiceIndex();
  const currentColorClass = CSS_CLASSES.SERVICE_COLORS[currentServiceIdx] || "";
  modalContentElement.classList.remove(...CSS_CLASSES.SERVICE_COLORS);
  if (currentColorClass) modalContentElement.classList.add(currentColorClass);
  cameraGalleryModal.classList.remove(CSS_CLASSES.HIDDEN);
  void cameraGalleryModal.offsetWidth; // Reflow
  requestAnimationFrame(() =>
    cameraGalleryModal.classList.add(CSS_CLASSES.VISIBLE)
  );
  optionCameraBtn?.focus();
}

/** Tanca el modal de Càmera/Galeria. */
function _closeCameraModal() {
  if (!cameraGalleryModal) return;
  cameraGalleryModal.classList.remove(CSS_CLASSES.VISIBLE);
  cameraBtn?.focus();
  setTimeout(
    () => cameraGalleryModal.classList.add(CSS_CLASSES.HIDDEN),
    MODAL_TRANSITION_DURATION
  );
}

/** Gestiona clics fora del contingut del modal per tancar-lo. */
function _handleOutsideClick(event) {
  if (
    cameraGalleryModal?.classList.contains(CSS_CLASSES.VISIBLE) &&
    !modalContentElement?.contains(event.target) &&
    !cameraBtn?.contains(event.target)
  ) {
    _closeCameraModal();
  }
}

/** Prepara i llança la captura de càmera. */
function _triggerCameraCapture() {
  if (!cameraInput) return;
  cameraInput.setAttribute("capture", "environment");
  cameraInput.click();
  _closeCameraModal();
}

/** Prepara i llança la selecció de galeria. */
function _triggerGallerySelection() {
  if (!cameraInput) return;
  cameraInput.removeAttribute("capture");
  cameraInput.click();
  _closeCameraModal();
}

/** Actualitza la UI de progrés de l'OCR. */
function _updateOcrProgress(percent, statusText) {
  if (!progressContainer || !progressBar || !progressText) return;
  if (progressContainer.classList.contains(CSS_CLASSES.HIDDEN)) {
    progressContainer.classList.remove(CSS_CLASSES.HIDDEN);
  }
  progressBar.value = Math.min(100, Math.max(0, percent));
  progressText.textContent = statusText;
}

/** Amaga la UI de progrés de l'OCR. */
function _hideOcrProgress() {
  if (!progressContainer) return;
  if (!progressContainer.classList.contains(CSS_CLASSES.HIDDEN)) {
    setTimeout(() => {
      progressContainer.classList.add(CSS_CLASSES.HIDDEN);
      if (progressBar) progressBar.value = 0;
      if (progressText) progressText.textContent = "";
    }, PROGRESS_HIDE_DELAY);
  }
}

/** Redimensiona una imatge. */
async function _resizeImage(file) {
  try {
    const img = await createImageBitmap(file);
    const { width: originalWidth, height: originalHeight } = img;
    if (Math.max(originalWidth, originalHeight) <= IMAGE_MAX_DIMENSION) {
      img.close();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve(new Blob([e.target.result], { type: file.type }));
        reader.onerror = (e) => reject(new Error("Error llegint fitxer: " + e));
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
    if (!ctx) throw new Error("No context 2D.");
    ctx.drawImage(img, 0, 0, width, height);
    img.close();
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Canvas a Blob fallit.")),
        IMAGE_TYPE,
        IMAGE_QUALITY
      );
    });
  } catch (error) {
    console.error("Error redimensionant:", error);
    showToast("Error processant imatge.", "error");
    throw error;
  }
}

/** Preprocessa una imatge (opcional). */
async function _preprocessImage(blob) {
  try {
    const img = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No context 2D.");
    ctx.filter = "grayscale(100%) contrast(150%) brightness(110%)"; // Ajusta filtres si cal
    ctx.drawImage(img, 0, 0);
    img.close();
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (processedBlob) =>
          processedBlob
            ? resolve(processedBlob)
            : reject(new Error("Canvas preprocessat a Blob fallit.")),
        IMAGE_TYPE,
        1.0
      );
    });
  } catch (error) {
    console.error("Error preprocessant:", error);
    showToast("Error millorant la imatge.", "error");
    throw error;
  }
}

/** Assigna valor a un camp de forma segura. */
function _safeSetFieldValue(fieldId, value, fieldName) {
  try {
    const element = document.getElementById(fieldId);
    if (element) {
      element.value = value;
      console.log(`[OCR Fill] ${fieldName} (${fieldId}) = "${value}"`);
    } else {
      // console.warn(`[OCR Fill] Element no trobat: ${fieldName} (${fieldId})`);
    }
  } catch (error) {
    console.error(`[OCR Fill] Error omplint ${fieldName} (${fieldId}):`, error);
  }
}

/**
 * Processa el text extret per OCR i intenta omplir els camps del formulari
 * basant-se en els patrons definits a OCR_PATTERNS.
 * Inclou un fallback per a l'hora final si no es troba cap altra hora.
 * @param {string} ocrText - El text cru obtingut de Tesseract.
 */
function _processAndFillForm(ocrText) {
  if (!ocrText || !ocrText.trim()) {
    showToast("No s'ha pogut detectar text a la imatge.", "warning");
    return;
  }

  // Normalitzem el text per a la cerca (minúscules, espais simples, mantenim salts de línia)
  const processedText = ocrText.toLowerCase().replace(/ +/g, " ");
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = `-${currentServiceIndex + 1}`;
  let filledFields = {}; // Registre de camps omplerts

  console.log(
    `[OCR Proc] Processant text per al servei ${currentServiceIndex + 1}:`
  ); // Esborrat el log del text sencer per claredat

  // Itera sobre cada patró definit
  Object.values(OCR_PATTERNS).forEach((pattern) => {
    let valueMatch = null;

    // Busca la paraula clau si existeix
    const keywordMatch = pattern.keywordRegex
      ? pattern.keywordRegex.exec(processedText)
      : null;

    if (keywordMatch) {
      // Busca el valor DESPRÉS de la paraula clau
      const searchStartIndex = keywordMatch.index + keywordMatch[0].length;
      const searchTextAfterKeyword = processedText.substring(
        searchStartIndex,
        searchStartIndex + OCR_SEARCH_WINDOW
      );
      valueMatch = pattern.valueRegex.exec(searchTextAfterKeyword);
      // if (!valueMatch) console.log(`  - Keyword '${pattern.id}' trobada, però valor no trobat després.`);
    } else if (!pattern.keywordRegex) {
      // Si no hi ha keyword, busca a tot el text
      valueMatch = pattern.valueRegex.exec(processedText);
    } else {
      // console.log(`  - Keyword '${pattern.id}' NO trobada.`);
    }

    // Processa si hi ha un match
    if (valueMatch && valueMatch[1]) {
      let extractedValue = valueMatch[1].trim(); // Treu espais inicials/finals
      // console.log(`    - Valor potencial per '${pattern.id}': "${extractedValue.replace(/\n/g, '\\n')}"`);
      if (pattern.postProcess) {
        extractedValue = pattern.postProcess(extractedValue);
        // console.log(`    - Valor post-processat: "${extractedValue}"`);
      }
      if (extractedValue) {
        const fieldId = `${pattern.fieldIdSuffix}${suffix}`;
        _safeSetFieldValue(fieldId, extractedValue, pattern.label);
        filledFields[pattern.id] = true;
      }
    } else {
      // console.log(`    - Valor per '${pattern.id}' NO trobat.`);
    }
  });

  // Fallback Hora Final (només si no s'ha trobat endTime però sí altres hores)
  if (
    !filledFields.endTime &&
    (filledFields.originTime || filledFields.destinationTime)
  ) {
    console.warn(
      "[OCR Fallback] Hora Final no trobada (altech). Assignant hora actual."
    );
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    _safeSetFieldValue(
      `end-time${suffix}`,
      `${hh}:${mm}`,
      "Hora Final (Actual)"
    );
    filledFields.endTime = true;
  }

  // Feedback
  if (Object.keys(filledFields).length > 0) {
    showToast("Camps actualitzats des de la imatge.", "success");
  } else {
    showToast("No s'ha trobat informació rellevant a la imatge.", "info");
    // console.log("[OCR Proc] Text complet analitzat:\n", ocrText);
  }
}

/** Gestiona el canvi de fitxer (selecció imatge) i el procés OCR. */
async function _handleFileChange(event) {
  if (isProcessing) {
    showToast("Procés OCR en marxa.", "warning");
    return;
  }
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Selecciona una imatge.", "error");
    if (cameraInput) cameraInput.value = "";
    return;
  }

  isProcessing = true;
  _updateOcrProgress(0, "Iniciant escaneig...");
  let worker = null;

  try {
    let imageBlob = await _resizeImage(file);
    // imageBlob = await _preprocessImage(imageBlob);

    _updateOcrProgress(5, "Carregant OCR...");
    worker = await Tesseract.createWorker(OCR_LANGUAGE, TESSERACT_ENGINE_MODE, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const percent = Math.max(10, Math.floor(m.progress * 100));
          _updateOcrProgress(percent, `Reconeixent ${percent}%`);
        } else if (m.status === "loading language model") {
          _updateOcrProgress(5, "Carregant idioma...");
        }
      },
    });
    await worker.setParameters({
      tessedit_char_whitelist: TESSERACT_CHAR_WHITELIST,
      // tessedit_pageseg_mode: TESSERACT_PAGE_SEG_MODE, // Potser ja està a createWorker
      load_system_dawg: false,
      load_freq_dawg: false,
    });

    _updateOcrProgress(10, "Reconeixent 10%");
    const {
      data: { text: ocrText },
    } = await worker.recognize(imageBlob);
    _updateOcrProgress(100, "Anàlisi OK.");

    _processAndFillForm(ocrText);
  } catch (error) {
    console.error("[cameraOcr] Error OCR:", error);
    showToast(`Error OCR: ${error.message || "Desconegut"}`, "error");
    _updateOcrProgress(0, "Error escaneig.");
  } finally {
    if (worker) {
      await worker.terminate();
      console.log("[cameraOcr] Worker finalitzat.");
    }
    if (cameraInput) cameraInput.value = "";
    _hideOcrProgress();
    isProcessing = false;
  }
}

// --- Funció d'Inicialització Exportada ---

/**
 * Inicialitza la funcionalitat d'OCR per càmera/galeria.
 * @export
 */
export function initCameraOcr() {
  if (isInitialized) {
    console.warn("[cameraOcr] Ja inicialitzat.");
    return;
  }
  if (!_cacheDomElements()) return;

  cameraBtn.addEventListener("click", _openCameraModal);
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

  isInitialized = true;
  console.log("[cameraOcr] Funcionalitat OCR inicialitzada.");
}
