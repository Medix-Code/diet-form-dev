// theme.js
// Detecta si el usuario prefiere el modo oscuro
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.body.classList.add("theme-dark");
} else {
  document.body.classList.remove("theme-dark");
}

// Escuchar cambios en la preferencia del usuario en tiempo real
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    if (event.matches) {
      document.body.classList.add("theme-dark");
    } else {
      document.body.classList.remove("theme-dark");
    }
  });
