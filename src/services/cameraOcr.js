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

  // Verificamos que existan los elementos necesarios
  if (!cameraBtn || !cameraInput || !cameraGalleryModal || !modalContent) {
    console.warn("[cameraOcr] Faltan botones o modal.");
    return;
  }

  // Al hacer clic en el botón principal, abrimos el modal
  cameraBtn.addEventListener("click", (e) => {
    cameraGalleryModal.classList.remove("hidden");
    cameraGalleryModal.classList.add("visible");
    e.stopPropagation();
  });

  // Cerrar modal al hacer clic fuera
  document.addEventListener("click", (event) => {
    // Si el modal está visible y el clic no está dentro del contenido, cerramos
    if (
      cameraGalleryModal.classList.contains("visible") &&
      !modalContent.contains(event.target)
    ) {
      cameraGalleryModal.classList.remove("visible");
      cameraGalleryModal.classList.add("hidden");
    }
  });

  // Al hacer clic en los botones del modal (Cámara o Galería), también cerramos el modal
  [optionCameraBtn, optionGalleryBtn].forEach((btn) =>
    btn.addEventListener("click", () => {
      cameraGalleryModal.classList.remove("visible");
      cameraGalleryModal.classList.add("hidden");
    })
  );

  // Al hacer clic en "Cámara"
  optionCameraBtn.addEventListener("click", () => {
    cameraInput.setAttribute("capture", "environment");
    cameraInput.value = "";
    cameraInput.click();
    cameraGalleryModal.classList.add("hidden");
  });

  // Al hacer clic en "Galería"
  optionGalleryBtn.addEventListener("click", () => {
    cameraInput.removeAttribute("capture");
    cameraInput.value = "";
    cameraInput.click();
    cameraGalleryModal.classList.add("hidden");
  });

  // Cuando el usuario selecciona la imagen o toma la foto
  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn("[cameraOcr] No se ha seleccionado ningún archivo.");
      showToast("No se ha seleccionado ninguna imagen", "error");
      return;
    }

    // Ejemplo de procesamiento con Tesseract (ajústalo a tus necesidades):
    try {
      showToast("Procesando imagen...", "info");
      console.log("[cameraOcr] Procesando OCR...");

      const result = await window.Tesseract.recognize(file, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progressPercent = Math.floor(m.progress * 100);
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
