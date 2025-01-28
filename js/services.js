// js/services.js

// Array que contiene las clases de color asociadas a cada servicio
export const serviceColors = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
];

// Objeto que mapea cada servicio a sus colores de fondo y borde específicos
export const serviceDynamicColors = {
  "service-1": { background: "#e9f7ef", border: "#8ddfd0" },
  "service-2": { background: "#e8f4fd", border: "#bad7f9" },
  "service-3": { background: "#fdf0e6", border: "#f0cdaa" },
  "service-4": { background: "#f9e6ff", border: "#e1b6f4" },
};

// Variable que mantiene el índice del servicio actualmente seleccionado
let currentServiceIndex = 0;

/**
 * Función que devuelve el índice del servicio actual
 * @returns {number} Índice del servicio actual
 */
export function getCurrentServiceIndex() {
  return currentServiceIndex;
}

/**
 * Función interna para actualizar el índice del servicio actual
 * @param {number} index - Nuevo índice del servicio
 */
function setCurrentServiceIndex(index) {
  currentServiceIndex = index;
}

// Obtiene el contenedor de servicios del DOM
const servicesContainer = document.getElementById("services-container");

/**
 * Función que inicializa los servicios creando los botones correspondientes y mostrando el servicio por defecto
 */
export function initServices() {
  createServiceButtons();
  showService(currentServiceIndex);
}

/**
 * Función interna que crea dinámicamente los botones para cada servicio
 */
function createServiceButtons() {
  // Obtiene el contenedor de los botones de servicio
  const container = document.getElementById("service-buttons-container");
  // Obtiene todos los elementos con la clase "service" dentro del contenedor de servicios
  const allServices = servicesContainer.querySelectorAll(".service");

  // Limpia el contenido previo del contenedor de botones
  container.innerHTML = "";

  // Itera sobre cada servicio para crear su botón correspondiente
  allServices.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.className = "service-button";
    btn.textContent = `S${i + 1}`; // Asigna texto al botón, por ejemplo "S1"

    // Obtiene la clase de color correspondiente al servicio actual
    const serviceClass = serviceColors[i];
    // Asigna el color de fondo del botón según el borde definido en serviceDynamicColors o un color por defecto
    btn.style.backgroundColor =
      serviceDynamicColors[serviceClass]?.border || "#17a2b8";

    // Añade un manejador de eventos para mostrar el servicio al hacer clic
    btn.addEventListener("click", () => {
      showService(i);
    });

    // Añade el botón al contenedor de botones
    container.appendChild(btn);
  });
}

/**
 * Función interna que muestra el contenido del servicio seleccionado y actualiza el estado visual de los botones
 * @param {number} index - Índice del servicio a mostrar
 */
function showService(index) {
  // Obtiene todos los elementos con la clase "service" dentro del contenedor de servicios
  const allServices = servicesContainer.querySelectorAll(".service");

  // Actualiza el índice del servicio actual
  setCurrentServiceIndex(index);

  // Muestra el servicio seleccionado y oculta los demás
  allServices.forEach((serviceEl, i) => {
    serviceEl.style.display = i === index ? "block" : "none";
  });

  // Obtiene todos los botones de servicio
  const squares = document.querySelectorAll(".service-button");
  squares.forEach((sq, i) => {
    if (i === index) {
      sq.classList.add("active-square"); // Añade clase para resaltar el botón activo
      sq.style.opacity = "1"; // Opacidad completa para el botón activo
    } else {
      sq.classList.remove("active-square"); // Remueve clase de resalte
      sq.style.opacity = "0.5"; // Opacidad reducida para botones inactivos
    }
  });

  // Obtiene el botón de "limpiar servicio seleccionado" si existe
  const clearButton = document.getElementById("clear-selected-service");
  if (clearButton) {
    updateClearButtonColor(clearButton, index); // Actualiza el color del botón de limpiar
  }
}

/**
 * Función que limpia los campos de entrada dentro de un elemento de servicio específico
 * @param {HTMLElement} serviceEl - Elemento del servicio cuyos campos se van a limpiar
 */
export function clearServiceFields(serviceEl) {
  // Selecciona todos los inputs de tipo texto y tiempo y los limpia
  serviceEl
    .querySelectorAll('input[type="text"], input[type="time"]')
    .forEach((input) => {
      input.value = "";
      input.classList.remove("input-error"); // Remueve clase de error de validación
    });

  // Selecciona todos los elementos select y restablece su índice seleccionado
  serviceEl.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0;
    select.classList.remove("input-error"); // Remueve clase de error de validación
  });
}

/**
 * Función que actualiza la clase de un botón de limpieza para reflejar el color correspondiente al servicio seleccionado
 * @param {HTMLElement} button - Botón de limpieza a actualizar
 * @param {number} serviceIndex - Índice del servicio seleccionado
 */
export function updateClearButtonColor(button, serviceIndex) {
  const colorClass = serviceColors[serviceIndex] || "";
  button.className = `clear-selected-btn ${colorClass}`; // Asigna clases de estilo al botón
}

/**
 * Función que valida que un número de servicio cumpla con un formato específico (exactamente 9 dígitos)
 * @param {string} value - Valor a validar
 * @returns {boolean} Resultado de la validación
 */
export function validateServiceNumber(value) {
  const regex = /^\d{9}$/;
  return regex.test(value);
}

/**
 * Función que verifica que los tiempos ingresados para cada servicio sean coherentes
 * (la hora de origen debe ser anterior a la hora de destino y esta a su vez anterior a la hora de finalización)
 * @returns {boolean} Resultado de la validación
 */
export function validateServiceTimesForAll() {
  // Selecciona todos los elementos con la clase "service"
  const allServices = document.querySelectorAll(".service");
  for (let service of allServices) {
    const originTime = service.querySelector(".origin-time").value;
    const destinationTime = service.querySelector(".destination-time").value;
    const endTime = service.querySelector(".end-time").value;

    // Si todos los campos de tiempo están llenos, procede a validar
    if (originTime && destinationTime && endTime) {
      const originMinutes = timeToMinutes(originTime);
      const destinationMinutes = timeToMinutes(destinationTime);
      const endMinutes = timeToMinutes(endTime);

      // Verifica la coherencia de los tiempos
      if (originMinutes > destinationMinutes) return false;
      if (destinationMinutes > endMinutes) return false;
      if (originMinutes > endMinutes) return false;
    }
  }
  return true; // Retorna true si todas las validaciones pasan
}

/**
 * Función auxiliar que convierte una cadena de tiempo en formato "HH:MM" a minutos totales
 * @param {string} hhmm - Hora en formato "HH:MM"
 * @returns {number} Minutos totales
 */
function timeToMinutes(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}
