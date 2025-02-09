/**
 * Lògica relacionada amb els panells de Serveis.
 *
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

export function getCurrentServiceIndex() {
  return currentServiceIndex;
}

function setCurrentServiceIndex(index) {
  currentServiceIndex = index;
}

const servicesContainer = document.getElementById("services-container");

export function initServices() {
  createServiceButtons();
  showService(currentServiceIndex);
}

function createServiceButtons() {
  const container = document.getElementById("service-buttons-container");
  const allServices = servicesContainer.querySelectorAll(".service");
  container.innerHTML = "";

  allServices.forEach((_, i) => {
    const btn = document.createElement("button");
    // Afegim la classe "service-button" i la classe específica segons l'índex (service-1, service-2, etc.)
    btn.className = `service-button ${serviceColors[i]}`;
    btn.textContent = `S${i + 1}`;

    btn.addEventListener("click", () => {
      showService(i);
    });

    container.appendChild(btn);
  });
}

function showService(index) {
  const allServices = servicesContainer.querySelectorAll(".service");
  setCurrentServiceIndex(index);

  allServices.forEach((serviceEl, i) => {
    serviceEl.style.display = i === index ? "block" : "none";
  });

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

  const clearButton = document.getElementById("clear-selected-service");
  if (clearButton) {
    // El botó ja té la classe de servei, només cal actualitzar si és necessari
    clearButton.className = `clear-selected-btn ${serviceColors[index]}`;
  }
}

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

export function validateServiceNumber(value) {
  const regex = /^\d{9}$/;
  return regex.test(value);
}
