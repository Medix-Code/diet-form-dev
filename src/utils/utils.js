/**
 * Utilitats diverses
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

export function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Retorna "lunch" o "dinner" segons l'hora actual
 */
export function getCurrentDietType() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "lunch" : "dinner";
}

export function setDefaultDietSelect() {
  const dietSelect = document.getElementById("diet-type");
  if (dietSelect) {
    dietSelect.value = getCurrentDietType();
  }
}

/**
 * Retorna data en format dd/mm/aa i la franja
 */
export function getDietDisplayInfo(dietDate, dietType) {
  let ddmmaa = "";
  if (dietDate) {
    const parts = dietDate.split("-");
    if (parts.length === 3) {
      const yy = parts[0].slice(-2);
      ddmmaa = `${parts[2]}/${parts[1]}/${yy}`;
    }
  }

  let franjaText = "";
  if (dietType === "lunch") franjaText = "comida";
  else if (dietType === "dinner") franjaText = "cena";
  else franjaText = "dieta";

  return { ddmmaa, franjaText };
}

export function easterEgg() {
  let topBarTaps = 0;
  let footerTaps = 0;
  let tapTimeout;

  const topBar = document.querySelector(".top-bar");
  const footer = document.querySelector("footer");

  if (!topBar || !footer) return;

  topBar.addEventListener("touchend", (event) => {
    if (event.changedTouches.length === 1) {
      topBarTaps++;

      // Si es fan 3 tocs correctes a la top-bar, esperem la següent fase
      if (topBarTaps === 3) {
        clearTimeout(tapTimeout);
        tapTimeout = setTimeout(() => {
          topBarTaps = 0;
          footerTaps = 0;
        }, 1000);
      }
    } else {
      resetTaps();
    }
  });

  footer.addEventListener("touchend", (event) => {
    if (event.changedTouches.length === 1 && topBarTaps === 3) {
      footerTaps++;

      // Si es fan 2 tocs correctes al footer després de 3 a la top-bar, activem l'easter egg
      if (footerTaps === 2) {
        showEasterEggIcon();
        resetTaps();
      }
    } else {
      resetTaps();
    }
  });

  function resetTaps() {
    topBarTaps = 0;
    footerTaps = 0;
    clearTimeout(tapTimeout);
  }
}

export function showEasterEggIcon() {
  // Crea un overlay que cobreixi tota la pantalla
  const overlay = document.createElement("div");
  overlay.className = "easter-egg-overlay";

  // Crea el contenidor de l'icona d'easter egg
  const iconContainer = document.createElement("div");
  iconContainer.className = "easter-egg-icon";
  iconContainer.innerHTML = `<img src="assets/icons/egg.svg" alt="Easter Egg Icon">`;

  // Afegeix l'icona a l'overlay i l'overlay al body
  overlay.appendChild(iconContainer);
  document.body.appendChild(overlay);

  // Impedeix que els clics en l'overlay afectin altres elements
  overlay.addEventListener("click", (e) => e.stopPropagation());

  // Quan es cliqui a l'icona, afegeix l'animació, elimina l'overlay i mostra la càmera
  iconContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    iconContainer.classList.add("clicked");
    setTimeout(() => {
      overlay.remove();
      showCameraIcon();
    }, 1000); // Espera 1 segon per a l'animació
  });
}

function showCameraIcon() {
  const cameraBtn = document.getElementById("camera-in-dropdown");
  if (cameraBtn) {
    cameraBtn.style.display = "flex"; // Mostra el botó (o "block", segons el disseny)
    cameraBtn.disabled = false; // Activa el botó
  }
}
