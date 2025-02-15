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
      // Quan s'arriba a 5 tocs, crea un element per mostrar l'icona
      showEasterEggIcon();
      tapCount = 0;
      clearTimeout(tapTimeout);
    } else {
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, 2000);
    }
  });
}

function showEasterEggIcon() {
  // Crea un contenidor per a l'icona de l'easter egg
  const iconContainer = document.createElement("div");
  iconContainer.className = "easter-egg-icon";
  iconContainer.innerHTML = `<img src="assets/icons/egg.png" alt="Easter Egg Icon">`;

  // Afegeix l'element al cos del document
  document.body.appendChild(iconContainer);

  // Després de 3 segons, elimina'l
  setTimeout(() => {
    iconContainer.remove();
  }, 3000);
}
