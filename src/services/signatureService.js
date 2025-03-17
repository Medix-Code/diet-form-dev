/*******************************************************
 * signatureService.js
 *
 * Lògica de signatures (canvas, modal, etc.).
 * - Gestió de firmes per a la pestanya principal:
 *   · signatureConductor (person1)
 *   · signatureAjudant (person2)
 *
 * Eliminats els camps de "dotacioConductor" i "dotacioAyudante".
 * Només tractem "person1" i "person2".
 *******************************************************/

// Variables de l'estat de la signatura
let signatureConductor = "";
let signatureAjudant = "";

let currentSignatureTarget = null;
let drawing = false;
let ctx = null;

// Control de tocs, doble clic, etc.
let lastTouchTime = 0;
let lastTouchX = 0;
let lastTouchY = 0;

let clickCount = 0;
let clickTimer = null;

// Elements del DOM que farem servir
let signatureModal;
let signatureCanvas;
let signatureCancelBtn;
let signatureAcceptBtn;
let signPerson1Btn;
let signPerson2Btn;

/**
 * Inicialitza tot el sistema de firmes.
 */
export function initSignature() {
  signatureModal = document.getElementById("signature-modal");
  signatureCanvas = document.getElementById("signature-canvas");
  signatureCancelBtn = document.getElementById("signature-cancel");
  signatureAcceptBtn = document.getElementById("signature-accept");

  // Botons de la pestanya principal (persona1 i persona2)
  signPerson1Btn = document.getElementById("sign-person1");
  signPerson2Btn = document.getElementById("sign-person2");

  if (!signatureModal || !signatureCanvas) {
    console.warn("No s'ha trobat el modal o el canvas de la signatura.");
    return;
  }

  // Ajustar canvas i afegir events
  resizeCanvas();
  initCanvasEvents();

  // Events de tancar/acceptar el modal
  signatureCancelBtn?.addEventListener("click", closeSignatureModal);
  signatureAcceptBtn?.addEventListener("click", acceptSignature);

  // Quan es fa clic als botons de signatura
  signPerson1Btn?.addEventListener("click", () =>
    openSignatureModal("person1")
  );
  signPerson2Btn?.addEventListener("click", () =>
    openSignatureModal("person2")
  );

  // Tancar modal si fem clic fora
  window.addEventListener("click", (evt) => {
    if (evt.target === signatureModal) {
      closeSignatureModal();
    }
  });

  // Recalcular la mida del canvas en redimensionar finestra
  window.addEventListener("resize", resizeCanvas);
}

/**
 * Redimensiona el canvas a la mida actual del contenidor.
 */
function resizeCanvas() {
  if (!signatureCanvas) return;
  const container = signatureCanvas.parentElement;
  ctx = signatureCanvas.getContext("2d", { willReadFrequently: true });

  signatureCanvas.width = container.offsetWidth;
  signatureCanvas.height = container.offsetHeight;

  // Configuració bàsica del traç
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
}

/**
 * Registra tots els esdeveniments (ratolí i tàctils) del canvas.
 */
function initCanvasEvents() {
  // Ratolí
  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseout", stopDrawing);

  // Clic simple/doble
  signatureCanvas.addEventListener("click", handleClick);

  // Tàctil
  signatureCanvas.addEventListener("touchstart", startDrawing, {
    passive: false,
  });
  signatureCanvas.addEventListener("touchmove", draw, { passive: false });
  signatureCanvas.addEventListener("touchend", stopDrawing);
  signatureCanvas.addEventListener("touchcancel", stopDrawing);
  signatureCanvas.addEventListener("touchend", onTouchEnd, { passive: false });
}

/**
 * Controla el comportament de doble clic per esborrar el canvas.
 */
function handleClick(e) {
  clickCount++;
  if (clickCount === 1) {
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 300);
  } else if (clickCount === 2) {
    clearTimeout(clickTimer);
    clickCount = 0;
    e.preventDefault();
    clearCanvas();
  }
}

/**
 * Inici del dibuix
 */
function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  const { x, y } = getXY(e);
  ctx.moveTo(x, y);
}

/**
 * Traça mentre mous el ratolí o el dit
 */
