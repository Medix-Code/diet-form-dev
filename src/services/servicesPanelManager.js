/**
 * Lògica relacionada amb els panells de Serveis.
 */

// Array amb les classes de servei
export const serviceColors = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
];

// Índex de servei actual
let currentServiceIndex = 0;

/**
 * Retorna l'índex del servei actual
 */
export const getCurrentServiceIndex = () => currentServiceIndex;

/**
 * Estableix l'índex del servei actual
 * @param {number} index - Nou índex de servei
 */
const setCurrentServiceIndex = (index) => {
  currentServiceIndex = index;
};

// Obtenim referències als elements del DOM
const servicesContainer = document.getElementById("services-container");

/**
 * Inicialitza la lògica dels serveis:
 *  - Crea els botons per canviar de servei
 *  - Mostra el servei amb índex 0
 */
export function initServices() {
  createServiceButtons();
  showService(currentServiceIndex);
}

/**
 * Crea els botons de selecció de serveis dinàmicament
 */
const createServiceButtons = () => {
  const container = document.getElementById("service-buttons-container");
  const allServices = servicesContainer.querySelectorAll(".service");

  // Neteja qualsevol contingut anterior
  container.innerHTML = "";

  // Crea un botó per a cada servei
  allServices.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.className = `service-button ${serviceColors[i]}`;
    btn.textContent = `S${i + 1}`;

    // En fer clic, mostrem el servei corresponent
    btn.addEventListener("click", () => {
      showService(i);
    });

    container.appendChild(btn);
  });
};

/**
 * Mostra i activa visualment el servei amb l'índex proporcionat
 * @param {number} index - Índex del servei a mostrar
 */
const showService = (index) => {
  const allServices = servicesContainer.querySelectorAll(".service");
  setCurrentServiceIndex(index);

  // Mostra només el servei seleccionat, amaga els altres
  allServices.forEach((serviceEl, i) => {
    serviceEl.style.display = i === index ? "block" : "none";
  });

  // Actualitza l'estat de tots els botons
  const buttons = document.querySelectorAll(".service-button");
  buttons.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add("active-square");
      btn.style.opacity = "1";
    } else {
      btn.classList.remove("active-square");
      btn.style.opacity = "0.5";
    }
  });

  // Actualitza el botó d'"esborrar" si existeix
  const clearButton = document.getElementById("clear-selected-service");
  if (clearButton) {
    clearButton.className = `clear-selected-btn ${serviceColors[index]}`;
  }
};

/**
 * Neteja tots els camps de text i select d'un servei donat
 * @param {HTMLElement} serviceEl - L'element del DOM que conté el servei
 */
export function clearServiceFields(serviceEl) {
  serviceEl
    .querySelectorAll('input[type="text"], input[type="time"]')
    .forEach((input) => {
      input.value = "";
      input.classList.remove("input-error");
    });

  serviceEl.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0;
    select.classList.remove("input-error");
  });
}

/**
 * Valida un número de servei (ha de tenir exactament 9 dígits)
 * @param {string} value - El número a validar
 * @returns {boolean} Cert si és vàlid, fals altrament
 */
export function validateServiceNumber(value) {
  const regex = /^\d{9}$/;
  return regex.test(value);
}
