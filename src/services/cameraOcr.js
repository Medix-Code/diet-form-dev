/* cameraOcr.js
   Lògica per capturar una foto (en dispositius mòbils) i passar-la per OCR amb Tesseract.
   Ajusta-ho segons les teves necessitats.
*/
import { getCurrentServiceIndex } from "../services/servicesPanelManager.js";
import { showToast } from "../ui/toast.js"; // Assegura't d'importar la funció de toast

export function initCameraOcr() {
  const cameraBtn = document.getElementById("camera-btn");
  const cameraInput = document.getElementById("camera-input");

  if (!cameraBtn || !cameraInput) {
    console.warn("[cameraOcr] Botó o input no trobat.");
    return;
  }

  // 📷 Comprovem permisos i disponibilitat de la càmera abans d'inicialitzar l'OCR
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      console.log("[cameraOcr] ✅ Permisos concedits per la càmera.");
      stream.getTracks().forEach((track) => track.stop()); // Aturem la càmera després de la prova
    })
    .catch((err) => {
      console.error("[cameraOcr] ❌ Error d'accés a la càmera:", err);

      // 📢 Gestionem errors específics
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        showToast("⚠️ No s'ha trobat cap càmera al dispositiu", "error");
      } else if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        showToast(
          "🚫 Accés a la càmera denegat. Revisa els permisos del navegador.",
          "error"
        );
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        showToast(
          "⚠️ La càmera està sent utilitzada per una altra aplicació",
          "error"
        );
      } else {
        showToast("❌ Error desconegut en accedir a la càmera", "error");
      }
    });

  // 🟢 Quan es clica el botó de càmera, obrim l'input per capturar una imatge
  cameraBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  // 🟡 Quan l'usuari captura la imatge i la selecciona
  cameraInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn("[cameraOcr] No s'ha seleccionat cap fitxer.");
      showToast("No s'ha seleccionat cap imatge", "error");
      return;
    }

    try {
      showToast("Escanejant...", "info");
      console.log("[cameraOcr] Processant OCR...");

      const result = await window.Tesseract.recognize(file, "spa");

      if (!result || !result.data || !result.data.text) {
        console.warn("[cameraOcr] No s'ha detectat cap text.");
        showToast("No s'ha detectat text a la imatge", "error");
        return;
      }

      const ocrText = result.data.text;
      console.log("[cameraOcr] Text OCR detectat:", ocrText);

      // Emplenar camps del formulari
      fillFormFieldsFromOcr(ocrText);
      showToast("OCR complet!", "success");
    } catch (err) {
      console.error("[cameraOcr] Error OCR:", err);
      console.error("Missatge:", err.message);
      console.error("Traça d'errors:", err.stack);
      showToast("Error al processar la imatge: " + err.message, "error");
    } finally {
      // Netejar l'input per permetre una nova foto
      cameraInput.value = "";
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
