/* cameraOcr.js - Versión completa */
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

  // Validación de elementos
  if (!cameraBtn || !cameraInput || !cameraGalleryModal || !modalContent) {
    console.warn("[cameraOcr] Elements no trobats.");
    return;
  }

  // Evento para abrir el modal
  cameraBtn.addEventListener("click", openModal);

  // Cerrar modal al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (
      cameraGalleryModal.classList.contains("visible") &&
      !modalContent.contains(e.target) &&
      !cameraBtn.contains(e.target)
    ) {
      closeModal();
    }
  });

  // Cerrar modal al hacer clic en los botones
  [optionCameraBtn, optionGalleryBtn].forEach((btn) =>
    btn.addEventListener("click", closeModal)
  );

  // Botón de Cámara
  optionCameraBtn.addEventListener("click", () => {
    cameraInput.setAttribute("capture", "environment");
    cameraInput.click();
  });

  // Botón de Galería
  optionGalleryBtn.addEventListener("click", () => {
    cameraInput.removeAttribute("capture");
    cameraInput.click();
  });

  // Evento para seleccionar imagen desde galería
  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      showToast("No s'ha seleccionat cap imatge.", "error");
      return;
    }

    // Progreso del OCR
    const progressContainer = document.getElementById("ocr-progress-container");
    const progressBar = document.getElementById("ocr-progress");
    const progressText = document.getElementById("ocr-progress-text");

    if (progressContainer && progressBar && progressText) {
      progressContainer.classList.remove("hidden");
      progressBar.value = 0;
      progressText.textContent = "Escanejant...";
    }

    // Configuración de Tesseract
    const worker = await Tesseract.createWorker("spa", 1, {
      logger: (e) => {
        if (e.status === "recognizing text") {
          const percent = Math.floor(e.progress * 100);
          progressBar.value = percent;
          progressText.textContent = `Escanejant ${percent}%`;
        }
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: 3,
      tessedit_char_whitelist:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:-",
      tessedit_oem: 1,
      tessedit_psm: 3,
      load_system_dawg: false,
      load_freq_dawg: false,
    });

    try {
      // Procesar imagen
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
      setTimeout(() => progressContainer?.classList.add("hidden"), 1000);
    }
  });

  // Funciones del modal
  function openModal() {
    cameraGalleryModal.classList.remove("hidden");
    requestAnimationFrame(() => cameraGalleryModal.classList.add("visible"));
  }

  function closeModal() {
    cameraGalleryModal.classList.remove("visible");
    setTimeout(() => cameraGalleryModal.classList.add("hidden"), 300);
  }

  // Evento para iniciar la cámara
  optionCameraBtn.addEventListener("click", () => {
    // Mostrar UI de la cámara y ocultar botones
    cameraUI.style.display = "block";
    optionCameraBtn.style.display = "none";
    optionGalleryBtn.style.display = "none";

    // Acceder a la cámara
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        cameraStream = stream;
        video.srcObject = stream;
        video.play();
      })
      .catch((error) => console.error("Error de cámara:", error));
  });

  // Tomar foto y procesar
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

    // Asignar resultados a campos
    results.forEach((result) => {
      const fieldId = `field-${result.field}`;
      document.getElementById(fieldId).value = result.text;
    });

    // Detener cámara y cerrar UI
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraUI.style.display = "none";
    optionCameraBtn.style.display = "block";
    optionGalleryBtn.style.display = "block";
  });

  // Procesar un marco con OCR
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

    return new Promise((resolve) => {
      cropCanvas.toBlob(async (blob) => {
        const worker = await Tesseract.createWorker({
          lang: "spa",
          logger: (m) => console.log(m),
        });
        await worker.load();
        const { data } = await worker.recognize(blob);
        await worker.terminate();
        resolve({
          field: fieldType,
          text: data.text.trim().toUpperCase(),
        });
      }, "image/png");
    });
  }
}

// Funciones de preprocesamiento (opcional)
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
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
}

async function preprocessImage(blob) {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = "brightness(110%) contrast(115%) grayscale(100%)";
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
}

// Lógica para llenar campos
function fillFormFieldsFromOcr(ocrText) {
  const textLower = ocrText.toLowerCase();
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Detectar tipo de datos
  const hasTimeData =
    /status:\s*mobilitzat/.test(textLower) ||
    /status:\s*arribada\s+hospital/.test(textLower) ||
    /altech\s+v\./.test(textLower);

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

// Llenado de campos de horas
function fillTimes(processedText, suffix) {
  const normalizeTime = (timeStr) => {
    const clean = timeStr.replace(/-/g, ":").replace(/[^0-9:]/g, "");
    return clean.length > 5 ? clean.slice(0, 5) : clean;
  };

  // Hora de origen
  const mobilitzatMatch = processedText.match(
    /status:\s*mobilitzat.*?(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i
  );
  if (mobilitzatMatch?.[1]) {
    const time = normalizeTime(mobilitzatMatch[1]);
    document.getElementById(`origin-time-${suffix}`).value = time;
  }

  // Hora de destino
  const arribadaMatch = processedText.match(
    /status:\s*arribada\s*hospital.*?(\d{1,2}[:\-]\d{2}(?:[:\-]\d{2})?)/i
  );
  if (arribadaMatch?.[1]) {
    const time = normalizeTime(arribadaMatch[1]);
    document.getElementById(`destination-time-${suffix}`).value = time;
  }

  // Hora final
  const endMatch = processedText.match(
    /altech[\s\S]*?\d{2}[-/]\d{2}[-/]\d{2}\s+(\d{1,2}[:\-]\d{2}).*?/i
  );
  if (endMatch?.[1]) {
    const time = normalizeTime(endMatch[1]);
    document.getElementById(`end-time-${suffix}`).value = time;
  } else {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    document.getElementById(`end-time-${suffix}`).value = currentTime;
  }
}

// Llenado de campos de servicio
function fillServiceData(processedText, suffix) {
  const textLower = processedText.toLowerCase();

  // Número de servicio
  const serviceNumberMatch = textLower.match(/afectats[\s\S]{0,100}(\d{9})/i);
  const serviceNumber = serviceNumberMatch?.[1] || "000000000";
  document.getElementById(`service-number-${suffix}`).value = serviceNumber;

  // Origen
  const originMatch = textLower.match(/municipi[\s\S]{0,100}([^\d\s\r\n]+)/i);
  if (originMatch?.[1]) {
    document.getElementById(`origin-${suffix}`).value = originMatch[1]
      .trim()
      .toUpperCase();
  }

  // Destino
  const destinationMatch = textLower.match(/hospital([\w\d\s]+)/i);
  if (destinationMatch?.[1]) {
    document.getElementById(`destination-${suffix}`).value = destinationMatch[1]
      .trim()
      .toUpperCase();
  }
}
