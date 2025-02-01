/**
 * Lògica relacionada amb els panells de Serveis.
 * Abans era "services.js"
 */

// Array amb les classes de color
export const serviceColors = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
];

// Colors de fons i vores
export const serviceDynamicColors = {
  "service-1": { background: "#e9f7ef", border: "#8ddfd0" },
  "service-2": { background: "#e8f4fd", border: "#bad7f9" },
  "service-3": { background: "#fdf0e6", border: "#f0cdaa" },
  "service-4": { background: "#f9e6ff", border: "#e1b6f4" },
};

// Índex de servei actual
let currentServiceIndex = 0;

/**
 * Retorna l'índex del servei actual
 */
export function getCurrentServiceIndex() {
  return currentServiceIndex;
}

/**
 * Actualitza l'índex del servei actual
 */
function setCurrentServiceIndex(index) {
  currentServiceIndex = index;
}

const servicesContainer = document.getElementById("services-container");

/**
 * Inicialitza els serveis
 */
export function initServices() {
  createServiceButtons();
  showService(currentServiceIndex);
}

/**
 * Crea els botons per cada servei
 */
function createServiceButtons() {
  const container = document.getElementById("service-buttons-container");
  const allServices = servicesContainer.querySelectorAll(".service");
  container.innerHTML = "";

  allServices.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.className = "service-button";
    btn.textContent = `S${i + 1}`;

    const serviceClass = serviceColors[i];
    btn.style.backgroundColor =
      serviceDynamicColors[serviceClass]?.border || "#17a2b8";

    btn.addEventListener("click", () => {
      showService(i);
    });

    container.appendChild(btn);
  });
}

/**
 * Mostra el servei seleccionat, amaga la resta
 */
function showService(index) {
  const allServices = servicesContainer.querySelectorAll(".service");
  setCurrentServiceIndex(index);

  allServices.forEach((serviceEl, i) => {
    serviceEl.style.display = i === index ? "block" : "none";
  });

  const squares = document.querySelectorAll(".service-button");
  squares.forEach((sq, i) => {
    if (i === index) {
      sq.classList.add("active-square");
      sq.style.opacity = "1";
    } else {
      sq.classList.remove("active-square");
      sq.style.opacity = "0.5";
    }
  });

  const clearButton = document.getElementById("clear-selected-service");
  if (clearButton) {
    updateClearButtonColor(clearButton, index);
  }
}

/**
 * Neteja els camps d'un servei
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
 * Actualitza el color del botó "Netejar servei seleccionat"
 */
export function updateClearButtonColor(button, serviceIndex) {
  const colorClass = serviceColors[serviceIndex] || "";
  button.className = `clear-selected-btn ${colorClass}`;
}

/**
 * Valida un número de servei (exactament 9 dígits)
 */
export function validateServiceNumber(value) {
  const regex = /^\d{9}$/;
  return regex.test(value);
}

/**
 * Valida que els temps d'origen/destí/final siguin coherents
 */
export function validateServiceTimesForAll() {
  const allServices = document.querySelectorAll(".service");
  for (let service of allServices) {
    const originTime = service.querySelector(".origin-time").value;
    const destinationTime = service.querySelector(".destination-time").value;
    const endTime = service.querySelector(".end-time").value;

    if (originTime && destinationTime && endTime) {
      const originMinutes = timeToMinutes(originTime);
      const destinationMinutes = timeToMinutes(destinationTime);
      const endMinutes = timeToMinutes(endTime);

      if (originMinutes > destinationMinutes) return false;
      if (destinationMinutes > endMinutes) return false;
      if (originMinutes > endMinutes) return false;
    }
  }
  return true;
}

function timeToMinutes(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}
