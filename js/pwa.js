// js/pwa.js

let deferredPrompt = null;

export function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (evt) => {
    evt.preventDefault();
    deferredPrompt = evt;
    console.log(
      "Event beforeinstallprompt capturat. Es pot mostrar el banner d'instal·lació."
    );

    // Mostrem el missatge d'instal·lació
    showInstallPrompt();
  });

  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("L'usuari ha acceptat la instal·lació.");
          localStorage.setItem("isAppInstalled", "true");
          hideInstallPrompt();
        } else {
          console.log("L'usuari ha rebutjat la instal·lació.");
        }
        deferredPrompt = null;
      }
    });
  }

  const dismissButton = document.getElementById("dismiss-button");
  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      onUserDismissInstall();
    });
  }
}

export function isAppInstalled() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const installedFlag = localStorage.getItem("isAppInstalled") === "true";
  return standalone || installedFlag;
}

export function monitorDisplayMode() {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", () => {
    if (mq.matches) {
      localStorage.setItem("isAppInstalled", "true");
      hideInstallPrompt();
    } else {
      localStorage.removeItem("isAppInstalled");
    }
  });
}

export function onUserDismissInstall() {
  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  timesUserSaidNo++;
  localStorage.setItem("timesUserSaidNo", String(timesUserSaidNo));
  localStorage.setItem("pdfDownloadsSinceNo", "0");

  if (timesUserSaidNo >= 2) {
    localStorage.setItem("neverShowInstallPrompt", "true");
  }
  hideInstallPrompt();
}

export function showInstallPrompt() {
  console.log("Intentant mostrar el prompt d'instal·lació...");
  console.log("deferredPrompt:", deferredPrompt);

  if (!deferredPrompt) {
    console.log("⚠️ deferredPrompt és NULL! No es pot mostrar el prompt.");
    return;
  }

  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.add("visible");
    console.log("✅ Banner d'instal·lació mostrat.");
  } else {
    console.warn("⚠️ L'element #install-prompt no s'ha trobat.");
  }
}

function hideInstallPrompt() {
  const ip = document.getElementById("install-prompt");
  if (ip) ip.classList.add("hidden");
}
