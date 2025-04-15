/**
 * @file pdfService.js
 * @description Lògica per generar, omplir i descarregar documents PDF de dietes.
 * @module pdfService
 */

// Importacions de mòduls interns
import { getCurrentTab } from "../ui/tabs.js";
import { showToast } from "../ui/toast.js";
import { handleSaveDietWithPossibleOverwrite } from "./dietService.js";
import { gatherAllData } from "./formService.js";
import { validateDadesTab, validateServeisTab } from "../utils/validation.js";
// Importacions del servei PWA (amb el nom corregit i només el necessari)
import {
  isAppInstalled,
  requestInstallPromptAfterAction,
} from "./pwaService.js"; // <-- NOM CORREGIT i nova funció esperada

// --- Constants ---

const DOM_IDS = {
  DADES_TAB: "tab-dades",
  SERVEIS_TAB: "tab-serveis",
};

const CSS_CLASSES = {
  ERROR_TAB: "error-tab",
};

const PDF_SETTINGS = {
  TEMPLATE_URLS: {
    DEFAULT: "./dieta_tsc.pdf", // URL per defecte o per 'empresa1'
    EMPRESA_2: "./dieta_tsc.pdf", // Canviar si és diferent per a 'empresa2'
    // Afegir altres empreses si cal
  },
  SERVICE_Y_OFFSET: 82, // Desplaçament vertical per cada servei addicional
  SIGNATURE_WIDTH: 100,
  SIGNATURE_HEIGHT: 50,
  WATERMARK_TEXT: "misdietas.com",
  DEFAULT_FILENAME: "dieta.pdf",
};

// Coordenades (ben definides com a constants ja a l'original)
const generalFieldCoordinates = {
  /* ... (sense canvis) ... */
};
const baseServiceFieldCoordinates = {
  /* ... (sense canvis) ... */
};
const signatureCoordinates = {
  /* ... (sense canvis) ... */
};
const fixedTextCoordinates = {
  /* ... (sense canvis) ... */
};

// --- Funcions Auxiliars ---

/**
 * Converteix un color HEX a RGB. Retorna negre per defecte si és invàlid.
 * @param {string} hex - Color en format "#RRGGBB".
 * @returns {{r: number, g: number, b: number}} Objecte RGB (valors 0-255).
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return { r: 0, g: 0, b: 0 };
  const sanitizedHex = hex.replace("#", "");
  if (sanitizedHex.length !== 6) return { r: 0, g: 0, b: 0 }; // Retorna negre per defecte
  const bigint = parseInt(sanitizedHex, 16);
  if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Formata una data "YYYY-MM-DD" a "DD/MM/YYYY".
 * @param {string} dateString - Data en format ISO (YYYY-MM-DD).
 * @returns {string} Data formatada o string buit si l'entrada és invàlida.
 */
