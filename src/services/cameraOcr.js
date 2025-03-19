/* cameraOcr.js - Correctament adaptat a Tesseract CDN (sense DataCloneError) */

import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

let cameraStream; // Para detener la cámara después

export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraGalleryModal = document.getElementById("camera-gallery-modal");
  const modalContent = cameraGalleryModal.querySelector(
    ".modal-bottom-content"
  );
  const optionCameraBtn = document.getElementById("option-camera");
  const optionGalleryBtn = document.getElementById("option-gallery");
  const cameraInput = document.getElementById("camera-input");
  const cameraUI = document.getElementById("camera-ui");
  const video = document.getElementById("camera-preview");
  const captureButton = document.getElementById("capture-button");

  // Ocultar UI de la cámara al iniciar
  cameraUI.style.display = "none";

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

    if (progressContainer && progressBar && progressText) {
      progressContainer.classList.remove("hidden");
      progressBar.value = 0;
      progressText.textContent = "Escanejant...";
    }

    const worker = await Tesseract.createWorker("spa", 1, {
      logger: (e) => {
        if (e.status === "recognizing text") {
          const percent = Math.floor(e.progress * 100);
          if (progressBar) progressBar.value = percent;
          if (progressText) progressText.textContent = `Escanejant ${percent}%`;
        }
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: 3,
      tessedit_char_whitelist:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-",
      // Afegeix això:
      tessedit_oem: 1, // Engine mode: LSTM
      tessedit_psm: 3, // Auto-page segmentation
      load_system_dawg: false, // Millora la velocitat
      load_freq_dawg: false,
    });

    try {
      //const resizedImageBlob = await resizeImage(file, 1000);
      //const preprocessedBlob = await preprocessImage(resizedImageBlob);
      const preprocessedBlob = file;

      const {
        data: { text: ocrText },
      } = await worker.recognize(preprocessedBlob);

      if (!ocrText.trim()) {
        showToast("No s'ha detectat cap text.", "error");
        return;
      }

      fillFormFieldsFromOcr(ocrText);
      showToast("OCR completat amb èxit.", "success");
    } catch (error) {
      showToast(`Error en OCR: ${error.message}`, "error");
    } finally {
      await worker.terminate();
      cameraInput.value = "";
      if (progressContainer)
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

  // Evento para el botón de Cámara
  optionCameraBtn.addEventListener("click", () => {
    // Mostrar UI de la cámara y ocultar botones originales
    cameraUI.style.display = "block";
    optionCameraBtn.style.display = "none";
    optionGalleryBtn.style.display = "none";

    // Iniciar la cámara
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment" },
      })
      .then((stream) => {
        cameraStream = stream;
        video.srcObject = stream;
        video.play();
      })
      .catch((error) => console.error("Error de cámara:", error));
  });

  // Evento para tomar foto
  captureButton.addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Procesar cada marco
    const results = await Promise.all([
      processFrame("frame-service", "service-number"),
      processFrame("frame-origin", "origin"),
      processFrame("frame-destination", "destination"),
    ]);

    // Mostrar resultados en los campos
    results.forEach((result) => {
      const fieldId = `field-${result.field}`;
      document.getElementById(fieldId).value = result.text;
    });

    // Detener la cámara y cerrar UI
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraUI.style.display = "none";
    optionCameraBtn.style.display = "block";
    optionGalleryBtn.style.display = "block";
  });

  // Función para procesar un marco
  async function processFrame(frameId, fieldType) {
    const frame = document.getElementById(frameId);
    const rect = frame.getBoundingClientRect();
    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d");
    cropCanvas.width = rect.width;
    cropCanvas.height = rect.height;

    cropCtx.drawImage(
      canvas,
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );

    // Convertir a Blob y procesar con Tesseract
    return new Promise((resolve) => {
      cropCanvas.toBlob(async (blob) => {
        const worker = await Tesseract.createWorker({
          lang: "spa",
          logger: (m) => console.log(m),
        });
        await worker.load();
        const { data } = await worker.recognize(blob);
        await worker.terminate();
        resolve({ field: fieldType, text: data.text.trim().toUpperCase() });
      }, "image/png");
    });
  }
}

