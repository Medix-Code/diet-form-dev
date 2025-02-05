// theme.js
// Seleccionem el meta tag theme-color
const metaThemeColor = document.querySelector('meta[name="theme-color"]');

// Funció per actualitzar el theme-color segons el tema
function updateThemeColor(isDark) {
  if (isDark) {
    // Canvia aquest valor pel color que vulguis per al mode fosc
    metaThemeColor.setAttribute("content", "#731e7a");
  } else {
    // Canvia aquest valor pel color que vulguis per al mode clar
    metaThemeColor.setAttribute("content", "#1470c2");
  }
}

// Detecta si l'usuari prefereix el mode fosc
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.body.classList.add("theme-dark");
  updateThemeColor(true);
} else {
  document.body.classList.remove("theme-dark");
  updateThemeColor(false);
}

// Escolta els canvis en la preferència del mode en temps real
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    if (event.matches) {
      document.body.classList.add("theme-dark");
      updateThemeColor(true);
    } else {
      document.body.classList.remove("theme-dark");
      updateThemeColor(false);
    }
  });
