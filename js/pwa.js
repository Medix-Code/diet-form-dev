let deferredPrompt = null;

export function setupInstallPrompt() {
  console.log(
    "✅ setupInstallPrompt() carregat! Esperant beforeinstallprompt..."
  );

  window.addEventListener("beforeinstallprompt", (evt) => {
    console.log("📢 Event beforeinstallprompt capturat correctament!");
    evt.preventDefault();
    deferredPrompt = evt;

    // Mostrem el prompt només si l'event es captura correctament
  });

  document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 DOM carregat, enllaçant botons...");
    linkInstallButtons();
  });
}

function linkInstallButtons() {
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        console.log("📥 S'està mostrant el diàleg d'instal·lació...");
        await deferredPrompt.prompt();

        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("✅ L'usuari ha acceptat la instal·lació.");
          localStorage.setItem("isAppInstalled", "true");
          hideInstallPrompt();
        } else {
          console.log("❌ L'usuari ha rebutjat la instal·lació.");
        }
        deferredPrompt = null;
        localStorage.setItem("deferredPromptExists", "false");
      } else {
        console.log("⚠️ deferredPrompt no està definit.");
      }
    });
  } else {
    console.warn("⚠️ No s'ha trobat el botó d'instal·lació (#install-button).");
  }

  const dismissButton = document.getElementById("dismiss-button");
  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      console.log("🚫 L'usuari ha descartat el banner d'instal·lació.");
      onUserDismissInstall();
    });
  } else {
    console.warn("⚠️ No s'ha trobat el botó de tancament (#dismiss-button).");
  }
}

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

export function hideInstallPrompt() {
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.remove("visible");
    console.log("🚫 S'ha amagat el banner d'instal·lació.");
  }
}

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

export function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("isAppInstalled") === "true"
  );
}

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
