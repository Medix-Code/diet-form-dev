//dietService.js
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
    empresa: generalData.empresa,
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
  // Esborrem qualsevol classe d'error prèvia de les pestanyes
  document.getElementById("tab-dades").classList.remove("error-tab");
  document.getElementById("tab-serveis").classList.remove("error-tab");

  // Validem cada pestanya de manera independent
  const dadesOK = validateDadesTab();
  const serveisOK = validateServeisTab();
  const currentTab = getCurrentTab();

  // Si alguna pestanya no és vàlida...
  if (!dadesOK || !serveisOK) {
    if (currentTab === "dades") {
      // Si els camps de "Dades" estan complets però "Serveis" té errors:
      if (dadesOK && !serveisOK) {
        document.getElementById("tab-serveis").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Servicios.", "error");
        return;
      }
    } else if (currentTab === "serveis") {
      // Si els camps de "Serveis" estan complets però "Dades" té errors:
      if (serveisOK && !dadesOK) {
        document.getElementById("tab-dades").classList.add("error-tab");
        showToast("Completa los campos en la pestaña Datos.", "error");
        return;
      }
    }
    return;
  }

  // Si hem arribat aquí, vol dir que ambdues pestanyes són vàlides.
  // Continuem amb la lògica per guardar la dieta.
  const result = await handleSaveDietWithPossibleOverwrite();
  switch (result) {
    case "overwritten":
    case "saved":
      showToast("Dieta guardada", "success");
      // Reajustem l'estat inicial = l'actual
      setInitialFormDataStr(getAllFormDataAsString());
      disableSaveButton();
      break;
    case "unchanged":
      showToast("No hay cambios que guardar.", "success");
      break;
    default:
      // L'usuari pot haver cancel·lat
      break;
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
  document.getElementById("empresa").value = diet.empresa || "";

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

  showToast("Dieta cargada correctamente.", "success");
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
        showToast("Dieta eliminada correctamente.", "warning");
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
