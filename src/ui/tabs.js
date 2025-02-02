/**
 * Configuració de les pestanyes (dades / serveis)
 */

let currentTab = "dades";

export function setupTabs() {
  const tabDades = document.getElementById("tab-dades");
  const tabServeis = document.getElementById("tab-serveis");

  tabDades.addEventListener("click", () => switchToTab("dades"));
  tabServeis.addEventListener("click", () => switchToTab("serveis"));

  switchToTab("dades");
}

function switchToTab(tabName) {
  currentTab = tabName; // ← actualitzem la variable global

  const tabDades = document.getElementById("tab-dades");
  const tabServeis = document.getElementById("tab-serveis");
  const dadesContent = document.getElementById("dades-tab-content");
  const serveisContent = document.getElementById("serveis-tab-content");

  // (opcional) quan fem clic, eliminem el parpelleig
  tabDades.classList.remove("blink-error");
  tabServeis.classList.remove("blink-error");

  if (tabName === "dades") {
    tabDades.classList.add("active");
    tabServeis.classList.remove("active");
    dadesContent.classList.add("active");
    serveisContent.classList.remove("active");
  } else {
    tabServeis.classList.add("active");
    tabDades.classList.remove("active");
    serveisContent.classList.add("active");
    dadesContent.classList.remove("active");
  }
}
