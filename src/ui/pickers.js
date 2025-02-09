/**
 * Configuració de date/time pickers natius
 * Abans era "pickers.js"
 */

export function setupDatePickers() {
  // Seleccionem tots els inputs de tipus date i datetime-local
  const dateInps = document.querySelectorAll(
    'input[type="date"], input[type="datetime-local"]'
  );

  dateInps.forEach((inp) => {
    // Configura opcions bàsiques
    const options = {
      dateFormat: "d-m-Y", // Exemple: 2023-12-31
      // Si l'input és de tipus datetime-local, activem també l'hora
      enableTime: inp.type === "datetime-local",
      // Per personalitzar colors, pots modificar el CSS (vegeu més endavant)
    };

    // Inicialitza flatpickr per aquest input
    flatpickr(inp, options);
  });
}

export function setupTimePickers() {
  const timeInps = document.querySelectorAll('input[type="time"]');

  timeInps.forEach((inp) => {
    const options = {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      // Altres opcions per configurar l'hora
    };

    flatpickr(inp, options);
  });
}
