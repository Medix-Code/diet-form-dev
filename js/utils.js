// js/utils.js

/**
 * Estableix la data d'avui en el camp corresponent.
 */
export function setTodayDate() {
  const dateInp = document.getElementById("date");
  if (!dateInp) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  dateInp.value = `${y}-${m}-${d}`;
}

/**
 * Capitalitza la primera lletra d'un text.
 * @param {string} text - El text a capitalitzar.
 * @returns {string} - El text amb la primera lletra en majúscula.
 */
export function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convertir la data al format dd/mm/aa i determinar la franja horària.
 * @param {string} dietDate - Data de la dieta en format YYYY-MM-DD.
 * @param {string} dietType - Tipus de dieta (e.g., "lunch", "dinner").
 * @returns {object} - Objecte amb les propietats ddmmaa i franjaText.
 */
export function getDietDisplayInfo(dietDate, dietType) {
  // Convertir la data al format dd/mm/aa
  let ddmmaa = "";
  if (dietDate) {
    const parts = dietDate.split("-");
    if (parts.length === 3) {
      const yy = parts[0].slice(-2);
      ddmmaa = `${parts[2]}/${parts[1]}/${yy}`;
    }
  }

  // Determinar la franja horària basada en el tipus de dieta
  let franjaText = "";
  if (dietType === "lunch") {
    franjaText = "comida";
  } else if (dietType === "dinner") {
    franjaText = "cena";
  } else {
    franjaText = "dieta";
  }

  return { ddmmaa, franjaText };
}

// Cola para almacenar los toasts pendientes de mostrar
let toastQueue = [];
/**
 * Muestra un toast. Tipos "success" (verde) o "error" (rojo).
 * Se utiliza una cola para evitar la superposición de múltiples toasts.
 * @param {string} message - Texto a mostrar en el toast
 * @param {'success'|'error'} [type='success'] - Tipo de toast, por defecto "success"
 */
export function showToast(message, type = "success") {
  // Añade el toast a la cola
  toastQueue.push({ message, type });
  // Procesa la cola para mostrar el siguiente toast si es posible
  processQueue();
}

// Indicador de si un toast está actualmente visible
let toastVisible = false;

/**
 * Procesa la cola de toasts, mostrando el siguiente si no hay uno actualmente visible
 */
function processQueue() {
  // Si ya hay un toast visible, no hace nada
  if (toastVisible) return;
  // Si la cola está vacía, no hace nada
  if (toastQueue.length === 0) return;

  // Obtiene el siguiente toast de la cola
  const { message, type } = toastQueue.shift();
  // Muestra el toast obtenido
  displayToast(message, type);
}

/**
 * Crea y muestra un toast en el DOM
 * @param {string} message - Texto a mostrar en el toast
 * @param {'success'|'error'} type - Tipo de toast para aplicar estilos correspondientes
 */
function displayToast(message, type) {
  // Obtiene el contenedor de toasts del DOM
  const container = document.getElementById("toast-container");
  if (!container) {
    console.error("[UI] #toast-container no encontrado!");
    return;
  }
  // Indica que un toast está actualmente visible
  toastVisible = true;

  // Crea el elemento del toast
  const toast = document.createElement("div");
  // Asigna las clases correspondientes según el tipo de toast
  toast.className = "toast " + type; // .toast.success o .toast.error
  // Establece el contenido del toast
  toast.innerHTML = message;

  // Añade el toast al contenedor
  container.appendChild(toast);

  // Después de 3 segundos, elimina el toast y procesa el siguiente en la cola
  setTimeout(() => {
    toast.remove(); // Elimina el elemento del DOM
    toastVisible = false; // Indica que ya no hay un toast visible
    processQueue(); // Procesa el siguiente toast en la cola, si lo hay
  }, 3000);
}
