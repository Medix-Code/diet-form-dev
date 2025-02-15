document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;

  // Colors per als dos modes
  const lightThemeColor = "#004aad"; // Color de fons del tema clar
  const darkThemeColor = "#343a40"; // Color de fons del tema fosc

  // Funció per actualitzar (eliminar i recrear) el meta tag theme-color
  function updateThemeColorMeta(color) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.remove();
    }
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
  }

  // Funció per establir el tema, actualitzar l'icona, el meta tag i desar la preferència
  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.add("theme-dark");
      localStorage.setItem("theme", theme);
      // Canvia la icona al sol per indicar que el tema actual és fosc (i es pot canviar a clar)
      themeIcon.src = "assets/icons/sun.svg";
      updateThemeColorMeta(darkThemeColor);
    } else {
      body.classList.remove("theme-dark");
      localStorage.setItem("theme", theme);
      // Canvia la icona a la lluna per indicar que el tema actual és clar (i es pot canviar a fosc)
      themeIcon.src = "assets/icons/moon.svg";
      updateThemeColorMeta(lightThemeColor);
    }
  }

  // Detecta la preferència guardada a localStorage o, si no n'hi ha, la preferència del sistema
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  setTheme(savedTheme);

  // Canvia el tema quan es clica el botó
  themeToggleBtn.addEventListener("click", function () {
    const currentTheme = body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    // Al canviar, s'afegeix la preferència manual a localStorage (i per tant s'atura la detecció automàtica)
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // Detecta canvis en la preferència del sistema si l'usuari no ha triat manualment
  const systemDarkMedia = window.matchMedia("(prefers-color-scheme: dark)");
  systemDarkMedia.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      // Si l'usuari no ha triat res manualment, s'aplica la preferència del sistema
      setTheme(e.matches ? "dark" : "light");
    }
  });
});
