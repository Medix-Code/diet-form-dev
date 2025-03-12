//pdfService.js
/**
 * Lógica para generar y descargar PDFs.
 */

import { getCurrentTab } from "../ui/tabs.js";
import { showToast } from "../ui/toast.js";
import { handleSaveDietWithPossibleOverwrite } from "./dietService.js";
import { gatherAllData } from "./formService.js";
import { validateDadesTab, validateServeisTab } from "../utils/validation.js";
import { isAppInstalled, showInstallPrompt } from "./pwaService.js";

/**
 * Coordenadas generales para la plantilla PDF.
 */
const generalFieldCoordinates = {
  date: { x: 155, y: 731, size: 16, color: "#000000" },
  vehicleNumber: { x: 384, y: 731, size: 16, color: "#000000" },
  person1: { x: 65, y: 368, size: 16, color: "#000000" },
  person2: { x: 320, y: 368, size: 16, color: "#000000" },
};

/**
 * Coordenadas base para cada servicio.
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
 * Coordenadas para las firmas.
 */
const signatureCoordinates = {
  conductor: { x: 125, y: 295, width: 100, height: 50 },
  ayudante: { x: 380, y: 295, width: 100, height: 50 },
};

/**
 * Coordenadas para la marca de agua.
 */
const fixedTextCoordinates = {
  website: { x: 250, y: 20, size: 6, color: "#EEEEEE" }, // Ajustar x, y y size según el PDF
};

/**
 * Convierte un color HEX (ej: "#ffffff") a su representación RGB.
 * @param {string} hex - El color en formato hexadecimal.
 * @returns {{r: number, g: number, b: number} | null}
 */
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length !== 6) return null;
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

/**
 * Formatea una fecha "YYYY-MM-DD" a "DD/MM/YYYY" para mostrar en el PDF.
 * @param {string} dateString - La fecha en formato "YYYY-MM-DD".
 * @returns {string} - La fecha formateada como "DD/MM/YYYY".
 */
function formatDateForPdf(dateString) {
  const [yyyy, mm, dd] = dateString.split("-");
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
}

/**
 * Rellena un PDF con los datos proporcionados (usa PDFLib en window.PDFLib).
 * @param {object} data - Objeto con datos generales (fecha, vehículo, etc.).
 * @param {object[]} servicesData - Array de objetos con datos de servicios.
 * @returns {Promise<Uint8Array>} - Bytes del PDF resultante.
 */
export async function fillPdf(data, servicesData) {
  try {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

    // Selecciona la plantilla PDF en función de la empresa
    let pdfTemplateUrl = "./dieta_tsc.pdf";
    if (data.empresa === "empresa1") {
      pdfTemplateUrl = "./dieta_tsc.pdf";
    } else if (data.empresa === "empresa2") {
      pdfTemplateUrl = "./dieta_tsc.pdf";
    }

    // Carga la plantilla PDF en memoria
    const pdfBytes = await fetch(pdfTemplateUrl).then((r) => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // ==========================================
    // 1) Rellenar Campos Generales
    // ==========================================
    for (const [field, coords] of Object.entries(generalFieldCoordinates)) {
      let value = data[field] || "";
      if (field === "date" && value !== "") {
        value = formatDateForPdf(value);
      }
      const { r, g, b } = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
      page.drawText(value, {
        x: coords.x,
        y: coords.y,
        size: coords.size,
        font: helveticaFont,
        color: rgb(r / 255, g / 255, b / 255),
      });
    }

    // ==========================================
    // 2) Rellenar Datos de los Servicios
    // ==========================================
    servicesData.forEach((serv, idx) => {
      const yOffset = idx * 82; // Cada servicio se desplaza 82 px verticalmente
      for (const [field, coords] of Object.entries(
        baseServiceFieldCoordinates
      )) {
        const val = serv[field] || "";
        const { r, g, b } = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
        page.drawText(val, {
          x: coords.x,
          y: coords.y - yOffset,
          size: coords.size,
          font: helveticaFont,
          color: rgb(r / 255, g / 255, b / 255),
        });
      }
    });

    // ==========================================
    // 3) Insertar Firmas
    // ==========================================
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
      const coords = signatureCoordinates.ayudante; // Ajustado a "ayudante"
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
    }

    // ==========================================
    // 4) Agregar marca de agua ("misdietas.com")
    // ==========================================
    const { r, g, b } = hexToRgb(fixedTextCoordinates.website.color) || {
      r: 0,
      g: 0,
      b: 0,
    };
    const text = "misdietas.com";
    const textWidth = helveticaFont.widthOfTextAtSize(
      text,
      fixedTextCoordinates.website.size
    );
    const pageWidth = page.getWidth();
    const xCentered = (pageWidth - textWidth) / 2;

    page.drawText(text, {
      x: xCentered,
      y: fixedTextCoordinates.website.y,
      size: fixedTextCoordinates.website.size,
      font: helveticaFont,
      color: rgb(r / 255, g / 255, b / 255),
    });

    // Devuelve los bytes del PDF ya modificado
    return await pdfDoc.save();
  } catch (error) {
    console.error("Error en fillPdf:", error);
    throw error;
  }
}

