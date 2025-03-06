/**
 * Lògica de signatures (canvas, modal, etc.).
 */

// Variables de l'estat de la signatura
let signatureConductor = "";
let signatureAjudant = "";

let currentSignatureTarget = null;
let drawing = false;
let ctx = null;

// Paràmetres per gestionar els tocs (multitouch, doble clic, etc.)
let lastTouchTime = 0;
let lastTouchX = 0;
let lastTouchY = 0;

let clickCount = 0;
let clickTimer = null;

// Referències als elements del DOM
let signatureModal;
let signatureCanvas;
let signatureCancelBtn;
let signatureAcceptBtn;
let signPerson1Btn;
let signPerson2Btn;

/**
 * Inicialitza tot el mòdul de signatures.
 * S’encarrega de seleccionar els elements del DOM,
 * preparar el canvas i afegir els events necessaris.
 */
export function initSignature() {
  signatureModal = document.getElementById("signature-modal");
  signatureCanvas = document.getElementById("signature-canvas");
  signatureCancelBtn = document.getElementById("signature-cancel");
  signatureAcceptBtn = document.getElementById("signature-accept");
  signPerson1Btn = document.getElementById("sign-person1");
  signPerson2Btn = document.getElementById("sign-person2");

  if (!signatureModal || !signatureCanvas) {
    console.warn("No s'ha trobat el modal o canvas de firma.");
    return;
  }

  // Ajustem el canvas a la mida del contenidor i configurem el context
  resizeCanvas();
  initCanvasEvents();

  // Events per tancar i acceptar el modal de signatura
  signatureCancelBtn?.addEventListener("click", closeSignatureModal);
  signatureAcceptBtn?.addEventListener("click", acceptSignature);

  // Events per obrir el modal de signatura
  signPerson1Btn?.addEventListener("click", () =>
    openSignatureModal("person1")
  );
  signPerson2Btn?.addEventListener("click", () =>
    openSignatureModal("person2")
  );

  // Tancar el modal si es fa clic fora
  window.addEventListener("click", (evt) => {
    if (evt.target === signatureModal) {
      closeSignatureModal();
    }
  });

  // Quan es redimensiona la finestra, recalculam la mida del canvas
  window.addEventListener("resize", resizeCanvas);
}

/**
 * Ajusta el canvas a la mida del seu contenidor i defineix l'estil del traç.
 */
function resizeCanvas() {
  if (!signatureCanvas) return;
  const container = signatureCanvas.parentElement;
  ctx = signatureCanvas.getContext("2d", { willReadFrequently: true });

  signatureCanvas.width = container.offsetWidth;
  signatureCanvas.height = container.offsetHeight;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
}

/**
 * Afegeix esdeveniments del ratolí i tàctils (touch) al canvas
 * per poder dibuixar la signatura.
 */
function initCanvasEvents() {
  // Ratolí
  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseout", stopDrawing);

  // Control de clics (simple/doble) per esborrar
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
 * Gestió del clic per detectar si és un simple o doble clic
 * en el canvas. Amb el doble clic es neteja el canvas.
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
 * Inicia el dibuix quan es premsa el ratolí o s'inicia un touch.
 */
function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  const { x, y } = getXY(e);
  ctx.moveTo(x, y);
}

/**
 * Dibuixa la línia mentre l'usuari arrossega el ratolí o el dit.
 */
function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const { x, y } = getXY(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * Finalitza el dibuix en deixar el ratolí o el dit.
 */
function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
}

/**
 * Gestiona l'esdeveniment "touchend" per detectar un segon toc proper
 * i esborrar la signatura si es considera un "doble toc".
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
 * Esborra completament el contingut del canvas.
 */
function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

/**
 * Retorna les coordenades X i Y relatives al canvas, tant per ratolí com touch.
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

  return { x: clientX - rect.left, y: clientY - rect.top };
}

/**
 * Obre el modal de signatura per "person1" o "person2" i
 * carrega la signatura anterior si n'hi havia.
 */
function openSignatureModal(target) {
  currentSignatureTarget = target;

  // Actualitza el títol del modal segons el target
  const modalTitleEl = document.getElementById("signature-title");
  if (modalTitleEl) {
    if (target === "person1") modalTitleEl.textContent = "Firma del conductor";
    else modalTitleEl.textContent = "Firma del ayudante";
  }

  // Mostra el modal
  signatureModal.style.display = "block";
  document.body.classList.add("modal-open");

  // Ajustem el canvas i l'esborrem
  resizeCanvas();
  clearCanvas();

  // Carrega la signatura anterior si existia
  let oldSig = "";
  if (target === "person1") oldSig = signatureConductor;
  else if (target === "person2") oldSig = signatureAjudant;

  if (oldSig) {
    drawSignatureFromDataUrl(oldSig);
  }
}

/**
 * Dibuixa la signatura a partir d'un dataURL en el canvas.
 */
function drawSignatureFromDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
  };
  image.src = dataUrl;
}

/**
 * Tanca el modal de signatura i reinicia el target actual.
 */
function closeSignatureModal() {
  if (!signatureModal) return;
  signatureModal.style.display = "none";
  document.body.classList.remove("modal-open");
  currentSignatureTarget = null;
}

/**
 * Accepta la signatura actual i la desa en la variable corresponent (conductor/ajudant).
 * Si el canvas és buit, s'interpreta com "sense signatura".
 */
function acceptSignature() {
  const dataURL = signatureCanvas.toDataURL("image/png");
  const emptyCanvas = isCanvasEmpty();

  if (currentSignatureTarget === "person1") {
    if (emptyCanvas) {
      signatureConductor = "";
      updateSignatureUI(signPerson1Btn, false);
    } else {
      signatureConductor = dataURL;
      updateSignatureUI(signPerson1Btn, true);
    }
  } else if (currentSignatureTarget === "person2") {
    if (emptyCanvas) {
      signatureAjudant = "";
      updateSignatureUI(signPerson2Btn, false);
    } else {
      signatureAjudant = dataURL;
      updateSignatureUI(signPerson2Btn, true);
    }
  }
  closeSignatureModal();
}

/**
 * Retorna cert si el canvas és buit (no s'hi ha dibuixat res).
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
 * Actualitza l'aspecte del botó de signatura (ícona, classe "signed", etc.)
 * @param {HTMLElement} button - El botó a actualitzar
 * @param {boolean} hasSignature - Si existeix una signatura o no
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

/**
 * Retorna la signatura del conductor en base64.
 */
export function getSignatureConductor() {
  return signatureConductor;
}

/**
 * Assigna la signatura del conductor (base64).
 */
export function setSignatureConductor(value) {
  signatureConductor = value;
}

/**
 * Retorna la signatura de l'ajudant en base64.
 */
export function getSignatureAjudant() {
  return signatureAjudant;
}

/**
 * Assigna la signatura de l'ajudant (base64).
 */
export function setSignatureAjudant(value) {
  signatureAjudant = value;
}

/**
 * Actualitza els botons de signatura segons si ja hi ha signatura o no.
 */
export function updateSignatureIcons() {
  // Conductor
  if (signatureConductor && signPerson1Btn) {
    updateSignatureUI(signPerson1Btn, true);
  } else {
    updateSignatureUI(signPerson1Btn, false);
  }

  // Ajudant
  if (signatureAjudant && signPerson2Btn) {
    updateSignatureUI(signPerson2Btn, true);
  } else {
    updateSignatureUI(signPerson2Btn, false);
  }
}
