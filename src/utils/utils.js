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
 * 📌 Retorna la franja horària segons l'hora actual.
 * - Entre les 6:00 i les 17:59 → retorna "lunch" (Comida).
 * - Entre les 18:00 i les 5:59 → retorna "dinner" (Cena).
 * @returns {"lunch" | "dinner"} Franja horària corresponent.
 */
export function getCurrentDietType() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "lunch" : "dinner";
}

/**
 * 📌 Estableix automàticament la franja horària al `<select>` del formulari.
 * - S'assigna "lunch" o "dinner" segons l'hora actual.
 * - Assegura que l'usuari veu la franja horària correcta en carregar la pàgina.
 */
export function setDefaultDietSelect() {
  const dietSelect = document.getElementById("diet-type");
  if (dietSelect) {
    dietSelect.value = getCurrentDietType();
    dietSelect.style.visibility = "visible"; // Mostrar-lo després d'assignar el valor
  }
}

/**
 * 📌 Converteix una data en format ISO ("YYYY-MM-DD") a format "DD/MM/YY".
 * - Si la data no és vàlida, retorna una cadena buida.
 * @param {string} dietDate - Data en format "YYYY-MM-DD".
 * @param {"lunch" | "dinner" | null} dietType - Franja horària (opcional).
 * @returns {{ ddmmaa: string, franjaText: string }} Data formatada i franja textual.
 */
export function getDietDisplayInfo(dietDate, dietType) {
  let ddmmaa = "";

  // 🔹 Convertir la data de "YYYY-MM-DD" a "DD/MM/YY"
  if (dietDate) {
    const parts = dietDate.split("-");
    if (parts.length === 3) {
      const yy = parts[0].slice(-2); // Últims dos dígits de l'any
      ddmmaa = `${parts[2]}/${parts[1]}/${yy}`;
    }
  }

  // 🔹 Convertir "lunch" o "dinner" en text llegible per a l'usuari
  const franjaText =
    dietType === "lunch" ? "comida" : dietType === "dinner" ? "cena" : "dieta"; // Valor per defecte si no és "lunch" ni "dinner"

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
