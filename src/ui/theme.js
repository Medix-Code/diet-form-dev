document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const body = document.body;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  // Colors per als dos modes
  const lightThemeColor = "#f8faf8"; // Color de fons del tema clar
  const darkThemeColor = "#343a40"; // Color de fons del tema fosc

  // Funció per establir el tema i actualitzar el meta
  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.add("theme-dark");
      localStorage.setItem("theme", "dark");
      themeToggleBtn.textContent = "🌙 Mode Fosc";
      if (themeColorMeta)
        themeColorMeta.setAttribute("content", darkThemeColor);
    } else {
      body.classList.remove("theme-dark");
      localStorage.setItem("theme", "light");
      themeToggleBtn.textContent = "☀ Mode Clar";
      if (themeColorMeta)
        themeColorMeta.setAttribute("content", lightThemeColor);
    }
  }

  // Comprovar si hi ha un tema guardat en el localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  }

  // Afegir event listener per canviar el tema quan es clica el botó
  themeToggleBtn.addEventListener("click", function () {
    const currentTheme = body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
});