function formatDateForPdf(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return "";
  const [yyyy, mm, dd] = dateString.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Selecciona la URL de la plantilla PDF basada en les dades generals.
 * @param {object} generalData - Dades generals que poden contenir 'empresa'.
 * @returns {string} URL de la plantilla PDF.
 */
function getPdfTemplateUrl(generalData) {
  const empresa = generalData?.empresa; // Accés segur
  if (empresa === "empresa2" && PDF_SETTINGS.TEMPLATE_URLS.EMPRESA_2) {
    return PDF_SETTINGS.TEMPLATE_URLS.EMPRESA_2;
  }
  // Podria afegir més lògica per a altres empreses aquí
  return PDF_SETTINGS.TEMPLATE_URLS.DEFAULT;
}

/**
 * Gestiona la visualització dels errors de validació a les pestanyes.
 * @param {boolean} isDadesValid - Si la pestanya de dades és vàlida.
 * @param {boolean} isServeisValid - Si la pestanya de serveis és vàlida.
 */
function handleValidationUIErrors(isDadesValid, isServeisValid) {
  const dadesTabElement = document.getElementById(DOM_IDS.DADES_TAB);
  const serveisTabElement = document.getElementById(DOM_IDS.SERVEIS_TAB);
  const currentTab = getCurrentTab(); // Obtenir la pestanya activa

  // Neteja errors previs
  dadesTabElement?.classList.remove(CSS_CLASSES.ERROR_TAB);
  serveisTabElement?.classList.remove(CSS_CLASSES.ERROR_TAB);

  let toastMessage = "";

  if (!isDadesValid && !isServeisValid) {
    toastMessage =
      "Completa els camps obligatoris a les pestanyes Datos i Servicios.";
    dadesTabElement?.classList.add(CSS_CLASSES.ERROR_TAB);
    serveisTabElement?.classList.add(CSS_CLASSES.ERROR_TAB);
  } else if (!isDadesValid) {
    toastMessage = "Completa els camps obligatoris a la pestanya Datos.";
    dadesTabElement?.classList.add(CSS_CLASSES.ERROR_TAB);
    // Mostra només si no estem ja a la pestanya amb error
    if (currentTab !== "dades") {
      // showToast(toastMessage, 'error'); // Opcional: mostrar sempre?
    }
  } else if (!isServeisValid) {
    toastMessage = "Completa els camps obligatoris a la pestanya Servicios.";
    serveisTabElement?.classList.add(CSS_CLASSES.ERROR_TAB);
    // Mostra només si no estem ja a la pestanya amb error
    if (currentTab !== "serveis") {
      // showToast(toastMessage, 'error'); // Opcional: mostrar sempre?
    }
  }

  // Mostra un únic toast si hi ha algun error
  if (toastMessage) {
    showToast(toastMessage, "error");
  }
}

// --- Funcions Principals ---

/**
 * Omple una plantilla PDF amb les dades proporcionades usant PDFLib.
 * @param {object} data - Dades generals (data, vehicle, personal, signatures).
 * @param {object[]} servicesData - Array amb les dades de cada servei.
 * @returns {Promise<Uint8Array>} Promesa que resol amb els bytes del PDF generat.
 * @throws {Error} Si hi ha problemes carregant la plantilla, la font, o durant la generació.
 */
export async function fillPdf(data, servicesData) {
  // Validació bàsica d'arguments
  if (!data || !Array.isArray(servicesData)) {
    throw new Error("Dades invàlides proporcionades a fillPdf.");
  }

  // Assegura't que PDFLib està disponible (dependència global)
  if (!window.PDFLib || !window.PDFLib.PDFDocument) {
    console.error(
      "PDFLib no està disponible a window.PDFLib. Assegura't que s'ha carregat correctament."
    );
    throw new Error("La llibreria PDFLib no està carregada.");
  }
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  try {
    const pdfTemplateUrl = getPdfTemplateUrl(data);
    const pdfBytes = await fetch(pdfTemplateUrl).then((res) => {
      if (!res.ok)
        throw new Error(
          `No s'ha pogut carregar la plantilla PDF: ${res.statusText}`
        );
      return res.arrayBuffer();
    });

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica); // O una altra font si es prefereix
    const page = pdfDoc.getPages()[0]; // Assumeix una sola pàgina

    // 1) Camps Generals
    Object.entries(generalFieldCoordinates).forEach(([field, coords]) => {
      let value = data[field] || "";
      if (field === "date" && value) value = formatDateForPdf(value);
      const { r, g, b } = hexToRgb(coords.color);
      page.drawText(value, {
        x: coords.x,
        y: coords.y,
        size: coords.size,
        font: helveticaFont,
        color: rgb(r / 255, g / 255, b / 255),
      });
    });

    // 2) Dades de Serveis (iterant)
    servicesData.forEach((service, index) => {
      const yOffset = index * PDF_SETTINGS.SERVICE_Y_OFFSET;
      Object.entries(baseServiceFieldCoordinates).forEach(([field, coords]) => {
        const value = service[field] || "";
        const { r, g, b } = hexToRgb(coords.color);
        page.drawText(value, {
          x: coords.x,
          y: coords.y - yOffset,
          size: coords.size,
          font: helveticaFont,
          color: rgb(r / 255, g / 255, b / 255),
        });
      });
    });

    // 3) Firmes (si existeixen)
    const embedAndDrawSignature = async (signatureData, coords) => {
      if (signatureData) {
        try {
          const pngImage = await pdfDoc.embedPng(signatureData);
          page.drawImage(pngImage, {
            x: coords.x,
            y: coords.y,
            width: PDF_SETTINGS.SIGNATURE_WIDTH,
            height: PDF_SETTINGS.SIGNATURE_HEIGHT,
          });
        } catch (sigError) {
          console.warn("Error en incrustar la signatura:", sigError);
          // Podria afegir un text placeholder si falla la incrustació
        }
      }
    };
    await embedAndDrawSignature(
      data.signatureConductor,
      signatureCoordinates.conductor
    );
    await embedAndDrawSignature(
      data.signatureAjudant,
      signatureCoordinates.ayudante
    ); // Corregit nom "ayudante"

    // 4) Marca d'aigua
    const { r, g, b } = hexToRgb(fixedTextCoordinates.website.color);
    const text = PDF_SETTINGS.WATERMARK_TEXT;
    const textSize = fixedTextCoordinates.website.size;
    const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
    const pageWidth = page.getWidth();
    const xCentered = (pageWidth - textWidth) / 2;

    page.drawText(text, {
      x: xCentered,
      y: fixedTextCoordinates.website.y,
      size: textSize,
      font: helveticaFont,
      color: rgb(r / 255, g / 255, b / 255),
    });

    // Desa i retorna els bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error("Error detallat dins de fillPdf:", error);
    // Propaga l'error per a maneig extern si cal, o retorna null/buit
    throw new Error(`Error durant la generació del PDF: ${error.message}`);
  }
}

