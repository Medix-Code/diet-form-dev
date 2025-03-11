/**
 * Lògica de PWA (Prompt d'instal·lació, etc.)
 *
 */

let deferredPrompt = null;

/**
 * Configura l'escolta de "beforeinstallprompt" i mostra el prompt immediatament
 */
export function setupInstallPrompt() {
  console.log(
    "✅ setupInstallPrompt() carregat! Esperant beforeinstallprompt..."
  );

  window.addEventListener("beforeinstallprompt", (evt) => {
    console.log("📢 Evento beforeinstallprompt capturat!");
    evt.preventDefault();
    deferredPrompt = evt;

    // Mostrem el prompt immediatament per provar al inici
    console.log("⏰ Mostrant el prompt d'instal·lació immediatament...");
    showInstallPrompt();
  });

  // Enllaç dels botons d'instal·lació i tancament
  linkInstallButtons();
}

/**
 * Enllaça els botons d'instal·lació i de tancament del banner
 */
function linkInstallButtons() {
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        console.log("📥 Mostrant el diàleg d'instal·lació...");
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

/**
 * Mostra el banner d'instal·lació
 */
export function showInstallPrompt() {
  console.log("🔍 Intentant mostrar el prompt de PWA...");
  if (!deferredPrompt) {
    console.warn(
      "⚠️ deferredPrompt és NULL! El navegador no ha disparat l'event."
    );
    return;
  }
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.add("visible");
    console.log("✅ Banner d'instal·lació mostrat.");
  } else {
    console.warn("⚠️ No s'ha trobat l'element #install-prompt.");
  }
}

/**
 * Amaga el banner d'instal·lació
 */
export function hideInstallPrompt() {
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.remove("visible");
    console.log("🚫 S'ha amagat el banner d'instal·lació.");
  }
}

/**
 * Gestió de la decisió de l'usuari (descarta el prompt)
 */
export function onUserDismissInstall() {
  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  timesUserSaidNo++;
  localStorage.setItem("timesUserSaidNo", String(timesUserSaidNo));

  // Reiniciem el comptador de descàrregues des de l'últim "No"
  localStorage.setItem("pdfDownloadsSinceNo", "0");

  // Si l'usuari ha dit "No" dues vegades, no es tornarà a mostrar
  if (timesUserSaidNo >= 2) {
    localStorage.setItem("neverShowInstallPrompt", "true");
    console.log(
      "🚫 L'usuari ha descartat la instal·lació massa vegades. No es tornarà a mostrar."
    );
  }

  hideInstallPrompt();
}

/**
 * Comprova si l'aplicació ja està instal·lada
 */
export function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("isAppInstalled") === "true"
  );
}

/**
 * Monitora el mode de visualització (standalone o navegador)
 */
export function monitorDisplayMode() {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", () => {
    if (mq.matches) {
      console.log("✅ La app s'està executant en mode standalone.");
      localStorage.setItem("isAppInstalled", "true");
      hideInstallPrompt();
    } else {
      console.log("ℹ️ La app ha sortit del mode standalone.");
      localStorage.removeItem("isAppInstalled");
    }
  });
}
