/* cameraOcr.js
   Exemple amb un sol botó de càmera personalitzada.
   En funció del text OCR, omple:
     - Camps d'hores (origin-time, destination-time, end-time)
     - Camps de servei (service-number, origin, destination)
   Cada foto ha de contenir només un tipus de dades.
*/
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

/** Inicialitza la lògica d'OCR amb una càmera personalitzada. */
export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraContainer = document.getElementById("camera-container");
  const captureBtn = document.getElementById("capture-btn");
  const capturedCanvas = document.getElementById("captured-canvas");

  if (!cameraBtn || !cameraContainer || !captureBtn || !capturedCanvas) {
    console.warn("[cameraOcr] Elements de càmera no trobats.");
    return;
  }

  // Quan es clica el botó de càmera, inicialitzem el flux de vídeo i mostrem el contenidor
  cameraBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById("camera-stream");
      video.srcObject = stream;
      cameraContainer.classList.remove("hidden");
      cameraBtn.disabled = true; // Evitem clics repetits
    } catch (err) {
      console.error("[cameraOcr] Error en accedir a la càmera:", err);
      showToast("Error en accedir a la càmera: " + err.message, "error");
    }
  });

  // Quan es clica el botó de captura, prenem la imatge i executem l'OCR
  captureBtn.addEventListener("click", () => {
    const video = document.getElementById("camera-stream");
    const canvas = capturedCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Aturem el flux de la càmera
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Convertim el canvas a blob i processem amb Tesseract
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast("Error al capturar la imatge", "error");
        return;
      }

      // Mostrem la barra de progrés i el missatge
      const progressContainer = document.getElementById(
        "ocr-progress-container"
      );
      const progressBar = document.getElementById("ocr-progress");
      const progressText = document.getElementById("ocr-progress-text");
      if (progressContainer && progressBar && progressText) {
        progressContainer.classList.remove("hidden");
        progressBar.value = 0;
        progressText.textContent = "Escanejant...";
      }

      try {
        showToast("Escanejant...", "info");
        console.log("[cameraOcr] Processant OCR...");

        const result = await window.Tesseract.recognize(blob, "spa", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const progressPercent = Math.floor(m.progress * 100);
              if (progressBar) progressBar.value = progressPercent;
              if (progressText)
                progressText.textContent = `Escanejant... ${progressPercent}%`;
            }
          },
        });

        if (!result?.data?.text) {
          console.warn("[cameraOcr] No s'ha detectat cap text.");
          showToast("No s'ha detectat text a la imatge", "error");
          return;
        }

        const ocrText = result.data.text;
        console.log("[cameraOcr] Text OCR detectat:", ocrText);
        // Analitza el text OCR i omple els camps corresponents
        fillFormFieldsFromOcr(ocrText);
        showToast("OCR complet!", "success");
      } catch (err) {
        console.error("[cameraOcr] Error OCR:", err);
        showToast("Error al processar la imatge: " + err.message, "error");
      } finally {
        if (progressContainer && progressBar) {
          progressBar.value = 100;
          setTimeout(() => {
            progressContainer.classList.add("hidden");
          }, 1500);
        }
        // Amaguem el contenidor de càmera i reactivem el botó
        cameraContainer.classList.add("hidden");
        cameraBtn.disabled = false;
      }
    }, "image/png");
  });
}

/**
 * Analitza el text OCR i omple:
 *   - Camps d'hores (origin-time, destination-time, end-time)
 *   - Camps de servei (service-number, origin, destination)
 *
 * Cada foto ha de contenir només un tipus de dades.
 */
function fillFormFieldsFromOcr(ocrText) {
  const textLower = ocrText.toLowerCase();
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Comprovem si hi ha dades d'hores
  const hasTimeData =
    /status:\s*mobilitzat/.test(textLower) ||
    /status:\s*arribada\s+hospital/.test(textLower) ||
    /altech\s+v\./.test(textLower);

  // Comprovem si hi ha dades de servei (només si no es detecta informació d'hores)
  const hasServiceData =
    !hasTimeData &&
    (/\b\d{9,10}\b/.test(textLower) ||
      /municipi/.test(textLower) ||
      /hospital\s*desti/.test(textLower));

  if (hasTimeData) {
    fillTimes(textLower, suffix);
    showToast("Dades d'hores omplertes!", "success");
  } else if (hasServiceData) {
    fillServiceData(textLower, suffix);
    showToast("Dades de servei omplertes!", "success");
  } else {
    showToast("No s'ha detectat informació per omplir.", "error");
  }
}

/* -----------------------------------------
   Funció per omplir camps d'Hores
----------------------------------------- */
function fillTimes(processedText, suffix) {
  // Funció per normalitzar l'hora: substitueix guions per dos punts
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  // 1) Hora d'origen: "status: mobilitzat"
  const mobilitzatMatch = processedText.match(
    /s?t?a?t?u?s?:?\s*mobil\w*\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (mobilitzatMatch?.[1]) {
    document.getElementById(`origin-time-${suffix}`).value = normalizeTime(
      mobilitzatMatch[1]
    );
  }

  // 2) Hora de destinació: "status: arribada hospital"
  const arribadaMatch = processedText.match(
    /s?t?a?t?u?s?:?\s*a?r?r?i?b?a?d?a?\s+h?o?s?p?i?t?a?l?\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (arribadaMatch?.[1]) {
    document.getElementById(`destination-time-${suffix}`).value = normalizeTime(
      arribadaMatch[1]
    );
  }

  // 3) Hora final: cercar "altech" (sense "v.")
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
    // Fallback: si no es troba hora final, usem l'hora actual
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById(`end-time-${suffix}`).value = `${hh}:${mm}`;
  }
}

/* -----------------------------------------
   Funció per omplir camps de Servei (Nº, Origen, Destinació)
----------------------------------------- */
function fillServiceData(processedText, suffix) {
  // 1) Nº de servei: cercar un bloc de 9-10 dígits
  const serviceNumberMatch = processedText.match(/\b(\d{9,10})\b/);
  if (serviceNumberMatch?.[1]) {
    document.getElementById(`service-number-${suffix}`).value =
      serviceNumberMatch[1];
  }

  // 2) Origen: cercar "municipi" i extreure la línia següent
  const originMatch = processedText.match(/municipi\s*(?:\r?\n)+\s*(.*)/i);
  if (originMatch?.[1]) {
    const originClean = originMatch[1].split(/\r?\n/)[0].trim();
    document.getElementById(`origin-${suffix}`).value = originClean;
  }

  // 3) Destinació: cercar "hospital desti" i extreure la línia següent
  const destinationMatch = processedText.match(
    /hospital\s*desti\s*(?:\r?\n)+\s*(.*)/i
  );
  if (destinationMatch?.[1]) {
    const destClean = destinationMatch[1].split(/\r?\n/)[0].trim();
    document.getElementById(`destination-${suffix}`).value = destClean;
  }
}
