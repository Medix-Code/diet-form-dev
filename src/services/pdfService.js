/**
 * Lògica per generar i descarregar PDFs
 */

import { getCurrentTab } from "../ui/tabs.js";
import { showToast } from "../ui/toast.js";
import { handleSaveDietWithPossibleOverwrite } from "./dietService.js";
import { gatherAllData } from "./formService.js";
import { validateDadesTab, validateServeisTab } from "../utils/validation.js";
import { isAppInstalled, showInstallPrompt } from "./pwaService.js";

/**
 * Coordenades generals per la plantilla PDF
 */
const generalFieldCoordinates = {
  date: { x: 155, y: 731, size: 16, color: "#000000" },
  vehicleNumber: { x: 384, y: 731, size: 16, color: "#000000" },
  person1: { x: 65, y: 368, size: 16, color: "#000000" },
  person2: { x: 320, y: 368, size: 16, color: "#000000" },
};

/**
 * Coordenades base per cada servei
 */
const baseServiceFieldCoordinates = {
  serviceNumber: { x: 130, y: 715, size: 16, color: "#000000" },
  origin: { x: 232, y: 698, size: 16, color: "#000000" },
  originTime: { x: 441, y: 698, size: 16, color: "#000000" },
  destination: { x: 232, y: 683, size: 16, color: "#000000" },
  destinationTime: { x: 441, y: 681, size: 16, color: "#000000" },
  endTime: { x: 441, y: 665, size: 16, color: "#000000" },
};

/**
 * Coordenades per a les firmes
 */
const signatureCoordinates = {
  conductor: { x: 125, y: 295, width: 100, height: 50 },
  ajudant: { x: 380, y: 295, width: 100, height: 50 },
};

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length !== 6) return null;
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function formatDateForPdf(dateString) {
  const [yyyy, mm, dd] = dateString.split("-");
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
}

/**
 * Omple un PDF amb les dades (fa servir PDFLib, que ha d'estar a window.PDFLib)
 */
export async function fillPdf(data, servicesData) {
  try {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

    const pdfBytes = await fetch("./template.pdf").then((r) => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Camps generals
    for (const [field, coords] of Object.entries(generalFieldCoordinates)) {
      let value = data[field] || "";
      if (field === "date" && value !== "") {
        value = formatDateForPdf(value);
      }
      const rgbVal = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
      page.drawText(value, {
        x: coords.x,
        y: coords.y,
        size: coords.size,
        font: helveticaFont,
        color: rgb(rgbVal.r / 255, rgbVal.g / 255, rgbVal.b / 255),
      });
    }

    // Camps de serveis
    servicesData.forEach((serv, idx) => {
      const yOffset = idx * 82;
      for (const [field, coords] of Object.entries(
        baseServiceFieldCoordinates
      )) {
        const val = serv[field] || "";
        const rgbVal = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
        page.drawText(val, {
          x: coords.x,
          y: coords.y - yOffset,
          size: coords.size,
          font: helveticaFont,
          color: rgb(rgbVal.r / 255, rgbVal.g / 255, rgbVal.b / 255),
        });
      }
    });

    // Firmes
    if (data.signatureConductor) {
      const pngImage = await pdfDoc.embedPng(data.signatureConductor);
      const coords = signatureCoordinates.conductor;
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
    }
    if (data.signatureAjudant) {
      const pngImage = await pdfDoc.embedPng(data.signatureAjudant);
      const coords = signatureCoordinates.ajudant;
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error("Error en fillPdf:", error);
    throw error;
  }
}

/**
 * Funció principal per generar i descarregar el PDF
 */
export async function generateAndDownloadPdf() {
  const dadesOK = validateDadesTab();
  const serveisOK = validateServeisTab();

  if (!validateForPdf()) {
    showToast("Falta rellenar los campos obligatorios.", "error");
    return;
  }

  // Són booleans: si hi ha error => false
  if (currentTab === "dades") {
    if (!dadesOK) {
      // Ens quedem
      showToast("Faltan campos obligatorios en 'Datos'.", "error");
      return;
    }
    // Si la pestanya actual (dades) no té error però Serveis sí...
    if (!serveisOK) {
      // Posem blink a tab-serveis
      document.getElementById("tab-serveis").classList.add("blink-error");
      showToast("Completa los campos en la pestaña 'Servicios'.", "error");
      return;
    }
  } else {
    // currentTab === "serveis"
    if (!serveisOK) {
      showToast("Faltan campos obligatorios en 'Servicios'.", "error");
      return;
    }
    if (!dadesOK) {
      document.getElementById("tab-dades").classList.add("blink-error");
      showToast("Completa los campos en la pestaña 'Datos'.", "error");
      return;
    }
  }

  try {
    const { generalData, servicesData } = gatherAllData();
    const pdfBytes = await fillPdf(generalData, servicesData);

    const fileName = buildPdfFileName(generalData.date, generalData.dietType);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Després de generar PDF, guardem la dieta
    await handleSaveDietWithPossibleOverwrite();

    incrementPdfDownloadCountAndMaybeShowPrompt();
    console.log("Generando y descargando el PDF...");
  } catch (err) {
    console.error("[app] Error generando el PDF:", err);
  }
}

/**
 * Construeix el nom del fitxer PDF
 */
export function buildPdfFileName(dateValue, dietType) {
  const [yyyy, mm, dd] = (dateValue || "").split("-");
  if (!yyyy || !mm || !dd) return "dieta.pdf";
  const formatted = `${dd}_${mm}_${yyyy}`;
  if (dietType === "lunch") return `dieta_comida_${formatted}.pdf`;
  if (dietType === "dinner") return `dieta_cena_${formatted}.pdf`;
  return `dieta_${formatted}.pdf`;
}

/**
 * Comptador de descàrregues i potser mostrar el prompt d'instal·lació
 */
export function incrementPdfDownloadCountAndMaybeShowPrompt() {
  console.log("incrementPdfDownloadCountAndMaybeShowPrompt() s'ha executat");
  const installed = isAppInstalled();
  const neverShow = localStorage.getItem("neverShowInstallPrompt") === "true";

  if (installed || neverShow) return;

  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  console.log(
    "Veces que el usuario ha rechazado la instalación:",
    timesUserSaidNo
  );

  // CAS 1: L'usuari encara no ha dit que NO cap vegada
  if (timesUserSaidNo === 0) {
    setTimeout(() => {
      console.log("Mostrando prompt por primera vez...");
      showInstallPrompt();
    }, 5000);
    return;
  }

  // CAS 2: L'usuari ha dit "No" 1 vegada
  if (timesUserSaidNo === 1) {
    let pdfDownloadsSinceNo = +localStorage.getItem("pdfDownloadsSinceNo") || 0;
    pdfDownloadsSinceNo++;
    localStorage.setItem("pdfDownloadsSinceNo", String(pdfDownloadsSinceNo));

    console.log("PDFs descargados desde el último no:", pdfDownloadsSinceNo);
    if (pdfDownloadsSinceNo >= 7) {
      setTimeout(() => {
        console.log("Mostrando prompt PWA (después de 7 descargas)...");
        showInstallPrompt();
      }, 5000);
    }
  }
}
