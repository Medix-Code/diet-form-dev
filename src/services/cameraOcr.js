/**
 * @file cameraOcr.js
 * @description Gestiona la funcionalitat d'OCR a través de la càmera o galeria,
 *              utilitzant Tesseract.js, omplint camps de formulari,
 *              i adaptant l'estil del modal al servei actiu.
 * @module cameraOcr
 */

// Importacions de mòduls externs
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js"; // Per saber quin servei està actiu

// --- Constants de Configuració OCR/Imatge ---
const OCR_LANGUAGE = "spa";
const TESSERACT_ENGINE_MODE = 1;
const TESSERACT_PAGE_SEG_MODE = 3; // Assegura't que aquest és el valor correcte per al teu cas d'ús
const TESSERACT_CHAR_WHITELIST =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-";
const IMAGE_MAX_DIMENSION = 1200;
const IMAGE_QUALITY = 0.95; // Només rellevant per a formats com image/jpeg
const IMAGE_TYPE = "image/png"; // PNG sol ser millor per OCR (lossless)
const MODAL_TRANSITION_DURATION = 300; // ms (ha de coincidir amb CSS)
const PROGRESS_HIDE_DELAY = 1000; // ms

// --- IDs i Selectors del DOM ---
const DOM_IDS = {
  CAMERA_BTN: "camera-in-dropdown",
  CAMERA_MODAL: "camera-gallery-modal",
  MODAL_CONTENT: ".modal-bottom-content", // Selector del contingut intern
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
  // Array de classes de color (HA DE COINCIDIR amb el de servicesPanelManager i SCSS)
  SERVICE_COLORS: ["service-1", "service-2", "service-3", "service-4"],
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

  // Comprovació més específica dels elements crítics per al modal/OCR
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
  // Comprova elements de progrés només si s'espera que existeixin sempre
  if (!progressContainer || !progressBar || !progressText) {
    console.warn(
      "[cameraOcr] Elements de progrés OCR no trobats. La barra de progrés no funcionarà."
    );
    // Podem decidir si retornar false o continuar sense barra de progrés
  }

  return true;
}

/** Obre el modal de Càmera/Galeria, aplicant el color del servei actual. */
function _openCameraModal() {
  if (!cameraGalleryModal || !modalContentElement) {
    console.error(
      "[cameraOcr] S'ha intentat obrir el modal però els elements no estan disponibles."
    );
    return;
  }

  // 1. Obtenir índex i classe de color actual
  const currentServiceIdx = getCurrentServiceIndex();
  const currentColorClass = CSS_CLASSES.SERVICE_COLORS[currentServiceIdx] || "";
  console.log(
    `[cameraOcr] Obrint modal per al servei ${
      currentServiceIdx + 1
    }, color class: ${currentColorClass}`
  );

  // 2. Netejar classes de color anteriors del contingut del modal
  modalContentElement.classList.remove(...CSS_CLASSES.SERVICE_COLORS);

  // 3. Afegir la nova classe de color (si n'hi ha)
  if (currentColorClass) {
    modalContentElement.classList.add(currentColorClass);
  } else {
    console.warn(
      "[cameraOcr] No s'ha pogut determinar la classe de color per a l'índex:",
      currentServiceIdx
    );
    // Podríem aplicar una classe per defecte si el CSS no té un fons base
    // modalContentElement.classList.add('service-default-bg');
  }

  // 4. Mostrar el modal amb animació
  cameraGalleryModal.classList.remove(CSS_CLASSES.HIDDEN);
  // Forcem reflow per assegurar que la transició funciona correctament
  void cameraGalleryModal.offsetWidth;
  requestAnimationFrame(() => {
    cameraGalleryModal.classList.add(CSS_CLASSES.VISIBLE);
  });

  // 5. Gestionar focus
  optionCameraBtn?.focus();
}

/** Tanca el modal de Càmera/Galeria. */
function _closeCameraModal() {
  if (!cameraGalleryModal) return;

  cameraGalleryModal.classList.remove(CSS_CLASSES.VISIBLE);
  cameraBtn?.focus(); // Retorna focus al botó que l'obre

  setTimeout(() => {
    cameraGalleryModal.classList.add(CSS_CLASSES.HIDDEN);
    // Opcional: treure la classe de color en tancar completament
    // if(modalContentElement) modalContentElement.classList.remove(...CSS_CLASSES.SERVICE_COLORS);
  }, MODAL_TRANSITION_DURATION);
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
  _closeCameraModal(); // Tanca el modal d'opcions
}

/** Prepara i llança la selecció de galeria. */
function _triggerGallerySelection() {
  if (!cameraInput) return;
  cameraInput.removeAttribute("capture");
  cameraInput.click();
  _closeCameraModal(); // Tanca el modal d'opcions
}

/** Actualitza la UI de progrés de l'OCR. */
function _updateOcrProgress(percent, statusText) {
  if (!progressContainer || !progressBar || !progressText) return; // Comprova si existeixen
  if (progressContainer.classList.contains(CSS_CLASSES.HIDDEN)) {
    progressContainer.classList.remove(CSS_CLASSES.HIDDEN);
  }
  progressBar.value = Math.min(100, Math.max(0, percent)); // Assegura valor entre 0 i 100
  progressText.textContent = statusText;
}

