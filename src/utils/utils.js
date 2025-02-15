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
  let singleTapCount = 0;
  let tapTimeout;
  const topBar = document.querySelector(".top-bar");
  if (!topBar) return console.warn("No s'ha trobat l'element .top-bar");

  topBar.addEventListener("touchend", (event) => {
    const touchCount = event.changedTouches.length;
    console.log("touchend, changedTouches.length =", touchCount);

    if (touchCount === 1) {
      singleTapCount++;
      console.log("Single tap count:", singleTapCount);
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        console.log("Reset singleTapCount per inactivitat");
        singleTapCount = 0;
      }, 1000);
    } else if (touchCount === 2) {
      console.log(
        "Detected 2 touches. Current singleTapCount:",
        singleTapCount
      );
      if (singleTapCount === 5) {
        showEasterEggIcon();
      } else {
        console.log("No s'han acumulat 5 tocs d'un dit abans del doble toc.");
      }
      singleTapCount = 0;
      clearTimeout(tapTimeout);
    } else {
      console.log("Tocs no esperats, reiniciant contador");
      singleTapCount = 0;
      clearTimeout(tapTimeout);
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
  iconContainer.innerHTML = `<img src="assets/icons/egg.svg" alt="Easter Egg Icon">`;

  // Afegeix el contenidor de l'icona a l'overlay
  overlay.appendChild(iconContainer);

  // Evita que els clics en l'overlay passin als elements subjacents
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    // Opcional: si es fa clic a l'overlay (fora l'icona), pots fer que l'easter egg desaparegui
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
