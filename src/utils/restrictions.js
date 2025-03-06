import { showToast } from "../ui/toast.js"; // Assegura't de tenir la ruta correcta

/**
 * Restriccions per N. Servei
 *
 */
export function setupServiceNumberRestrictions() {
  const snInputs = document.querySelectorAll(".service-number");

  snInputs.forEach((inputEl) => {
    // Bloqueja caràcters que no siguin digits (0-9)
    inputEl.addEventListener("keypress", (evt) => {
      if (!/[0-9]/.test(evt.key)) {
        evt.preventDefault();
        showToast("Solo se permiten dígitos en el número de servicio", "error");
      }
    });

    // Bloqueja enganxar (paste) de text que no sigui tot dígits
    inputEl.addEventListener("paste", (evt) => {
      const data = (evt.clipboardData || window.clipboardData).getData("text");
      if (!/^\d+$/.test(data)) {
        evt.preventDefault();
        showToast("Solo se permiten dígitos en el número de servicio", "error");
      }
    });
  });
}
