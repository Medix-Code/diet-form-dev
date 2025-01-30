// js/pwa.js

let deferredPrompt = null;

// Funció per configurar l'event beforeinstallprompt
export function setupInstallPrompt() {
  console.log(
    "✅ setupInstallPrompt() carregat! Esperant beforeinstallprompt..."
  );

  window.addEventListener("beforeinstallprompt", (evt) => {
    console.log("📢 Event beforeinstallprompt capturat correctament!");
    evt.preventDefault();
    deferredPrompt = evt;

    // Guardem deferredPrompt a localStorage per a depuració
    localStorage.setItem("deferredPromptExists", "true");

    // Mostrem el prompt només si l'event es captura correctament
    showInstallPrompt();
  });
}

// Funció per monitoritzar el mode de visualització
export function monitorDisplayMode() {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", () => {
    if (mq.matches) {
      console.log("✅ L'app s'està executant en mode standalone.");
      localStorage.setItem("isAppInstalled", "true");
      hideInstallPrompt();
    } else {
      console.log("ℹ️ L'app ha sortit del mode standalone.");
      localStorage.removeItem("isAppInstalled");
    }
  });
}

// Funció per determinar si l'app està instal·lada
export function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("isAppInstalled") === "true"
  );
}

// Funció per mostrar el prompt d'instal·lació
export function showInstallPrompt() {
  console.log("🔍 Intentant mostrar el prompt d'instal·lació...");
  console.log("deferredPrompt:", deferredPrompt);

  if (!deferredPrompt) {
    console.warn("⚠️ deferredPrompt és NULL! No es pot mostrar el prompt.");
    console.log("ℹ️ Comprovant si `beforeinstallprompt` s'ha llançat abans...");
    console.log(
      "localStorage[deferredPromptExists]:",
      localStorage.getItem("deferredPromptExists")
    );
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

// Funció per amagar el prompt d'instal·lació
export function hideInstallPrompt() {
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.remove("visible");
    console.log("🚫 S'ha amagat el banner d'instal·lació.");
  }
}

// Funció per gestionar la decisió de l'usuari en rebutjar l'instal·lació
export function onUserDismissInstall() {
  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  timesUserSaidNo++;
  localStorage.setItem("timesUserSaidNo", String(timesUserSaidNo));
  localStorage.setItem("pdfDownloadsSinceNo", "0");

  if (timesUserSaidNo >= 2) {
    localStorage.setItem("neverShowInstallPrompt", "true");
    console.log(
      "🚫 L'usuari ha descartat la instal·lació massa vegades. No es tornarà a mostrar."
    );
  }

  hideInstallPrompt();
}

// Funció per incrementar el comptador de descàrregues de PDF i potencialment mostrar el prompt
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