/**
 * Genera el PDF y lo descarga automáticamente.
 * Valida las pestañas antes de generar. Muestra toasts si hay errores.
 */
export async function generateAndDownloadPdf() {
  // Limpia cualquier clase de error previa
  document.getElementById("tab-dades").classList.remove("error-tab");
  document.getElementById("tab-serveis").classList.remove("error-tab");

  const dadesOK = validateDadesTab();
  const serveisOK = validateServeisTab();
  const currentTab = getCurrentTab();

  // Si alguno de los dos grupos (Datos o Servicios) no es válido
  if (!dadesOK || !serveisOK) {
    if (currentTab === "dades") {
      // Muestra toast solo si "Dades" está completo pero "Serveis" tiene errores
      if (dadesOK && !serveisOK) {
        document.getElementById("tab-serveis").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Servicios.", "error");
      }
    } else if (currentTab === "serveis") {
      // Muestra toast solo si "Serveis" está completo pero "Dades" tiene errores
      if (serveisOK && !dadesOK) {
        document.getElementById("tab-dades").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Datos.", "error");
      }
    }
    return;
  }

  try {
    // Recolectamos todos los datos
    const { generalData, servicesData } = gatherAllData();

    // Generamos el PDF
    const pdfBytes = await fillPdf(generalData, servicesData);

    // Preparamos el Blob y lo descargamos
    const fileName = buildPdfFileName(generalData.date, generalData.dietType);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    // Liberamos la URL para no gastar memoria
    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Guardamos la dieta después de generar el PDF
    await handleSaveDietWithPossibleOverwrite();

    // Incrementamos el contador de descargas y comprobamos si mostrar prompt
    incrementPdfDownloadCountAndMaybeShowPrompt();

    console.log("Generando y descargando el PDF...");
  } catch (err) {
    console.error("[app] Error generando el PDF:", err);
  }
}

/**
 * Construye el nombre de archivo del PDF según la fecha y el tipo de dieta.
 * @param {string} dateValue - Fecha "YYYY-MM-DD".
 * @param {string} dietType - Tipo de dieta ("lunch" o "dinner").
 * @returns {string} - Nombre de archivo para el PDF.
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
 * Controla el contador de descargas y, potencialmente, muestra
 * el prompt de instalación (PWA) según la lógica definida.
 */
export function incrementPdfDownloadCountAndMaybeShowPrompt() {
  console.log("incrementPdfDownloadCountAndMaybeShowPrompt() se ha ejecutado");
  const installed = isAppInstalled();
  const neverShow = localStorage.getItem("neverShowInstallPrompt") === "true";

  // Si la app está instalada o el usuario marcó que no se muestre más, salimos
  if (installed || neverShow) return;

  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  console.log(
    "Veces que el usuario ha rechazado la instalación:",
    timesUserSaidNo
  );

  // CASO 1: El usuario nunca ha dicho NO
  if (timesUserSaidNo === 0) {
    setTimeout(() => {
      console.log("Mostrando prompt por primera vez...");
      showInstallPrompt();
    }, 5000);
    return;
  }

  // CASO 2: El usuario ha dicho "No" una vez
  if (timesUserSaidNo === 1) {
    let pdfDownloadsSinceNo = +localStorage.getItem("pdfDownloadsSinceNo") || 0;
    pdfDownloadsSinceNo++;
    localStorage.setItem("pdfDownloadsSinceNo", String(pdfDownloadsSinceNo));

    console.log("PDFs descargados desde el último NO:", pdfDownloadsSinceNo);
    if (pdfDownloadsSinceNo >= 7) {
      setTimeout(() => {
        console.log("Mostrando prompt PWA (después de 7 descargas)...");
        showInstallPrompt();
      }, 5000);
    }
  }
}