function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const { x, y } = getXY(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * Final del dibuix
 */
function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
}

/**
 * Controla la lògica del doble "tap" amb el dit.
 */
function onTouchEnd(e) {
  const now = Date.now();
  const { x, y } = getXY(e);
  const timeDiff = now - lastTouchTime;
  const distX = Math.abs(x - lastTouchX);
  const distY = Math.abs(y - lastTouchY);

  if (timeDiff < 300 && distX < 20 && distY < 20) {
    clearCanvas();
    lastTouchTime = 0;
  } else {
    lastTouchTime = now;
    lastTouchX = x;
    lastTouchY = y;
  }
}

/**
 * Esborra tot el canvas.
 */
function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

/**
 * Retorna les coordenades x,y relatives al canvas.
 */
function getXY(e) {
  const rect = signatureCanvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Obre el modal de signatura i carrega (si en tenim) la signatura prèvia.
 */
function openSignatureModal(target) {
  currentSignatureTarget = target;

  const titleEl = document.getElementById("signature-title");
  if (titleEl) {
    if (target === "person1") {
      titleEl.textContent = "Firma del conductor";
    } else {
      titleEl.textContent = "Firma del ayudante";
    }
  }

  signatureModal.style.display = "block";
  document.body.classList.add("modal-open");

  resizeCanvas();
  clearCanvas();

  // Carreguem la signatura prèvia, si n'hi ha
  let oldSig = target === "person1" ? signatureConductor : signatureAjudant;
  if (oldSig) {
    drawSignatureFromDataUrl(oldSig);
  }
}

/**
 * Dibuixa una imatge (DataURL base64) al canvas.
 */
function drawSignatureFromDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
  };
  image.src = dataUrl;
}

/**
 * Tanca el modal de signatura.
 */
function closeSignatureModal() {
  if (!signatureModal) return;
  signatureModal.style.display = "none";
  document.body.classList.remove("modal-open");
  currentSignatureTarget = null;
}

/**
 * Accepta la signatura (en base64) i la desa a la variable corresponent.
 */
function acceptSignature() {
  const dataURL = signatureCanvas.toDataURL("image/png");
  const isEmpty = isCanvasEmpty();

  if (currentSignatureTarget === "person1") {
    signatureConductor = isEmpty ? "" : dataURL;
    updateSignatureUI(signPerson1Btn, !isEmpty);
  } else if (currentSignatureTarget === "person2") {
    signatureAjudant = isEmpty ? "" : dataURL;
    updateSignatureUI(signPerson2Btn, !isEmpty);
  }

  closeSignatureModal();
}

/**
 * Comprovem si el canvas està completament en blanc.
 */
function isCanvasEmpty() {
  if (!ctx) return true;
  const pixels = ctx.getImageData(
    0,
    0,
    signatureCanvas.width,
    signatureCanvas.height
  ).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return false;
  }
  return true;
}

/**
 * Actualitza la icona del botó de signatura (ex: signature.svg -> signature_ok.svg).
 */
function updateSignatureUI(button, hasSignature) {
  if (!button) return;
  const icon = button.querySelector(".icon");
  if (hasSignature) {
    button.classList.add("signed");
    if (icon) icon.src = "assets/icons/signature_ok.svg";
  } else {
    button.classList.remove("signed");
    if (icon) icon.src = "assets/icons/signature.svg";
  }
}

// ──────────────────────────────────────────────────────────────
// Funcions GET/SET per reutilitzar fora
// ──────────────────────────────────────────────────────────────

export function getSignatureConductor() {
  return signatureConductor;
}

export function getSignatureAjudant() {
  return signatureAjudant;
}

export function setSignatureConductor(value) {
  signatureConductor = value;
}

export function setSignatureAjudant(value) {
  signatureAjudant = value;
}

/**
 * Actualitza els botons de signatura segons si tenim firma o no.
 */
export function updateSignatureIcons() {
  if (signPerson1Btn) {
    const hasSig1 = !!signatureConductor;
    updateSignatureUI(signPerson1Btn, hasSig1);
  }
  if (signPerson2Btn) {
    const hasSig2 = !!signatureAjudant;
    updateSignatureUI(signPerson2Btn, hasSig2);
  }
}
