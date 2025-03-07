/* cameraOcr.js
   Exemple amb un sol botó de càmera i un sol input de fitxer.
   En funció del text OCR, omple:
     - Camps d'hores (origin-time, destination-time, end-time)
     - Camps de servei (service-number, origin, destination)
   Cada foto ha de contenir només un tipus de dades.
*/
import { showToast } from "../ui/toast.js";
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";

/** Inicialitza la lògica d'OCR amb un sol botó i input. */
export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraInput = document.getElementById("camera-input");

  if (!cameraBtn || !cameraInput) {
    console.warn("[cameraOcr] Botó o input no trobat.");
    return;
  }

  // Quan es clica el botó de càmera
  cameraBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      stream.getTracks().forEach((track) => track.stop());
      cameraInput.click();
    } catch (err) {
      console.error("[cameraOcr] Error en accedir a la càmera:", err);
      showToast("Error en accedir a la càmera: " + err.message, "error");
    }
  });

  // Quan l'usuari selecciona la imatge
  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn("[cameraOcr] No s'ha seleccionat cap fitxer.");
      showToast("No s'ha seleccionat cap imatge", "error");
      return;
    }

    // Creem una imatge per carregar el fitxer
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      // Reduïm la mida de la imatge per accelerar l'OCR
      const maxWidth = 800; // Amplada màxima
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convertim el canvas a blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Error en processar la imatge redimensionada", "error");
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
          console.log("[cameraOcr] Processant OCR (imatge redimensionada)...");

          // Processar la imatge redimensionada amb Tesseract
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
          cameraInput.value = "";
          if (progressContainer && progressBar) {
            progressBar.value = 100;
            setTimeout(() => {
              progressContainer.classList.add("hidden");
            }, 1500);
          }
        }
      }, file.type);
    };

    img.onerror = () => {
      showToast("Error en carregar la imatge", "error");
    };
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
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  const mobilitzatMatch = processedText.match(
    /status:\s*mobilitzat\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (mobilitzatMatch?.[1]) {
    document.getElementById(`origin-time-${suffix}`).value = normalizeTime(
      mobilitzatMatch[1]
    );
  }

  const arribadaMatch = processedText.match(
    /status:\s*arribada\s+hospital\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[-:]\d{2})/i
  );
  if (arribadaMatch?.[1]) {
    document.getElementById(`destination-time-${suffix}`).value = normalizeTime(
      arribadaMatch[1]
    );
  }
}

/* -----------------------------------------
   Funció per omplir camps de Servei (Nº, Origen, Destinació)
----------------------------------------- */
function fillServiceData(processedText, suffix) {
  const serviceNumberMatch = processedText.match(/\b(\d{9,10})\b/);
  if (serviceNumberMatch?.[1]) {
    document.getElementById(`service-number-${suffix}`).value =
      serviceNumberMatch[1];
  }

  const originMatch = processedText.match(/municipi\s*(?:\r?\n)+\s*(.*)/i);
  if (originMatch?.[1]) {
    document.getElementById(`origin-${suffix}`).value = originMatch[1].trim();
  }

  const destinationMatch = processedText.match(
    /hospital\s*desti\s*(?:\r?\n)+\s*(.*)/i
  );
  if (destinationMatch?.[1]) {
    document.getElementById(`destination-${suffix}`).value =
      destinationMatch[1].trim();
  }
}
