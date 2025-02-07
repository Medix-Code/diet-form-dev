/**
 * Restriccions per N. Servei
 *
 */

export function setupServiceNumberRestrictions() {
  const snInputs = document.querySelectorAll(".service-number");
  snInputs.forEach((i) => {
    i.addEventListener("keypress", (evt) => {
      if (!/[0-9]/.test(evt.key)) {
        evt.preventDefault();
      }
    });
    i.addEventListener("paste", (evt) => {
      const data = (evt.clipboardData || window.clipboardData).getData("text");
      if (!/^\d+$/.test(data)) {
        evt.preventDefault();
      }
    });
  });
}
