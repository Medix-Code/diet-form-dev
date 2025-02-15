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
  let tapCount = 0;
  let tapTimeout;
  const topBar = document.querySelector(".top-bar");
  if (!topBar) return;

  topBar.addEventListener("touchend", () => {
    tapCount++;
    if (tapCount === 5) {
      showEasterEggIcon();
      tapCount = 0;
      clearTimeout(tapTimeout);
    } else {
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, 1000);
    }
  });
}

function showEasterEggIcon() {
  // Crea un overlay que cobreixi tota la pantalla
  const overlay = document.createElement("div");
  overlay.className = "easter-egg-overlay";

  // Afegeix l'overlay al body
  document.body.appendChild(overlay);

  // Crea el contenidor de l'icona
  const iconContainer = document.createElement("div");
  iconContainer.className = "easter-egg-icon";
  // Inclou la imatge i un text a sota
  iconContainer.innerHTML = `
    <img src="assets/icons/egg.svg" alt="Easter Egg Icon">
    <p class="easter-egg-text">Carrot Easter!</p>
  `;

  // Afegeix el contenidor de l'icona a l'overlay
  overlay.appendChild(iconContainer);

  // Evita que els clics en l'overlay passin als elements subjacents
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    // Opcional: si es fa clic fora de l'icona, pots fer que desaparegui l'easter egg
    // overlay.remove();
  });

  // Quan es cliqui a l'icona, aplica l'animació i elimina tot l'overlay
  iconContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    iconContainer.classList.add("clicked");
    setTimeout(() => {
      overlay.remove();
    }, 1000); // 1 segon per a l'animació
  });
}
