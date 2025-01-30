// pdf.js

import { gatherAllData } from "./formHandlers.js";
import { showToast } from "./utils.js";
import { handleSaveDietWithPossibleOverwrite } from "./diet.js";
import { validateForPdf } from "./validation.js";
import { isAppInstalled, showInstallPrompt } from "./pwa.js";

// Coordenadas generales y de servicios (posiciones en el PDF)
export const generalFieldCoordinates = {
  date: { x: 155, y: 731, size: 16, color: "#000000" },
  vehicleNumber: { x: 384, y: 731, size: 16, color: "#000000" },
  person1: { x: 65, y: 368, size: 16, color: "#000000" },
  person2: { x: 320, y: 368, size: 16, color: "#000000" },
};

export const baseServiceFieldCoordinates = {
  serviceNumber: { x: 130, y: 715, size: 16, color: "#000000" },
  origin: { x: 232, y: 698, size: 16, color: "#000000" },
  originTime: { x: 441, y: 698, size: 16, color: "#000000" },
  destination: { x: 232, y: 683, size: 16, color: "#000000" },
  destinationTime: { x: 441, y: 681, size: 16, color: "#000000" },
  endTime: { x: 441, y: 665, size: 16, color: "#000000" },
};

export const signatureCoordinates = {
  conductor: { x: 125, y: 295, width: 100, height: 50 },
  ajudant: { x: 380, y: 295, width: 100, height: 50 },
};

/**
 * Convierte un color hexadecimal a un objeto RGB.
 * @param {string} hex - Color en formato hexadecimal (ej. "#FFFFFF").
 * @returns {{r: number, g: number, b: number} | null} Objeto con componentes RGB o null si el formato es inválido.
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
 * Da formato a una fecha en formato DD/MM/YYYY.
 * @param {string} dateString - Fecha en formato YYYY-MM-DD.
 * @returns {string} - Fecha en formato DD/MM/YYYY.
 */
function formatDateForPdf(dateString) {
  const [yyyy, mm, dd] = dateString.split("-");
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
}

/**
 * Llena un PDF con los datos proporcionados, incluyendo campos generales, servicios y firmas.
 * @param {Object} data - Datos generales para rellenar el PDF.
 * @param {Array<Object>} servicesData - Array de objetos con datos de servicios para rellenar el PDF.
 * @returns {Promise<Uint8Array>} - Promesa que resuelve con el PDF generado en formato de bytes.
 */
