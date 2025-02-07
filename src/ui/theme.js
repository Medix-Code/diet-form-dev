document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  // Colors per als dos modes
  const lightThemeColor = "#004aad"; // Fons per al tema clar
  const darkThemeColor = "#343a40"; // Fons per al tema fosc

  // Funció per establir el tema i actualitzar la imatge de l'icona
  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.add("theme-dark");
      localStorage.setItem("theme", "dark");
      // Canvia la imatge a la del sol per indicar que està en mode fosc
      themeIcon.src = "assets/icons/sun.svg";
      if (themeColorMeta)
        themeColorMeta.setAttribute("content", darkThemeColor);
    } else {
      body.classList.remove("theme-dark");
      localStorage.setItem("theme", "light");
      // Canvia la imatge a la de la lluna per indicar que està en mode clar
      themeIcon.src = "assets/icons/moon.svg";
      if (themeColorMeta)
        themeColorMeta.setAttribute("content", lightThemeColor);
    }
  }

  // Comprovar si hi ha un tema guardat en el localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Si no hi ha tema guardat, detectem la preferència del sistema
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  // Afegir event listener per canviar el tema quan es clica el botó
  themeToggleBtn.addEventListener("click", function () {
    const currentTheme = body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
});
