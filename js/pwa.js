// js/pwa.js

let deferredPrompt = null;

export function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (evt) => {
    evt.preventDefault();
    deferredPrompt = evt;
  });

  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          localStorage.setItem("isAppInstalled", "true");
          hideInstallPrompt();
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

function hideInstallPrompt() {
  const ip = document.getElementById("install-prompt");
  if (ip) ip.classList.add("hidden");
}
