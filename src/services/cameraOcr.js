/**
 * @file cameraOcr.js
 * @description Gestiona la funcionalitat d'OCR a través de la càmera o galeria,
 * utilitzant Tesseract.js i omplint camps de formulari basats en el text extret.
 * @module cameraOcr
 */

// Importacions de mòduls externs (assumim que existeixen i funcionen)
import { showToast } from "../ui/toast.js"; // Funció per mostrar notificacions a l'usuari
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js"; // Funció per obtenir l'índex del servei actual

/**
 * Inicialitza la funcionalitat d'OCR per càmera/galeria.
 * Configura els listeners d'esdeveniments i la lògica principal.
 * Aplicat el patró IIFE (Immediately Invoked Function Expression) per encapsular
 * i evitar la contaminació de l'scope global.
 */
(function initCameraOcrFeature() {
  "use strict";

  // --- Constants de Configuració ---
  const OCR_LANGUAGE = "spa"; // Idioma per Tesseract
  const TESSERACT_ENGINE_MODE = 1; // OEM: 1 (LSTM only)
  const TESSERACT_PAGE_SEG_MODE = 3; // PSM: 3 (Auto page segmentation)
  const TESSERACT_CHAR_WHITELIST =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-";
  const IMAGE_MAX_DIMENSION = 1200; // Dimensió màxima per redimensionar imatges (px)
  const IMAGE_QUALITY = 0.95; // Qualitat per a la compressió (si s'utilitza JPEG, per exemple)
  const IMAGE_TYPE = "image/png"; // Tipus d'imatge preferit per processar
  const MODAL_TRANSITION_DURATION = 300; // ms (hauria de coincidir amb el CSS)
  const PROGRESS_HIDE_DELAY = 1000; // ms

  // --- Selectors del DOM (cachejats per rendiment) ---
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraGalleryModal = document.getElementById("camera-gallery-modal");
  const modalContent = cameraGalleryModal?.querySelector(
    ".modal-bottom-content"
  ); // Ús d'Optional Chaining
  const optionCameraBtn = document.getElementById("option-camera");
  const optionGalleryBtn = document.getElementById("option-gallery");
  const cameraInput = document.getElementById("camera-input");
  const progressContainer = document.getElementById("ocr-progress-container");
  const progressBar = document.getElementById("ocr-progress");
  const progressText = document.getElementById("ocr-progress-text");

  // --- Classes CSS (per mantenibilitat) ---
  const VISIBLE_CLASS = "visible";
  const HIDDEN_CLASS = "hidden";

  // --- Variables d'Estat ---
  let isProcessing = false; // Flag per evitar processaments múltiples simultanis

  /**
   * Comprova si tots els elements essencials del DOM existeixen.
   * @returns {boolean} True si tots els elements existeixen, false altrament.
   */
  function checkRequiredElements() {
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
        console.warn(`[cameraOcr] Element DOM requerit no trobat: ${key}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Obre el modal de selecció de càmera/galeria amb una animació suau.
   */
  function openModal() {
    if (!cameraGalleryModal) return;
    cameraGalleryModal.classList.remove(HIDDEN_CLASS);
    // Assegura que l'element és visible abans d'aplicar la classe de transició
    requestAnimationFrame(() => {
      cameraGalleryModal.classList.add(VISIBLE_CLASS);
      // Millora d'accessibilitat: Mou el focus al modal o a un element dins d'ell
      optionCameraBtn?.focus(); // O un altre element interactiu inicial
    });
  }

  /**
   * Tanca el modal de selecció amb una animació suau.
   */
  function closeModal() {
    if (!cameraGalleryModal) return;
    cameraGalleryModal.classList.remove(VISIBLE_CLASS);
    // Accessibilitat: Retorna el focus a l'element que va obrir el modal
    cameraBtn?.focus();
    setTimeout(() => {
      cameraGalleryModal.classList.add(HIDDEN_CLASS);
    }, MODAL_TRANSITION_DURATION);
  }

  /**
   * Gestiona el clic fora del contingut del modal per tancar-lo.
   * @param {Event} event - L'esdeveniment de clic.
   */
  function handleOutsideClick(event) {
    if (
      cameraGalleryModal?.classList.contains(VISIBLE_CLASS) &&
      !modalContent?.contains(event.target) &&
      !cameraBtn?.contains(event.target)
    ) {
      closeModal();
    }
  }

  /**
   * Prepara i llança la captura de càmera.
   */
  function triggerCameraCapture() {
    if (!cameraInput) return;
    cameraInput.setAttribute("capture", "environment"); // Prefereix càmera posterior
    cameraInput.click();
    closeModal();
  }

  /**
   * Prepara i llança la selecció de galeria.
   */
  function triggerGallerySelection() {
    if (!cameraInput) return;
    cameraInput.removeAttribute("capture");
    cameraInput.click();
    closeModal();
  }

  /**
   * Actualitza la interfície d'usuari per mostrar el progrés de l'OCR.
   * @param {number} percent - El percentatge de progrés (0-100).
   * @param {string} statusText - El text d'estat a mostrar.
   */
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

  /**
   * Amaga la interfície d'usuari del progrés de l'OCR.
   */
  function hideOcrProgress() {
    if (
      progressContainer &&
      !progressContainer.classList.contains(HIDDEN_CLASS)
    ) {
      // Afegeix un petit retard per permetre a l'usuari veure el missatge final
      setTimeout(() => {
        progressContainer.classList.add(HIDDEN_CLASS);
        if (progressBar) progressBar.value = 0;
        if (progressText) progressText.textContent = "";
      }, PROGRESS_HIDE_DELAY);
    }
  }

  /**
   * Redimensiona una imatge a una dimensió màxima mantenint la relació d'aspecte.
   * @param {File} file - El fitxer d'imatge original.
   * @returns {Promise<Blob>} Una promesa que resol amb el Blob de la imatge redimensionada.
   */
  async function resizeImage(file) {
    try {
      const img = await createImageBitmap(file);
      const { width: originalWidth, height: originalHeight } = img;

      // No redimensiona si ja és prou petita
      if (Math.max(originalWidth, originalHeight) <= IMAGE_MAX_DIMENSION) {
        console.log("Imatge ja dins dels límits, no es redimensiona.");
        return file; // Retorna el fitxer original com a Blob
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
      img.close(); // Allibera memòria

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
      throw error; // Propaga l'error
    }
  }

  /**
   * Aplica filtres de preprocessament a una imatge per millorar l'OCR.
   * (Exemple: brillantor, contrast, escala de grisos)
   * @param {Blob} blob - El Blob de la imatge a preprocessar.
   * @returns {Promise<Blob>} Una promesa que resol amb el Blob de la imatge preprocessada.
   */
  async function preprocessImage(blob) {
    try {
      const img = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error("No s'ha pogut obtenir el context 2D del canvas.");

      // Ajusta aquests filtres segons les necessitats per millorar el reconeixement
      ctx.filter = "grayscale(100%) contrast(150%) brightness(110%)";
      // Considera altres tècniques: binarització (thresholding), eliminació de soroll si és necessari.
      ctx.drawImage(img, 0, 0);
      img.close(); // Allibera memòria

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
          1.0 // Per PNG, la qualitat és menys rellevant (lossless)
        );
      });
    } catch (error) {
      console.error("Error preprocessant la imatge:", error);
      showToast("Error millorant la imatge.", "error");
      throw error; // Propaga l'error
    }
  }

  /**
   * Normalitza una cadena de temps extreta per OCR a format HH:MM.
   * @param {string} timeStr - La cadena de temps potencialment bruta.
   * @returns {string} La cadena de temps normalitzada o una cadena buida si no és vàlida.
   */
  function normalizeTime(timeStr) {
    if (!timeStr) return "";
    // Elimina caràcters no desitjats, manté números i dos punts/guió
    let cleaned = timeStr.replace(/[^\d:-]/g, "");
    // Reemplaça guions per dos punts
    cleaned = cleaned.replace(/-/g, ":");
    // Intenta fer match amb HH:MM o H:MM (potencialment amb segons)
    const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      // Validació bàsica d'hores i minuts
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Formata a HH:MM
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}`;
      }
    }
    // console.warn(`[OCR Time] Format de temps no reconegut o invàlid: "${timeStr}" -> "${cleaned}"`);
    return ""; // Retorna buit si no es pot normalitzar
  }

  /**
   * Intenta omplir un camp de formulari i gestiona possibles errors.
   * @param {string} fieldId - L'ID de l'element del formulari.
   * @param {string} value - El valor a assignar.
   * @param {string} fieldName - Nom descriptiu del camp per als logs.
   */
  function safeSetFieldValue(fieldId, value, fieldName) {
    try {
      const element = document.getElementById(fieldId);
      if (element) {
        element.value = value;
        // console.log(`[OCR Fill] Camp ${fieldName} (${fieldId}) omplert amb: "${value}"`);
      } else {
        console.warn(
          `[OCR Fill] Element no trobat per al camp ${fieldName}: ${fieldId}`
        );
      }
    } catch (error) {
      console.error(
        `[OCR Fill] Error en omplir el camp ${fieldName} (${fieldId}):`,
        error
      );
    }
  }

  /**
   * Extreu i omple els camps relacionats amb les hores del servei.
   * @param {string} text - El text processat per OCR (en minúscules).
   * @param {string} suffix - El sufix de l'ID del camp (ex: '-1', '-2').
   */
  function fillTimes(text, suffix) {
    let timeFound = false;

    // 1) Hora d'origen ("status:mobilitzat HH:MM")
    const mobilitzatMatch = text.match(
      /status:\s*mobilitzat.*?(\d{1,2}[:\-]\d{1,2}(?:[:\-]\d{2})?)/i
    );
    const originTime = normalizeTime(mobilitzatMatch?.[1]);
    if (originTime) {
      safeSetFieldValue(`origin-time${suffix}`, originTime, "Hora Origen");
      timeFound = true;
    } else {
      // console.warn("[OCR Time] No s'ha trobat 'Hora Origen' (mobilitzat).");
    }

    // 2) Hora de destinació ("status:arribada hospital HH:MM")
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
    } else {
      // console.warn("[OCR Time] No s'ha trobat 'Hora Destí' (arribada hospital).");
    }

    // 3) Hora final ("altech ... DD/MM/YY HH:MM")
    // Regex millorada per ser més flexible amb l'espaiat i els separadors de data
    const endMatch = text.match(
      /altech.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})?\s+(\d{1,2}[:\-]\d{1,2}(?:[:\-]\d{2})?)/i
    );
    const endTime = normalizeTime(endMatch?.[2]); // Pren el grup de l'hora
    if (endTime) {
      safeSetFieldValue(`end-time${suffix}`, endTime, "Hora Final");
      timeFound = true;
    } else {
      // console.warn("[OCR Time] No s'ha trobat 'Hora Final' (altech). Assignant hora actual.");
      // Fallback a l'hora actual només si no s'ha trobat CAP altra hora
      if (!timeFound) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        safeSetFieldValue(
          `end-time${suffix}`,
          `${hh}:${mm}`,
          "Hora Final (Actual)"
        );
        // Considera si aquest fallback és realment desitjat o si és millor deixar-ho buit
      }
    }
    return timeFound;
  }

  /**
   * Extreu i omple els camps relacionats amb les dades del servei (número, origen, destí).
   * @param {string} text - El text processat per OCR (en minúscules).
   * @param {string} suffix - El sufix de l'ID del camp (ex: '-1', '-2').
   * @returns {boolean} True si s'ha trobat alguna dada de servei, false altrament.
   */
  function fillServiceData(text, suffix) {
    let dataFound = false;

    // Número de servei (Busca un número de 9 o 10 dígits, potser precedit per paraules clau)
    // Aquesta regex és més genèrica, busca 9 o 10 dígits junts en qualsevol lloc.
    // Si hi ha patrons més específics (ex: sempre després de 'servei n'), s'hauria d'ajustar.
    const serviceNumberMatch = text.match(/\b(\d{9,10})\b/);
    if (serviceNumberMatch?.[1]) {
      safeSetFieldValue(
        `service-number${suffix}`,
        serviceNumberMatch[1],
        "Número Servei"
      );
      dataFound = true;
    } else {
      // console.warn("[OCR Service] No s'ha trobat 'Número de Servei' (9-10 dígits).");
    }

    // Origen (Busca 'municipi' seguit de text, excloent números al principi)
    // Millora: Captura text fins a un salt de línia o una altra paraula clau si és necessari.
    const originMatch = text.match(
      /municipi\s*[:\-]?\s*([^\d\n\r][a-z\s\-\'À-ÿ]+)/i
    );
    if (originMatch?.[1]) {
      const originClean = originMatch[1].trim().toUpperCase();
      safeSetFieldValue(`origin${suffix}`, originClean, "Origen");
      dataFound = true;
    } else {
      // console.warn("[OCR Service] No s'ha trobat 'Origen' (després de 'municipi').");
    }

    // Destí (Busca 'hospital' seguit de text)
    // Millora: Similar a origen, captura fins a un límit raonable o paraula clau.
    const destinationMatch = text.match(
      /(?:hospital|desti)\s*[:\-]?\s*([a-z\s\-\'À-ÿ\d]+)/i
    );
    if (destinationMatch?.[1]) {
      // Neteja addicional: eliminar paraules comunes que no formen part del nom
      let destinationClean = destinationMatch[1]
        .replace(/desti/i, "")
        .trim()
        .toUpperCase();
      // Eliminar possibles números de telèfon o codis capturats erròniament si és un patró comú
      destinationClean = destinationClean.replace(/\b\d{5,}\b/g, "").trim();
      safeSetFieldValue(`destination${suffix}`, destinationClean, "Destí");
      dataFound = true;
    } else {
      // console.warn("[OCR Service] No s'ha trobat 'Destí' (després de 'hospital' o 'desti').");
    }

    return dataFound;
  }

  /**
   * Analitza el text extret per OCR i decideix quins camps omplir.
   * @param {string} ocrText - El text cru obtingut de Tesseract.
   */
  function processAndFillForm(ocrText) {
    if (!ocrText || !ocrText.trim()) {
      showToast("No s'ha pogut detectar text a la imatge.", "warning");
      return;
    }

    const textLower = ocrText.toLowerCase();
    // Neteja bàsica addicional (potser eliminar salts de línia excessius?)
    const cleanedText = textLower.replace(/\s+/g, " ").trim();

    const currentServiceIndex = getCurrentServiceIndex(); // Obté l'índex actual
    const suffix = `-${currentServiceIndex + 1}`; // Construeix el sufix per als IDs

    // Lògica millorada: Intenta omplir ambdós tipus de dades si es troben.
    // Això és més flexible que l'assumpció original d'un sol tipus per foto.
    let filledSomething = false;

    // Intenta omplir les hores
    const timeFilled = fillTimes(cleanedText, suffix);
    if (timeFilled) {
      // console.log("[OCR Proc] S'han trobat i omplert dades d'hores.");
      filledSomething = true;
    }

    // Intenta omplir les dades del servei
    const serviceDataFilled = fillServiceData(cleanedText, suffix);
    if (serviceDataFilled) {
      // console.log("[OCR Proc] S'han trobat i omplert dades de servei.");
      filledSomething = true;
    }

    // Feedback a l'usuari
    if (filledSomething) {
      showToast(
        "Camps del formulari actualitzats des de la imatge.",
        "success"
      );
    } else {
      showToast(
        "No s'ha trobat informació rellevant a la imatge per omplir el formulari.",
        "info"
      );
      // Podries mostrar el text OCR a l'usuari per a depuració o correcció manual?
      // console.log("[OCR Proc] Text detectat però no s'ha pogut mapejar a camps:\n", ocrText);
    }
  }

  /**
   * Gestiona l'esdeveniment de canvi del input de fitxer (selecció d'imatge).
   * Orquestra el flux d'OCR: preprocessament, reconeixement, ompliment del formulari.
   * @param {Event} event - L'esdeveniment 'change'.
   */
  async function handleFileChange(event) {
    if (isProcessing) {
      showToast("Ja hi ha un procés d'OCR en marxa.", "warning");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      // No és un error necessàriament, l'usuari pot haver cancel·lat.
      // console.log("No s'ha seleccionat cap fitxer.");
      return;
    }

    // Validació bàsica del tipus de fitxer
    if (!file.type.startsWith("image/")) {
      showToast("Si us plau, selecciona un fitxer d'imatge.", "error");
      cameraInput.value = ""; // Reseteja l'input
      return;
    }

    isProcessing = true;
    updateOcrProgress(0, "Iniciant escaneig...");
    let worker = null; // Defineix worker aquí per accedir-hi al finally

    try {
      // --- Preprocessament Opcional ---
      // Decideix si vols aplicar redimensionament i/o preprocessament.
      // Pots fer-ho configurable o basat en la mida del fitxer.
      let imageBlob = file;
      // console.log(`Mida original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      imageBlob = await resizeImage(file); // Redimensiona sempre si supera el límit
      // console.log(`Mida després de redimensionar: ${(imageBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // Aplica preprocessament addicional si es considera beneficiós
      // imageBlob = await preprocessImage(imageBlob);
      // console.log(`Mida després de preprocessar: ${(imageBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // --- Creació del Worker Tesseract ---
      updateOcrProgress(5, "Carregant motor OCR..."); // Progrés inicial
      worker = await Tesseract.createWorker(
        OCR_LANGUAGE,
        TESSERACT_ENGINE_MODE,
        {
          // logger: m => console.log(m) // Activa per depuració detallada
          logger: (m) => {
            if (m.status === "recognizing text") {
              const percent = Math.max(10, Math.floor(m.progress * 100)); // Comença des del 10%
              updateOcrProgress(percent, `Reconeixent text ${percent}%`);
            } else if (m.status === "loading language model") {
              updateOcrProgress(5, "Carregant model idioma...");
            }
            // Podries afegir més estats si cal
          },
          // Opcions de rendiment/memòria (si Tesseract les suporta via createWorker options)
          // cacheMethod: 'none', // Pot ajudar amb problemes de memòria en alguns entorns
        }
      );

      // --- Configuració de Paràmetres Tesseract ---
      await worker.setParameters({
        tessedit_char_whitelist: TESSERACT_CHAR_WHITELIST,
        // tessedit_pageseg_mode: TESSERACT_PAGE_SEG_MODE, // PSM ja configurat a createWorker
        // Paràmetres addicionals per millorar velocitat/precisió (alguns poden ser redundants amb OEM/PSM)
        load_system_dawg: false,
        load_freq_dawg: false,
        // user_defined_dpi: '300' // Pot ajudar si les imatges tenen DPI baix
      });

      // --- Reconeixement OCR ---
      updateOcrProgress(10, "Reconeixent text 10%"); // Assegura un progrés inicial
      const {
        data: { text: ocrText },
      } = await worker.recognize(imageBlob);
      updateOcrProgress(100, "Anàlisi completada."); // Mostra 100% abans de processar

      // --- Processament del text i ompliment del formulari ---
      processAndFillForm(ocrText);
    } catch (error) {
      console.error("[cameraOcr] Error durant el procés d'OCR:", error);
      showToast(`Error d'OCR: ${error.message || "Error desconegut"}`, "error");
      updateOcrProgress(0, "Error en l'escaneig."); // Actualitza UI en cas d'error
    } finally {
      // --- Neteja ---
      if (worker) {
        await worker.terminate();
        // console.log("Worker Tesseract finalitzat.");
      }
      if (cameraInput) {
        cameraInput.value = ""; // Reseteja l'input per permetre seleccionar el mateix fitxer
      }
      hideOcrProgress(); // Amaga la barra de progrés (amb retard)
      isProcessing = false; // Permet nous processaments
    }
  }

  /**
   * Funció principal d'inicialització del mòdul.
   */
  function initialize() {
    if (!checkRequiredElements()) {
      showToast(
        "Error inicialitzant la funció de càmera/OCR. Falten elements.",
        "error"
      );
      return; // Atura l'execució si falten elements clau
    }

    // --- Assignació d'Events ---
    cameraBtn.addEventListener("click", openModal);
    optionCameraBtn.addEventListener("click", triggerCameraCapture);
    optionGalleryBtn.addEventListener("click", triggerGallerySelection);
    cameraInput.addEventListener("change", handleFileChange);

    // Listener per tancar el modal fent clic fora
    document.addEventListener("click", handleOutsideClick);

    // Listener per tancar el modal amb la tecla 'Escape' (Millora Accessibilitat)
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

  // --- Punt d'Entrada ---
  // Espera que el DOM estigui completament carregat abans d'inicialitzar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize(); // Si el DOM ja està carregat
  }
})(); // Fi de l'IIFE