/**
 * Construeix un nom de fitxer descriptiu per al PDF.
 * @param {string} dateValue - Data en format "YYYY-MM-DD".
 * @param {string} dietType - Tipus de dieta ("lunch", "dinner", etc.).
 * @returns {string} Nom de fitxer generat (ex: "dieta_comida_25_12_2023.pdf").
 */
export function buildPdfFileName(dateValue, dietType) {
  const datePart = formatDateForPdf(dateValue).replace(/\//g, "_"); // DD_MM_YYYY
  if (!datePart) return PDF_SETTINGS.DEFAULT_FILENAME; // Fallback

  let typePart = "dieta";
  if (dietType === "lunch") typePart = "dieta_comida";
  else if (dietType === "dinner") typePart = "dieta_cena";
  // Afegir més tipus si cal

  return `${typePart}_${datePart}.pdf`;
}

/**
 * Orquestra la generació i descàrrega del PDF.
 * Inclou validació prèvia, recollida de dades, generació, descàrrega,
 * desat de la dieta i notificació al servei PWA.
 */
export async function generateAndDownloadPdf() {
  // 1. Validació de les pestanyes
  const isDadesValid = validateDadesTab();
  const isServeisValid = validateServeisTab();

  if (!isDadesValid || !isServeisValid) {
    handleValidationUIErrors(isDadesValid, isServeisValid);
    return; // Atura si hi ha errors de validació
  }

  // Neteja els indicadors d'error si tot és vàlid
  document
    .getElementById(DOM_IDS.DADES_TAB)
    ?.classList.remove(CSS_CLASSES.ERROR_TAB);
  document
    .getElementById(DOM_IDS.SERVEIS_TAB)
    ?.classList.remove(CSS_CLASSES.ERROR_TAB);

  try {
    console.info("Iniciant generació de PDF...");
    showToast("Generant PDF...", "info"); // Feedback inicial

    // 2. Recollida de dades
    const { generalData, servicesData } = gatherAllData();
    if (!generalData || !servicesData) {
      throw new Error("No s'han pogut recollir les dades del formulari.");
    }

    // 3. Generació dels bytes del PDF
    const pdfBytes = await fillPdf(generalData, servicesData);

    // 4. Preparació i inici de la descàrrega
    const fileName = buildPdfFileName(generalData.date, generalData.dietType);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link); // Necessari per a Firefox en alguns casos
    link.click();
    document.body.removeChild(link); // Neteja del DOM

    // Allibera memòria (després d'un temps prudencial per si la descàrrega triga)
    setTimeout(() => URL.revokeObjectURL(url), 500); // 500ms de marge

    showToast("PDF generat i descarregant...", "success");
    console.info(`PDF "${fileName}" generat i descàrrega iniciada.`);

    // 5. Desat de la dieta (després de la generació amb èxit)
    // Si falla el desat, l'usuari ja té el PDF descarregat.
    try {
      await handleSaveDietWithPossibleOverwrite();
    } catch (saveError) {
      console.error(
        "Error en desar la dieta després de generar el PDF:",
        saveError
      );
      showToast(
        "El PDF s'ha generat, però hi ha hagut un error en desar la dieta.",
        "warning"
      );
    }

    // 6. Notificació al servei PWA (DELEGACIÓ!)
    // En lloc de contenir la lògica aquí, simplement notifiquem a pwaService
    // que s'ha produït una acció que podria desencadenar el prompt.
    // !!! Aquesta funció 'requestInstallPromptAfterAction' S'HA D'IMPLEMENTAR a pwaService.js !!!
    if (typeof requestInstallPromptAfterAction === "function") {
      requestInstallPromptAfterAction();
      console.info(
        "Notificació enviada a pwaService per possible prompt d'instal·lació."
      );
    } else {
      console.warn(
        "La funció 'requestInstallPromptAfterAction' no està disponible a pwaService."
      );
    }
  } catch (error) {
    console.error("Error durant generateAndDownloadPdf:", error);
    showToast(
      `Error generant PDF: ${error.message || "Error desconegut"}`,
      "error"
    );
    // Assegura't que els indicadors d'error es netegen si no hi havia problema de validació
    document
      .getElementById(DOM_IDS.DADES_TAB)
      ?.classList.remove(CSS_CLASSES.ERROR_TAB);
    document
      .getElementById(DOM_IDS.SERVEIS_TAB)
      ?.classList.remove(CSS_CLASSES.ERROR_TAB);
  }
}

// --- Eliminació de la Funció Duplicada/Incorrecta ---
// La funció incrementPdfDownloadCountAndMaybeShowPrompt s'elimina completament d'aquí.
// La seva responsabilitat es trasllada a pwaService.js, que serà notificat
// mitjançant la nova funció requestInstallPromptAfterAction().
