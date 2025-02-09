/**
 * Configuració de date/time pickers natius
 *
 */

export function setupDatePickers() {
  const dateInps = document.querySelectorAll(
    'input[type="date"], input[type="datetime-local"]'
  );

  dateInps.forEach((inp) => {
    // Determinem si hem d'activar el temps (si és datetime-local)
    const isDateTime = inp.type === "datetime-local";

    // Exemple d'opcions avançades
    const options = {
      // Format de data: d => dia, m => mes, Y => any de 4 dígits
      // Si utilitzes temps, la part "H:i" es mostrarà automàticament.
      dateFormat: isDateTime ? "d-m-Y H:i" : "d-m-Y",

      // Habilita temps si és datetime
      enableTime: isDateTime,
      // 24h en lloc de AM/PM
      time_24hr: true,

      // minDate i maxDate: exemplificació de com limitar el rang
      // minDate: "today", // Permet només dates a partir d'avui
      // maxDate: "31.12.2025", // Fins a finals de 2025 (format d-m-Y o Y-m-d, segons la configuració)

      // Per posar l'idioma català, pots fer:
      locale: {
        firstDayOfWeek: 1, // Inicia la setmana en dilluns
        weekdays: {
          shorthand: ["Dl", "Dm", "Dc", "Dj", "Dv", "Ds", "Dg"],
          longhand: [
            "Dilluns",
            "Dimarts",
            "Dimecres",
            "Dijous",
            "Divendres",
            "Dissabte",
            "Diumenge",
          ],
        },
        months: {
          shorthand: [
            "Gen",
            "Feb",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Oct",
            "Nov",
            "Des",
          ],
          longhand: [
            "Gener",
            "Febrer",
            "Març",
            "Abril",
            "Maig",
            "Juny",
            "Juliol",
            "Agost",
            "Setembre",
            "Octubre",
            "Novembre",
            "Desembre",
          ],
        },
        allowInput: true,
      },

      // Altres opcions que podries voler:
      // altInput: true, // Fa servir un input alternatiu per mostrar el text formatat
      // altFormat: "j F, Y (H:i)", // Ex: "31 Desembre, 2025 (23:59)"
      // defaultDate: "today", // Per defecte selecciona el dia d'avui
      // allowInput: true, // Permet escriure manualment (compte amb la validació)
      // etc.
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
      noCalendar: true, // Només temps, sense calendari
      dateFormat: "H:i",
      time_24hr: true, // Format 24h
      // Podem afegir minTime i maxTime, per exemple:
      // minTime: "09:00",
      // maxTime: "17:00",
    };

    flatpickr(inp, options);
  });
}
