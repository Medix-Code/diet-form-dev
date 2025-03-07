/* cameraOcr.js
   Exemple amb un sol botó de càmera i un sol input de fitxer.
   En funció del text OCR, omple:
     - Camps d'hores (origin-time, destination-time, end-time)
     - Camps de servei (service-number, origin, destination)
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

    // Mostrem la barra de progrés i el missatge
    const progressContainer = document.getElementById("ocr-progress-container");
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

      // Processar l'imatge amb Tesseract
      const result = await window.Tesseract.recognize(file, "spa", {
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

      // Omplim els camps que pertoquin
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
  });
}

/**
 * Analitza el text OCR i omple:
 *   - Camps d'hores (origin-time, destination-time, end-time)
 *   - Camps de servei (service-number, origin, destination)
 */
function fillFormFieldsFromOcr(ocrText) {
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Convertim tot a minúscules per facilitar recerques
  const textLower = ocrText.toLowerCase();

  // 1) Omplir HORES (si trobem coincidències)
  fillTimes(textLower, suffix);

  // 2) Omplir dades de SERVEI (si trobem coincidències)
  fillServiceData(textLower, suffix);
}

/* -----------------------------------------
   Omplir camps d'Hores
----------------------------------------- */
function fillTimes(processedText, suffix) {
  // Busquem "status: mobilitzat", "status: arribada hospital", "altech v..."
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  // 1) Hora d'origen
  const mobilitzatMatch = processedText.match(
    /status:\s*mobilitzat\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (mobilitzatMatch?.[1]) {
    const timeValue = normalizeTime(mobilitzatMatch[1]);
    document.getElementById(`origin-time-${suffix}`).value = timeValue;
  }

  // 2) Hora de destinació
  const arribadaMatch = processedText.match(
    /status:\s*arribada\s+hospital\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (arribadaMatch?.[1]) {
    const timeValue = normalizeTime(arribadaMatch[1]);
    document.getElementById(`destination-time-${suffix}`).value = timeValue;
  }

  // 3) Hora final
  let endMatch = processedText.match(
    /altech\s+v\.[^\n]*\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (!endMatch) {
    endMatch = processedText.match(
      /altech\s+v\.[^\n]*\n\s*\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
    );
  }
  if (endMatch?.[1]) {
    const timeValue = normalizeTime(endMatch[1]);
    document.getElementById(`end-time-${suffix}`).value = timeValue;
  } else {
    // Fallback: si no trobem hora final, usem l'hora actual
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById(`end-time-${suffix}`).value = `${hh}:${mm}`;
  }
}

/* -----------------------------------------
   Omplir camps de Servei (Nº, Origen, Destino)
----------------------------------------- */
function fillServiceData(processedText, suffix) {
  // Ex. busquem un bloc de 7-9 dígits per Nº de servei
  const serviceNumberMatch = processedText.match(/\b(\d{7,9})\b/);
  if (serviceNumberMatch?.[1]) {
    document.getElementById(`service-number-${suffix}`).value =
      serviceNumberMatch[1];
  }

  // Busquem "municipi" per omplir Origen
  // Ajusta-ho segons el text real que aparegui a la pantalla
  const originMatch = processedText.match(/municipi\s*[:\-]?\s*(.*)/i);
  if (originMatch?.[1]) {
    const originClean = originMatch[1].split(/\r?\n/)[0].trim();
    document.getElementById(`origin-${suffix}`).value = originClean;
  }

  // Busquem "hospital" o "destino" per omplir Destino
  const destinationMatch = processedText.match(/hospital\s*(.*)/i);
  if (destinationMatch?.[1]) {
    const destClean = destinationMatch[1].split(/\r?\n/)[0].trim();
    document.getElementById(`destination-${suffix}`).value = destClean;
  }
}
