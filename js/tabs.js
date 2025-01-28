// js/tabs.js

export function setupTabs() {
  const tabDades = document.getElementById("tab-dades");
  const tabServeis = document.getElementById("tab-serveis");

  tabDades.addEventListener("click", () => switchToTab("dades"));
  tabServeis.addEventListener("click", () => switchToTab("serveis"));

  switchToTab("dades");
}

function switchToTab(tabName) {
  const tabDades = document.getElementById("tab-dades");
  const tabServeis = document.getElementById("tab-serveis");
  const dadesContent = document.getElementById("dades-tab-content");
  const serveisContent = document.getElementById("serveis-tab-content");

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
