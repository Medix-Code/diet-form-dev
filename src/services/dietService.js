/**
 * Lògica principal per a guardar/cargar/actualitzar Dietes.
 *
 */

import {
  addDiet,
  getAllDiets,
  getDiet,
  deleteDietById,
  updateDiet,
} from "../db/indexedDbDietRepository.js";
import { showToast } from "../ui/toast.js";
import {
  showConfirmModal,
  closeDietModal,
  displayDietOptions,
} from "../ui/modals.js";
import {
  getAllFormDataAsString,
  gatherAllData,
  disableSaveButton,
  setInitialFormDataStr,
  getInitialFormDataStr,
} from "./formService.js";
import { removeErrorClasses } from "./formService.js";
import { validateDadesTab, validateServeisTab } from "../utils/validation.js";
import { getCurrentTab } from "../ui/tabs.js";
import { getDietDisplayInfo } from "../utils/utils.js";
import {
  setSignatureConductor,
  setSignatureAjudant,
  updateSignatureIcons,
} from "./signatureService.js";

/**
 * Construeix l'objecte "Dieta" que després guardarem a IndexedDB.
 *
 */
export function buildDietObject(generalData, servicesData, customId) {
  return {
    id: customId,
    date: generalData.date,
    dietType: generalData.dietType,
    vehicleNumber: generalData.vehicleNumber,
    person1: generalData.person1,
    person2: generalData.person2,
    signatureConductor: generalData.signatureConductor || "",
    signatureAjudant: generalData.signatureAjudant || "",
    services: servicesData,
    timeStampDiet: new Date().toISOString(),
  };
}

/**
 * Quan l'usuari clica el botó "Guardar Dieta"
 */
export async function onClickSaveDiet() {
  // Esborrem els errors previs
  document.getElementById("tab-dades").classList.remove("error-tab");
  document.getElementById("tab-serveis").classList.remove("error-tab");

  // Validem les pestanyes "Datos" i "Servicios"
  const dadesOK = validateDadesTab();
  const serveisOK = validateServeisTab();
  const currentTab = getCurrentTab();

  if (!dadesOK || !serveisOK) {
    if (currentTab === "dades") {
      if (dadesOK && !serveisOK) {
        document.getElementById("tab-serveis").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Servicios.", "error");
      }
    } else if (currentTab === "serveis") {
      if (serveisOK && !dadesOK) {
        document.getElementById("tab-dades").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Datos.", "error");
      }
    }
    return;
  }

  // Ara, les dues pestanyes són vàlides.
  // Fem una validació addicional per al número de servei:
  const service1NumberEl = document.getElementById("service-number-1");
  const service1Value = service1NumberEl.value.trim();
  // Comprovem que sigui exactament 9 dígits
  if (!/^\d{9}$/.test(service1Value)) {
    service1NumberEl.classList.add("input-error");
    // Mostrar el toast específic per a l'error del número de servei
    showToast(
      "El número de servei és incorrecte. Ha de contenir 9 dígits.",
      "error"
    );
    return;
  }

  // Continuem amb la resta de la lògica per guardar la dieta
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

    await handleSaveDietWithPossibleOverwrite();
    incrementPdfDownloadCountAndMaybeShowPrompt();
    console.log("Generando y descargando el PDF...");
  } catch (err) {
    console.error("[app] Error generando el PDF:", err);
  }
}

/**
 * Guarda una dieta, si ja existeix pregunta si cal sobrescriure
 */
export async function handleSaveDietWithPossibleOverwrite() {
  const { generalData, servicesData } = gatherAllData();
  // ID = primers 9 dígits del servei1
  let s1 = servicesData[0]?.serviceNumber.trim() || "";
  let dietId = s1.slice(0, 9);

  const dietToSave = buildDietObject(generalData, servicesData, dietId);

  const allDiets = await getAllDiets();
  const found = allDiets.find((d) => d.id === dietId);
  if (found) {
    // comparem dades (excepte timeStampDiet)
    const cloneFound = { ...found };
    delete cloneFound.timeStampDiet;
    const cloneToSave = { ...dietToSave };
    delete cloneToSave.timeStampDiet;

    const sameData = JSON.stringify(cloneFound) === JSON.stringify(cloneToSave);
    if (sameData) {
      return "unchanged";
    } else {
      // Preguntem si vol sobrescriure
      const overwrite = await showConfirmModal(
        "Ya existe una dieta con este número de servicio. ¿Quieres sobrescribirla?"
      );
      if (overwrite) {
        await updateDiet(dietToSave);
        return "overwritten";
      } else {
        return null;
      }
    }
  } else {
    // No existeix -> crear
    await addDiet(dietToSave);
    return "saved";
  }
}

/**
 * Carregar una dieta per la seva ID
 */
export async function loadDietById(dietId) {
  const diet = await getDiet(dietId);
  if (!diet) return;

  document.getElementById("date").value = diet.date || "";
  document.getElementById("diet-type").value = diet.dietType || "";
  document.getElementById("vehicle-number").value = diet.vehicleNumber || "";
  document.getElementById("person1").value = diet.person1 || "";
  document.getElementById("person2").value = diet.person2 || "";

  setSignatureConductor(diet.signatureConductor || "");
  setSignatureAjudant(diet.signatureAjudant || "");
  updateSignatureIcons();

  const servicesEls = document.querySelectorAll(".service");
  diet.services.forEach((sData, i) => {
    if (servicesEls[i]) {
      servicesEls[i].querySelector(".service-number").value =
        sData.serviceNumber || "";
      servicesEls[i].querySelector(".origin").value = sData.origin || "";
      servicesEls[i].querySelector(".origin-time").value =
        sData.originTime || "";
      servicesEls[i].querySelector(".destination").value =
        sData.destination || "";
      servicesEls[i].querySelector(".destination-time").value =
        sData.destinationTime || "";
      servicesEls[i].querySelector(".end-time").value = sData.endTime || "";
      removeErrorClasses(servicesEls[i]);
    }
  });

  // Redefinim estat inicial
  setInitialFormDataStr(getAllFormDataAsString());
  disableSaveButton();

  showToast("Dieta cargada!", "success");
  closeDietModal();
}

/**
 * Esborrar dieta (handler)
 */
export async function deleteDietHandler(id, dietDate, dietType) {
  const { ddmmaa, franjaText } = getDietDisplayInfo(dietDate, dietType);
  const confirmTitle = "Eliminar dieta";
  const confirmMessage = `¿Quieres eliminar la dieta de la ${franjaText} del ${ddmmaa}?`;

  showConfirmModal(confirmMessage, confirmTitle).then((confirmed) => {
    if (confirmed) {
      deleteDietById(id).then(async () => {
        showToast("¡Dieta eliminada!", "success");
        displayDietOptions();

        // Després d’haver esborrat la dieta, recarreguem la llista de BD:
        const dietsAfter = await getAllDiets();
        if (!dietsAfter.length) {
          closeDietModal(); // Tanca el modal si ja no queden dietes
        }
      });
    }
  });
}
