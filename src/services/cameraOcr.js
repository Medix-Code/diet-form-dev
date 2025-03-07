/* cameraOcr.js
   Lògica per capturar una foto (en dispositius mòbils) i passar-la per OCR amb Tesseract.
   S'ha afegit una barra de progrés i un missatge per informar l'usuari mentre s'escaneja,
   i es demanen els permisos de la càmera només quan es clica la icona de càmera.
*/
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";
import { showToast } from "../ui/toast.js"; // Assegura't d'importar la funció de toast

export function initCameraOcr() {
  // Utilitzem el botó de la càmera dins del menú d'opcions
  const cameraBtn = document.getElementById("camera-in-dropdown");
  const cameraInput = document.getElementById("camera-input");

  if (!cameraBtn || !cameraInput) {
    console.warn("[cameraOcr] Botó o input no trobat.");
    return;
  }

  // Quan es clica el botó de càmera, demanem permisos i obrim l'input per capturar la imatge
  cameraBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Aturem els tracks perquè només volem comprovar els permisos
      stream.getTracks().forEach((track) => track.stop());
      // Obrim l'input per seleccionar/capturar la imatge
      cameraInput.click();
    } catch (err) {
      console.error("[cameraOcr] Error en accedir a la càmera:", err);
      showToast("Error en accedir a la càmera: " + err.message, "error");
    }
  });

  // Quan l'usuari selecciona la imatge...
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

      if (!result || !result.data || !result.data.text) {
        console.warn("[cameraOcr] No s'ha detectat cap text.");
        showToast("No s'ha detectat text a la imatge", "error");
        return;
      }

      const ocrText = result.data.text;
      console.log("[cameraOcr] Text OCR detectat:", ocrText);
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
 * Extreu les hores (HH:MM) dels estats:
 *   - "STATUS: MOBILITZAT ..."  → assigna a "origin-time-{n}"
 *   - "STATUS: ARRIBADA HOSPITAL ..." → assigna a "destination-time-{n}"
 *   - Línia "altech v.X" i la següent data/hora → assigna a "end-time-{n}"
 *
 * Es permeten tant ":" com "-" com a separadors. Es converteixen a ":".
 */
export function fillFormFieldsFromOcr(ocrText) {
  // 1. Separa el text en línies
  const lines = ocrText.split(/\r?\n/);

  // 2. Filtra només les línies rellevants ("status:" o "altech")
  const filteredLines = lines.filter(
    (line) =>
      line.toLowerCase().includes("status:") ||
      line.toLowerCase().includes("altech")
  );

  // 3. Uneix les línies filtrades i converteix-les a minúscules
  const processedText = filteredLines.join("\n").toLowerCase();

  // Obtenim l'índex del servei actual i definim el sufix (1-based)
  const currentServiceIndex = getCurrentServiceIndex();
  const suffix = currentServiceIndex + 1;

  // Funció auxiliar per normalitzar el temps (substitueix guions per dos punts)
  const normalizeTime = (timeStr) => timeStr.replace(/-/g, ":");

  // ---------------------------------------
  // 1) MOBILITZACIÓ → Hora d'origen (origin-time-{suffix})
  const mobilitzatMatch = processedText.match(
    /status:\s*mobilitzat\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (mobilitzatMatch && mobilitzatMatch[1]) {
    const timeValue = normalizeTime(mobilitzatMatch[1]);
    document.getElementById(`origin-time-${suffix}`).value = timeValue;
  }

  // ---------------------------------------
  // 2) ARRIBADA HOSPITAL → Hora de destinació (destination-time-{suffix})
  const arribadaMatch = processedText.match(
    /status:\s*arribada\s+hospital\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (arribadaMatch && arribadaMatch[1]) {
    const timeValue = normalizeTime(arribadaMatch[1]);
    document.getElementById(`destination-time-${suffix}`).value = timeValue;
  }

  // ---------------------------------------
  // 3) HORA FINAL → Extreu de la línia amb "altech v.X" i la següent data/hora
  // Exemple:
  //   altech v.08.0
  //   23/07/23 07:17:49
  let endMatch = processedText.match(
    /altech\s+v\.[^\n]*\s+\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
  );
  if (!endMatch) {
    endMatch = processedText.match(
      /altech\s+v\.[^\n]*\n\s*\d{2}[\/\-]\d{2}[\/\-]\d{2}\s+(\d{2}[:\-]\d{2})[:\-]\d{2}/i
    );
  }
  if (endMatch && endMatch[1]) {
    const timeValue = normalizeTime(endMatch[1]);
    document.getElementById(`end-time-${suffix}`).value = timeValue;
  } else {
    // Fallback: si no s'ha extret la hora final, s'utilitza la hora actual
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;
    document.getElementById(`end-time-${suffix}`).value = currentTime;
    console.log(
      `[cameraOcr] No s'ha detectat la hora final; s'ha assignat la hora actual: ${currentTime}`
    );
  }

  console.log(
    `[cameraOcr] Camps actualitzats per al servei S${suffix} a partir d'OCR.`
  );
}
