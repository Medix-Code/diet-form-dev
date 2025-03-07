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
 *  - Assigna els event listeners als botons del menú d'opcions
 */
export function initServices() {
  createServiceButtons();
  showService(currentServiceIndex);
  attachOptionsMenuListeners();
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

  // Actualitza l'estat de tots els botons de servei
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
  // Actualitza el botó de la càmera si existeix
  const cameraButton = document.getElementById("camera-in-dropdown");
  if (cameraButton) {
    cameraButton.className = `camera-btn ${serviceColors[index]}`;
  }
  // Actualitza el botó del menú d'opcions si existeix
  const optionButton = document.getElementById("options-toggle");
  if (optionButton) {
    optionButton.className = `options-btn ${serviceColors[index]}`;
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
 * Assigna els event listeners als botons del menú d'opcions (esborrar i càmera)
 * per tancar el menú quan es cliqui en algun d'ells o fora.
 */
function attachOptionsMenuListeners() {
  const optionsMenu = document.getElementById("options-menu");
  const optionsToggleBtn = document.getElementById("options-toggle");
  const clearButton = document.getElementById("clear-selected-service");
  const cameraButton = document.getElementById("camera-in-dropdown");

  // 1) Obrir/tancar el menú en fer clic al botó d'opcions
  if (optionsToggleBtn && optionsMenu) {
    optionsToggleBtn.addEventListener("click", () => {
      optionsMenu.classList.toggle("hidden");
    });

    // 2) Tancar el menú si es fa clic fora
    document.addEventListener("click", (event) => {
      if (
        !optionsToggleBtn.contains(event.target) &&
        !optionsMenu.contains(event.target)
      ) {
        optionsMenu.classList.add("hidden");
      }
    });
  }

  // 3) Quan es fa clic en el botó "esborrar" (clear), tancar el menú
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      // Aquí pots executar la lògica d'esborrar si cal
      optionsMenu.classList.add("hidden");
    });
  }

  // 4) Quan es fa clic en el botó "càmera", tancar el menú
  if (cameraButton) {
    cameraButton.addEventListener("click", () => {
      // Aquí s'executarà la lògica d'OCR (initCameraOcr, etc.)
      optionsMenu.classList.add("hidden");
    });
  }
}