export async function fillPdf(data, servicesData) {
  try {
    // Importa las funcionalidades de PDFLib desde el objeto global window
    const { PDFDocument, StandardFonts } = window.PDFLib; // TODO: USAR OFFLINE SI ES NECESARIO

    // Carga la plantilla del PDF desde un archivo local
    const pdfBytes = await fetch("./template.pdf").then((r) => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    // Embebe la fuente Helvetica en el PDF
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Obtiene la primera página del documento PDF
    const page = pdfDoc.getPages()[0];

    // Rellena los campos generales en el PDF
    for (const [field, coords] of Object.entries(generalFieldCoordinates)) {
      let value = data[field] || "";
      // Formatea la fecha si el campo es "date"
      if (field === "date" && value !== "") {
        value = formatDateForPdf(value); // Formato DD/MM/YYYY
      }
      // Convierte el color hexadecimal a RGB
      const rgbVal = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
      // Dibuja el texto en el PDF en las coordenadas especificadas
      page.drawText(value, {
        x: coords.x,
        y: coords.y,
        size: coords.size,
        font: helveticaFont,
        color: window.PDFLib.rgb(
          rgbVal.r / 255,
          rgbVal.g / 255,
          rgbVal.b / 255
        ),
      });
    }

    // Rellena los campos de servicios en el PDF
    servicesData.forEach((serv, idx) => {
      const yOffset = idx * 82; // Distancia vertical para cada servicio adicional
      for (const [field, coords] of Object.entries(
        baseServiceFieldCoordinates
      )) {
        const val = serv[field] || "";
        // Convierte el color hexadecimal a RGB
        const rgbVal = hexToRgb(coords.color) || { r: 0, g: 0, b: 0 };
        // Dibuja el texto del servicio en el PDF en las coordenadas ajustadas por el offset
        page.drawText(val, {
          x: coords.x,
          y: coords.y - yOffset,
          size: coords.size,
          font: helveticaFont,
          color: window.PDFLib.rgb(
            rgbVal.r / 255,
            rgbVal.g / 255,
            rgbVal.b / 255
          ),
        });
      }
    });

    /********************************************************
     *  INSERTAR FIRMAS (si existen)
     ********************************************************/
    // Inserta la firma del conductor si existe
    if (data.signatureConductor) {
      // Embebe la imagen PNG de la firma en el PDF
      const pngImage = await pdfDoc.embedPng(data.signatureConductor);
      const coords = signatureCoordinates.conductor;
      // Dibuja la imagen de la firma en las coordenadas especificadas
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
    }

    // Inserta la firma del ayudante si existe
    if (data.signatureAjudant) {
      // Embebe la imagen PNG de la firma en el PDF
      const pngImage = await pdfDoc.embedPng(data.signatureAjudant);
      const coords = signatureCoordinates.ajudant;
      // Dibuja la imagen de la firma en las coordenadas especificadas
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
    }

    // Retorna el PDF completo como un array de bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error("Error en fillPdf:", error);
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
}

export async function generateAndDownloadPdf() {
  if (!validateForPdf()) {
    showToast("Revisa los campos obligatorios para descargar el PDF.", "error");
    return;
  }

  try {
    const { generalData, servicesData } = gatherAllData();
    // ...
    const pdfBytes = await fillPdf(generalData, servicesData);

    const fileName = buildPdfFileName(generalData.date, generalData.dietType);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Si tot OK, guardem la dieta
    await handleSaveDietWithPossibleOverwrite();
    incrementPdfDownloadCountAndMaybeShowPrompt();
  } catch (err) {
    console.error("[app] Error generando el PDF:", err);
  }
}

/**
 * Construeix el nom del fitxer PDF basant-se en la data i el tipus de dieta.
 * @param {string} dateValue - Data de la dieta en format YYYY-MM-DD.
 * @param {string} dietType - Tipus de dieta (e.g., "lunch", "dinner").
 * @returns {string} - Nom del fitxer PDF.
 */
export function buildPdfFileName(dateValue, dietType) {
  const [yyyy, mm, dd] = (dateValue || "").split("-");
  if (!yyyy || !mm || !dd) return "dieta.pdf";
  const formatted = `${dd}_${mm}_${yyyy}`;
  if (dietType === "lunch") return `dieta_comida_${formatted}.pdf`;
  if (dietType === "dinner") return `dieta_cena_${formatted}.pdf`;
  return `dieta_${formatted}.pdf`;
}

import { isAppInstalled, showInstallPrompt } from "./pwa.js";

export function incrementPdfDownloadCountAndMaybeShowPrompt() {
  console.log("incrementPdfDownloadCountAndMaybeShowPrompt() s'ha executat");

  const installed = isAppInstalled();
  const neverShow = localStorage.getItem("neverShowInstallPrompt") === "true";

  console.log("Estat de la instal·lació:", installed, "neverShow:", neverShow);
  if (installed || neverShow) return;

  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  console.log(
    "Vegades que l'usuari ha rebutjat la instal·lació:",
    timesUserSaidNo
  );

  if (timesUserSaidNo === 0) {
    setTimeout(() => {
      console.log("Mostrant prompt per primera vegada...");
      showInstallPrompt();
    }, 5000);
    return;
  }

  if (timesUserSaidNo === 1) {
    let pdfDownloadsSinceNo = +localStorage.getItem("pdfDownloadsSinceNo") || 0;
    pdfDownloadsSinceNo++;
    localStorage.setItem("pdfDownloadsSinceNo", String(pdfDownloadsSinceNo));

    console.log("PDFs descarregats des de l'últim no:", pdfDownloadsSinceNo);

    if (pdfDownloadsSinceNo >= 9) {
      setTimeout(() => {
        console.log("Mostrant prompt després de 9 descàrregues...");
        showInstallPrompt();
      }, 5000);
    }
  }
}
