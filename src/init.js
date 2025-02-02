// init.js (dins src/init.js)
import { openDatabase } from "./db/indexedDbDietRepository.js";
import { setTodayDate } from "./utils/utils.js";
import { initServices } from "./services/servicesPanelManager.js";
import { initSignature } from "./services/signatureService.js";
import { setupTabs } from "./ui/tabs.js";
import { setupMainButtons } from "./ui/mainButtons.js";
import { setupClearSelectedService } from "./ui/clearService.js";
import { setupModalGenerics } from "./ui/modals.js";
import { setupDatePickers, setupTimePickers } from "./ui/pickers.js";
import { setupServiceNumberRestrictions } from "./utils/restrictions.js";
import { initSettingsPanel } from "./ui/settingsPanel.js";
import * as formService from "./services/formService.js";
import { isAppInstalled } from "./services/pwaService.js";

export async function initializeApp() {
  setTodayDate();
  await openDatabase();
  initServices();
  initSignature();
  setupTabs();
  setupMainButtons();
  setupClearSelectedService();
  setupModalGenerics();
  setupDatePickers();
  setupTimePickers();
  setupServiceNumberRestrictions();
  initSettingsPanel();

  formService.addInputListeners();
  formService.addDoneBehavior();
  formService.setInitialFormDataStr(formService.getAllFormDataAsString());

  if (isAppInstalled()) {
    localStorage.setItem("isAppInstalled", "true");
  } else {
    localStorage.removeItem("isAppInstalled");
  }
}
