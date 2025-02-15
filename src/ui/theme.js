document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;

  // Colors per als dos modes
  const lightThemeColor = "#004aad"; // Color de fons del tema clar
  const darkThemeColor = "#343a40"; // Color de fons del tema fosc

  // Funció per actualitzar el meta tag theme-color recreant-lo
  function updateThemeColorMeta(color) {
    // Elimina el meta tag existent (si n'hi ha)
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.remove();
    }
    // Crea un nou meta tag amb el color desitjat
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
  }

  // Funció per establir el tema i actualitzar l'icona i el meta theme-color
  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.add("theme-dark");
      localStorage.setItem("theme", "dark");
      // Canvia la icona al sol per indicar mode fosc
      themeIcon.src = "assets/icons/sun.svg";
      updateThemeColorMeta(darkThemeColor);
    } else {
      body.classList.remove("theme-dark");
      localStorage.setItem("theme", "light");
      // Canvia la icona a la lluna per indicar mode clar
      themeIcon.src = "assets/icons/moon.svg";
      updateThemeColorMeta(lightThemeColor);
    }
  }

  // Comprova si hi ha una preferència guardada a localStorage
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    // Si no hi ha preferència guardada, detecta la preferència del sistema
    savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  // Estableix el tema segons la preferència trobada
  setTheme(savedTheme);

  // Canvia el tema quan es clica el botó
  themeToggleBtn.addEventListener("click", function () {
    const currentTheme = body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    // Canvia al tema contrari
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
});