async function resizeImage(file, maxDimension = 1000) {
  const img = await createImageBitmap(file);
  let { width, height } = img;
  const ratio = Math.min(maxDimension / width, maxDimension / height, 1);
  width *= ratio;
  height *= ratio;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0)); // 1.0 = qualitat màxima sense compressió
}

async function preprocessImage(blob) {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = "brightness(110%) contrast(115%) grayscale(100%)";
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0)); // 1.0 = qualitat màxima sense compressió
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
  const normalizeTime = (timeStr) => {
    // Normaliza formatos como "25-24" a "22:25" (ejemplo hipotético)
    // Si el tiempo tiene más de 5 caracteres (ej: "23:25:08"), toma los primeros 5
    const clean = timeStr.replace(/-/g, ":").replace(/[^0-9:]/g, "");
    return clean.length > 5 ? clean.slice(0, 5) : clean;
  };

  console.log("Texto procesado:", processedText); // Log para depuración

  // 1) Hora de origen: "status:mobilitzat"
  const mobilitzatMatch = processedText.match(
    /status:\s*mobilitzat.*?(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i
  );
  if (mobilitzatMatch?.[1]) {
    const time = normalizeTime(mobilitzatMatch[1]);
    document.getElementById(`origin-time-${suffix}`).value = time;
    console.log("Origem encontrado:", time);
  } else {
    console.warn("No se encontró hora de origen");
  }

  // 2) Hora de destino: "status:arribada hospital"
  const arribadaMatch = processedText.match(
    /status:\s*arribada\s*hospital.*?(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i
  );
  if (arribadaMatch?.[1]) {
    const time = normalizeTime(arribadaMatch[1]);
    document.getElementById(`destination-time-${suffix}`).value = time;
    console.log("Destino encontrado:", time);
  } else {
    console.warn("No se encontró hora de destino");
  }

  // 3) Hora final: "altech" seguido de fecha y hora
  const endMatch = processedText.match(
    /altech[\s\S]*?\d{2}[-/]\d{2}[-/]\d{2}\s+(\d{1,2}[:\-]\d{2}).*?/i
  );
  if (endMatch?.[1]) {
    const time = normalizeTime(endMatch[1]);
    document.getElementById(`end-time-${suffix}`).value = time;
    console.log("Hora final encontrada:", time);
  } else {
    console.warn("No se encontró hora final. Usando hora actual");
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;
    document.getElementById(`end-time-${suffix}`).value = currentTime;
    console.log("Hora final asignada automáticamente:", currentTime);
  }
}

/**
 * Rellena los campos de servicio (Nº, Origen, Destino)
 */

function fillServiceData(processedText, suffix) {
  const textLower = processedText.toLowerCase();

  // Número de servicio
  const serviceNumberMatch = textLower.match(/afectats[\s\S]{0,100}(\d{9})/i);
  const serviceNumber = serviceNumberMatch?.[1] || "000000000";
  document.getElementById(`service-number-${suffix}`).value = serviceNumber;

  // Origen (Municipi)
  const originMatch = textLower.match(/municipi[\s\S]{0,100}([^\d\s\r\n]+)/i);
  if (originMatch?.[1]) {
    const originClean = originMatch[1].trim().toUpperCase();
    document.getElementById(`origin-${suffix}`).value = originClean;
  } else {
    console.warn("[OCR] No se encontró origen después de 'Municipi'");
  }

  // Destino (Hospital)
  const destinationMatch = textLower.match(/hospital([\w\d\s]+)/i);
  if (destinationMatch?.[1]) {
    const destinationClean = destinationMatch[1].trim().toUpperCase();
    document.getElementById(`destination-${suffix}`).value = destinationClean;
  } else {
    console.warn("[OCR] No se encontró destino después de 'Hospital'");
  }
}
