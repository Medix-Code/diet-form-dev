// js/diet.js

import {
  gatherAllData,
  getAllFormDataAsString,
  disableSaveButton,
  setInitialFormDataStr,
  getInitialFormDataStr,
  removeErrorClasses,
} from "./formHandlers.js";
import {
  addDiet,
  getAllDiets,
  getDiet,
  deleteDietById,
  updateDiet,
} from "./db.js";
import {
  showConfirmModal,
  displayDietOptions,
  closeDietModal,
} from "./modals.js";
import { showToast, getDietDisplayInfo } from "./utils.js";
import { validateMinFieldsForSave } from "./validation.js";
import {
  setSignatureConductor,
  setSignatureAjudant,
  updateSignatureIcons,
} from "./signature.js";

/**
 * Construeix un objecte de dieta amb les dades generals, serveis i un ID personalitzat.
 * @param {object} generalData - Dades generals de la dieta.
 * @param {array} servicesData - Dades dels serveis.
 * @param {string} customId - ID personalitzat per a la dieta.
 * @returns {object} - Objecte de dieta.
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

export async function onClickSaveDiet() {
  if (!validateMinFieldsForSave()) {
    // mostrar toast d'error
    showToast(
      "Completa la fecha, franja y n.º servicio para guardar.",
      "error"
    );
    return;
  }

  // Procedim a guardar la dieta
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
      // ja existia i era igual
      showToast("No hay cambios que guardar.", "success");
      break;

    default:
      // l'usuari pot haver cancel·lat
      break;
  }
}

export async function handleSaveDietWithPossibleOverwrite() {
  const { generalData, servicesData } = gatherAllData();
  // ID = primers 9 dígits del Servei1
  let s1 = servicesData[0]?.serviceNumber.trim() || "";
  let dietId = s1.slice(0, 9);

  const dietToSave = buildDietObject(generalData, servicesData, dietId);

  const allDiets = await getAllDiets();
  const found = allDiets.find((d) => d.id === dietId);
  if (found) {
    // comparem dades
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

  // Ara definim "estat inicial" = dieta carregada
  setInitialFormDataStr(getAllFormDataAsString());

  // Com que no s'ha canviat res, botó "Guardar" desactivat
  disableSaveButton();

  showToast("¡Dieta cargada!", "success");
  closeDietModal();
}

export async function deleteDietHandler(id, dietDate, dietType) {
  const { ddmmaa, franjaText } = getDietDisplayInfo(dietDate, dietType);

  const confirmTitle = "Eliminar dieta";
  const confirmMessage = `¿Quieres eliminar la dieta de la ${franjaText} del ${ddmmaa}?`;

  showConfirmModal(confirmMessage, confirmTitle).then((confirmed) => {
    if (confirmed) {
      deleteDietById(id).then(() => {
        showToast("¡Dieta eliminada!", "success");
        displayDietOptions();
      });
    }
  });
}
