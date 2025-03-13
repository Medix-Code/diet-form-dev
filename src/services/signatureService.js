/**
 * Lògica de signatures (canvas, modal, etc.).
 */

// Variables de l'estat de la signatura
let signatureConductor = "";
let signatureAjudant = "";
let signatureDotacioConductor = "";
let signatureDotacioAyudante = "";

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
let signDotacioConductorBtn;
let signDotacioAyudanteBtn;

/**
 * Inicialitza tot el mòdul de signatures.
 */
export function initSignature() {
  signatureModal = document.getElementById("signature-modal");
  signatureCanvas = document.getElementById("signature-canvas");
  signatureCancelBtn = document.getElementById("signature-cancel");
  signatureAcceptBtn = document.getElementById("signature-accept");

  // Botons de la pestanya principal
  signPerson1Btn = document.getElementById("sign-person1");
  signPerson2Btn = document.getElementById("sign-person2");

  // Botons del modal de dotació
  signDotacioConductorBtn = document.getElementById("sign-dotacio-conductor");
  signDotacioAyudanteBtn = document.getElementById("sign-dotacio-ayudante");

  if (!signatureModal || !signatureCanvas) {
    console.warn("No s'ha trobat el modal o el canvas de firma.");
    return;
  }

  resizeCanvas();
  initCanvasEvents();

  // Esdeveniments per tancar i acceptar
  signatureCancelBtn?.addEventListener("click", closeSignatureModal);
  signatureAcceptBtn?.addEventListener("click", acceptSignature);

  // Pestanya principal
  signPerson1Btn?.addEventListener("click", () =>
    openSignatureModal("person1")
  );
  signPerson2Btn?.addEventListener("click", () =>
    openSignatureModal("person2")
  );

  // Modal de dotació
  signDotacioConductorBtn?.addEventListener("click", () =>
    openSignatureModal("dotacioConductor")
  );
  signDotacioAyudanteBtn?.addEventListener("click", () =>
    openSignatureModal("dotacioAyudante")
  );

  // Tancar si fem clic fora del modal
  window.addEventListener("click", (evt) => {
    if (evt.target === signatureModal) {
      closeSignatureModal();
    }
  });

  // Recalcular mida del canvas si canvies la finestra
  window.addEventListener("resize", resizeCanvas);
}

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

function initCanvasEvents() {
  // Ratolí
  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseout", stopDrawing);

  // Clic simple/doble
  signatureCanvas.addEventListener("click", handleClick);

  // Touch
  signatureCanvas.addEventListener("touchstart", startDrawing, {
    passive: false,
  });
  signatureCanvas.addEventListener("touchmove", draw, { passive: false });
  signatureCanvas.addEventListener("touchend", stopDrawing);
  signatureCanvas.addEventListener("touchcancel", stopDrawing);
  signatureCanvas.addEventListener("touchend", onTouchEnd, { passive: false });
}

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

function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  const { x, y } = getXY(e);
  ctx.moveTo(x, y);
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const { x, y } = getXY(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
}

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

function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

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
 * Obre el modal i carrega (si existeix) la signatura prèvia
 */
function openSignatureModal(target) {
  currentSignatureTarget = target;

  const modalTitleEl = document.getElementById("signature-title");
  if (modalTitleEl) {
    switch (target) {
      case "person1":
        modalTitleEl.textContent = "Firma del conductor (principal)";
        break;
      case "person2":
        modalTitleEl.textContent = "Firma del ayudante (principal)";
        break;
      case "dotacioConductor":
        modalTitleEl.textContent = "Firma del conductor (dotación)";
        break;
      case "dotacioAyudante":
        modalTitleEl.textContent = "Firma del ayudante (dotación)";
        break;
    }
  }

  signatureModal.style.display = "block";
  document.body.classList.add("modal-open");

  resizeCanvas();
  clearCanvas();

  // Carrega signatura prèvia
  let oldSig = "";
  switch (target) {
    case "person1":
      oldSig = signatureConductor;
      break;
    case "person2":
      oldSig = signatureAjudant;
      break;
    case "dotacioConductor":
      oldSig = signatureDotacioConductor;
      break;
    case "dotacioAyudante":
      oldSig = signatureDotacioAyudante;
      break;
  }
  if (oldSig) {
    drawSignatureFromDataUrl(oldSig);
  }
}

function drawSignatureFromDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
  };
  image.src = dataUrl;
}

function closeSignatureModal() {
  if (!signatureModal) return;
  signatureModal.style.display = "none";
  document.body.classList.remove("modal-open");
  currentSignatureTarget = null;
}

/**
 * Accepta la signatura i la desa a la variable corresponent
 */
function acceptSignature() {
  const dataURL = signatureCanvas.toDataURL("image/png");
  const empty = isCanvasEmpty();

  switch (currentSignatureTarget) {
    case "person1":
      signatureConductor = empty ? "" : dataURL;
      updateSignatureUI(signPerson1Btn, !empty);
      break;
    case "person2":
      signatureAjudant = empty ? "" : dataURL;
      updateSignatureUI(signPerson2Btn, !empty);
      break;
    case "dotacioConductor":
      signatureDotacioConductor = empty ? "" : dataURL;
      updateSignatureUI(signDotacioConductorBtn, !empty);
      break;
    case "dotacioAyudante":
      signatureDotacioAyudante = empty ? "" : dataURL;
      updateSignatureUI(signDotacioAyudanteBtn, !empty);
      break;
  }

  closeSignatureModal();
}

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
 * Funcions GET/SET per a la pestanya principal
 */
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
 * GET per al modal de dotació
 */
export function getSignatureDotacioConductor() {
  return signatureDotacioConductor;
}
export function getSignatureDotacioAyudante() {
  return signatureDotacioAyudante;
}

/**
 * "Netejar" les variables de firma del modal de dotació
 */
export function clearDotacioSignatures() {
  signatureDotacioConductor = "";
  signatureDotacioAyudante = "";
}

/**
 * Actualitza la UI dels botons de la pestanya principal (opcional).
 */
export function updateSignatureIcons() {
  if (signPerson1Btn) {
    const condHasSig = !!signatureConductor;
    updateSignatureUI(signPerson1Btn, condHasSig);
  }
  if (signPerson2Btn) {
    const ajudHasSig = !!signatureAjudant;
    updateSignatureUI(signPerson2Btn, ajudHasSig);
  }
}