/** Amaga la UI de progrés de l'OCR. */
function _hideOcrProgress() {
  if (!progressContainer) return;
  if (!progressContainer.classList.contains(CSS_CLASSES.HIDDEN)) {
    // Afegim un delay abans d'amagar per veure l'estat final
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
      img.close(); // Allibera memòria
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve(new Blob([e.target.result], { type: file.type }));
        reader.onerror = (e) =>
          reject(new Error("Error llegint el fitxer per a Blob: " + e));
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
    if (!ctx) throw new Error("No s'ha pogut obtenir el context 2D.");

    ctx.drawImage(img, 0, 0, width, height);
    img.close(); // Allibera memòria

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Conversió canvas a Blob fallida.")),
        IMAGE_TYPE,
        IMAGE_QUALITY
      );
    });
  } catch (error) {
    console.error("Error redimensionant imatge:", error);
    showToast("Error processant imatge.", "error");
    throw error; // Propaga l'error
  }
}

/** Preprocessa una imatge (opcional). */
async function _preprocessImage(blob) {
  // ... (Implementació igual que abans, però amb _ a les funcions internes si n'hi hagués) ...
  try {
    const img = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No s'ha pogut obtenir context 2D.");
    ctx.filter = "grayscale(100%) contrast(150%) brightness(110%)";
    ctx.drawImage(img, 0, 0);
    img.close();
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (processedBlob) =>
          processedBlob
            ? resolve(processedBlob)
            : reject(
                new Error("Conversió canvas preprocessat a Blob fallida.")
              ),
        IMAGE_TYPE,
        1.0
      ); // PNG qualitat no aplica
    });
  } catch (error) {
    console.error("Error preprocessant imatge:", error);
    showToast("Error millorant la imatge.", "error");
    throw error;
  }
}

/** Normalitza una cadena de temps. */
function _normalizeTime(timeStr) {
  /* ... (Codi igual) ... */
}

/** Assigna valor a un camp de forma segura. */
function _safeSetFieldValue(fieldId, value, fieldName) {
  /* ... (Codi igual) ... */
}

/** Omple camps de temps. */
function _fillTimes(text, suffix) {
  /* ... (Codi igual) ... */
}

/** Omple camps de dades del servei. */
function _fillServiceData(text, suffix) {
  /* ... (Codi igual) ... */
}

/** Processa text OCR i omple el formulari. */
function _processAndFillForm(ocrText) {
  /* ... (Codi igual) ... */
}

/** Gestiona el canvi de fitxer (selecció imatge) i el procés OCR. */
async function _handleFileChange(event) {
  if (isProcessing) {
    /* ... (warning i return) ... */
  }
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    /* ... (error i return) ... */
  }

  isProcessing = true;
  _updateOcrProgress(0, "Iniciant escaneig..."); // Usa funció interna
  let worker = null;

  try {
    let imageBlob = await _resizeImage(file); // Usa funció interna
    // Descomenta per preprocessar:
    // imageBlob = await _preprocessImage(imageBlob); // Usa funció interna

    _updateOcrProgress(5, "Carregant motor OCR...");
    worker = await Tesseract.createWorker(OCR_LANGUAGE, TESSERACT_ENGINE_MODE, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const percent = Math.max(10, Math.floor(m.progress * 100));
          _updateOcrProgress(percent, `Reconeixent text ${percent}%`);
        } else if (m.status === "loading language model") {
          _updateOcrProgress(5, "Carregant model idioma...");
        }
        // console.log(m); // Log detallat per depurar estats de Tesseract
      },
      // cacheMethod: 'none', // Prova si hi ha problemes de memòria
    });

    await worker.setParameters({
      tessedit_char_whitelist: TESSERACT_CHAR_WHITELIST,
      // tessedit_pageseg_mode: TESSERACT_PAGE_SEG_MODE, // Ja definit a createWorker? Verificar docs.
      // Paràmetres per velocitat/precisió (alguns poden ser redundants)
      load_system_dawg: false,
      load_freq_dawg: false,
      // user_defined_dpi: '300' // Prova si les imatges són de baixa resolució
    });

    _updateOcrProgress(10, "Reconeixent text 10%");
    const {
      data: { text: ocrText },
    } = await worker.recognize(imageBlob);
    _updateOcrProgress(100, "Anàlisi completada.");

    _processAndFillForm(ocrText); // Usa funció interna
  } catch (error) {
    console.error("[cameraOcr] Error durant el procés d'OCR:", error);
    showToast(`Error d'OCR: ${error.message || "Error desconegut"}`, "error");
    _updateOcrProgress(0, "Error en l'escaneig.");
  } finally {
    if (worker) {
      await worker.terminate();
      console.log("[cameraOcr] Worker Tesseract finalitzat.");
    }
    if (cameraInput) {
      cameraInput.value = ""; // Reseteja l'input
    }
    _hideOcrProgress(); // Usa funció interna
    isProcessing = false;
  }
}

// --- Funció d'Inicialització Exportada ---

/**
 * Inicialitza la funcionalitat d'OCR per càmera/galeria.
 * S'ha de cridar quan el DOM estigui llest.
 * @export
 */
export function initCameraOcr() {
  if (isInitialized) {
    console.warn("[cameraOcr] Ja inicialitzat.");
    return;
  }

  if (!_cacheDomElements()) {
    // No continua si falten elements
    return;
  }

  // --- Assignació d'Events ---
  cameraBtn.addEventListener("click", _openCameraModal); // Obre el modal amb gestió de color
  optionCameraBtn.addEventListener("click", _triggerCameraCapture);
  optionGalleryBtn.addEventListener("click", _triggerGallerySelection);
  cameraInput.addEventListener("change", _handleFileChange);

  // Listener per tancar clicant fora
  document.addEventListener("click", _handleOutsideClick);

  // Listener per tancar amb 'Escape'
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      cameraGalleryModal?.classList.contains(CSS_CLASSES.VISIBLE)
    ) {
      _closeCameraModal();
    }
  });

  isInitialized = true;
  console.log("[cameraOcr] Funcionalitat OCR inicialitzada correctament.");
}
