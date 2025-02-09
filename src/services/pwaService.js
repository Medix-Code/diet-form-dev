/**
 * Lógica de PWA (Prompt de instalación, etc.)
 *
 */

let deferredPrompt = null;

/**
 * Configura escuchas para "beforeinstallprompt"
 */
export function setupInstallPrompt() {
  console.log(
    "✅ setupInstallPrompt() cargado! Esperando beforeinstallprompt..."
  );

  window.addEventListener("beforeinstallprompt", (evt) => {
    console.log("📢 Evento beforeinstallprompt capturado correctamente!");
    evt.preventDefault();
    deferredPrompt = evt;
  });

  document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 DOM cargado, enlazando botones de instalación...");
    linkInstallButtons();
  });
}

function linkInstallButtons() {
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        console.log("📥 Mostrando el diálogo de instalación...");
        await deferredPrompt.prompt();

        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("✅ El usuario ha aceptado la instalación.");
          localStorage.setItem("isAppInstalled", "true");
          hideInstallPrompt();
        } else {
          console.log("❌ El usuario ha rechazado la instalación.");
        }
        deferredPrompt = null;
        localStorage.setItem("deferredPromptExists", "false");
      } else {
        console.log("⚠️ deferredPrompt no está definido.");
      }
    });
  } else {
    console.warn(
      "⚠️ No se encontró el botón de instalación (#install-button)."
    );
  }

  const dismissButton = document.getElementById("dismiss-button");
  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      console.log("🚫 El usuario ha descartado el banner de instalación.");
      onUserDismissInstall();
    });
  } else {
    console.warn("⚠️ No se encontró el botón de cierre (#dismiss-button).");
  }
}

export function showInstallPrompt() {
  console.log("🔍 Intentando mostrar el prompt de instalación...");
  if (!deferredPrompt) {
    console.warn("⚠️ deferredPrompt es NULL! No se puede mostrar el prompt.");
    return;
  }
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.add("visible");
    console.log("✅ Banner de instalación mostrado.");
  } else {
    console.warn("⚠️ No se encontró el elemento #install-prompt.");
  }
}

export function hideInstallPrompt() {
  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.classList.remove("visible");
    console.log("🚫 Se ha ocultado el banner de instalación.");
  }
}

export function onUserDismissInstall() {
  let timesUserSaidNo = +localStorage.getItem("timesUserSaidNo") || 0;
  timesUserSaidNo++;
  localStorage.setItem("timesUserSaidNo", String(timesUserSaidNo));

  // Reiniciamos el contador de descargas desde el último No
  localStorage.setItem("pdfDownloadsSinceNo", "0");

  // Si ya nos ha dicho NO dos veces, no lo volvemos a mostrar
  if (timesUserSaidNo >= 2) {
    localStorage.setItem("neverShowInstallPrompt", "true");
    console.log(
      "🚫 El usuario ha descartado la instalación demasiadas veces. No se volverá a mostrar."
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
      console.log("✅ La app se está ejecutando en modo standalone.");
      localStorage.setItem("isAppInstalled", "true");
      hideInstallPrompt();
    } else {
      console.log("ℹ️ La app ha salido del modo standalone.");
      localStorage.removeItem("isAppInstalled");
    }
  });
}
