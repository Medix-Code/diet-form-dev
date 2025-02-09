// src/ui/settingsPanel.js

export function initSettingsPanel() {
  const settingsBtn = document.getElementById("settings");
  const settingsPanel = document.getElementById("settings-panel");
  if (!settingsBtn || !settingsPanel) return;

  // Funció per mostrar/ocultar el panell
  function toggleSettingsPanel() {
    settingsPanel.classList.toggle("visible");
    settingsBtn.classList.toggle("open");
  }

  function closePanelOutside(evt) {
    if (!settingsPanel.contains(evt.target) && evt.target !== settingsBtn) {
      settingsPanel.classList.remove("visible");
      settingsBtn.classList.remove("open");
    }
  }

  function closePanelOnClickInside() {
    settingsPanel.classList.remove("visible");
    settingsBtn.classList.remove("open");
  }

  // Afegim l'esdeveniment de clic al botó d’ajustos
  settingsBtn.addEventListener("click", toggleSettingsPanel);

  document.addEventListener("click", closePanelOutside);
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") {
      settingsPanel.classList.remove("visible");
      settingsBtn.classList.remove("open");
    }
  });

  // Evitem que clicant dins del panell es tanqui (propagació)
  settingsPanel.addEventListener("click", (evt) => evt.stopPropagation());

  // Si es clica un botó dins del panell, es tanca
  settingsPanel.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", closePanelOnClickInside);
  });
}
