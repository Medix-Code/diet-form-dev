/**
 * Lògica de Toast
 */

let toastQueue = [];
let toastVisible = false;

/**
 * Mostra un toast
 */
export function showToast(message, type = "success") {
  toastQueue.push({ message, type });
  processQueue();
}

function processQueue() {
  if (toastVisible) return;
  if (toastQueue.length === 0) return;

  const { message, type } = toastQueue.shift();
  displayToast(message, type);
}

function displayToast(message, type) {
  toastVisible = true;
  const container = document.getElementById("toast-container");
  if (!container) {
    console.error("[UI] #toast-container no encontrado!");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    toastVisible = false;
    processQueue();
  }, 3000);
}
