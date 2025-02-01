// src/ui/settingsPanel.js
export function initSettingsPanel() {
  const settingsBtn = document.getElementById("settings");
  const settingsPanel = document.getElementById("settings-panel");
  if (!settingsBtn || !settingsPanel) return;

  function togglePanel() {
    settingsPanel.classList.toggle("hidden");
    settingsBtn.classList.toggle("open");
  }
  function closePanelOutside(evt) {
    if (!settingsPanel.contains(evt.target) && evt.target !== settingsBtn) {
      settingsPanel.classList.add("hidden");
      settingsBtn.classList.remove("open");
    }
  }
  function closePanelOnClickInside() {
    settingsPanel.classList.add("hidden");
    settingsBtn.classList.remove("open");
  }

  settingsBtn.addEventListener("click", togglePanel);
  document.addEventListener("click", closePanelOutside);
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") {
      settingsPanel.classList.add("hidden");
      settingsBtn.classList.remove("open");
    }
  });
  settingsPanel.addEventListener("click", (evt) => evt.stopPropagation());
  settingsPanel.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", closePanelOnClickInside);
  });
}
