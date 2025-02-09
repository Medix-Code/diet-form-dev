/**
 * Lògica de signatures (canvas, modal, etc.).
 * Abans era "signature.js"
 */

let signatureConductor = "";
let signatureAjudant = "";

let currentSignatureTarget = null;
let drawing = false;
let ctx = null;

let lastTouchTime = 0;
let lastTouchX = 0;
let lastTouchY = 0;

let clickCount = 0;
let clickTimer = null;

let signatureModal;
let signatureCanvas;
let signatureCancelBtn;
let signatureAcceptBtn;
let signPerson1Btn;
let signPerson2Btn;

/**
 * Inicialitza tot el mòdul de signatures
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

  resizeCanvas();
  initCanvasEvents();

  signatureCancelBtn?.addEventListener("click", closeSignatureModal);
  signatureAcceptBtn?.addEventListener("click", acceptSignature);
  signPerson1Btn?.addEventListener("click", () =>
    openSignatureModal("person1")
  );
  signPerson2Btn?.addEventListener("click", () =>
    openSignatureModal("person2")
  );

  window.addEventListener("click", (evt) => {
    if (evt.target === signatureModal) {
      closeSignatureModal();
    }
  });

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
  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseout", stopDrawing);

  signatureCanvas.addEventListener("click", handleClick);

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
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function openSignatureModal(target) {
  currentSignatureTarget = target;

  const modalTitleEl = document.getElementById("signature-title");
  if (modalTitleEl) {
    modalTitleEl.textContent =
      target === "person1" ? "Firma del conductor" : "Firma del ayudante";
  }

  // Mostrem el modal de firma
  signatureModal.style.display = "block";
  document.body.classList.add("modal-open");

  // Esperem al proper frame (o un petit timeout) abans de redimensionar:
  requestAnimationFrame(() => {
    resizeCanvas();
    clearCanvas();

    let oldSig = "";
    if (target === "person1") oldSig = signatureConductor;
    else if (target === "person2") oldSig = signatureAjudant;

    if (oldSig) {
      drawSignatureFromDataUrl(oldSig);
    }
  });
}

function drawSignatureFromDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
  };
  image.src = dataUrl;
}

function closeSignatureModal() {
  if (signatureModal) {
    signatureModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
  currentSignatureTarget = null;
}

function acceptSignature() {
  const dataURL = signatureCanvas.toDataURL("image/png");
  if (isCanvasEmpty()) {
    // sense signatura
    if (currentSignatureTarget === "person1") {
      signatureConductor = "";
      signPerson1Btn?.classList.remove("signed");
      const icon = signPerson1Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature.svg";
    } else if (currentSignatureTarget === "person2") {
      signatureAjudant = "";
      signPerson2Btn?.classList.remove("signed");
      const icon = signPerson2Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature.svg";
    }
  } else {
    // hi ha signatura
    if (currentSignatureTarget === "person1") {
      signatureConductor = dataURL;
      signPerson1Btn?.classList.add("signed");
      const icon = signPerson1Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature_ok.svg";
    } else if (currentSignatureTarget === "person2") {
      signatureAjudant = dataURL;
      signPerson2Btn?.classList.add("signed");
      const icon = signPerson2Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature_ok.svg";
    }
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
    if (pixels[i] !== 0) {
      return false;
    }
  }
  return true;
}

export function getSignatureConductor() {
  return signatureConductor;
}
export function setSignatureConductor(value) {
  signatureConductor = value;
}
export function getSignatureAjudant() {
  return signatureAjudant;
}
export function setSignatureAjudant(value) {
  signatureAjudant = value;
}

export function updateSignatureIcons() {
  if (signatureConductor && signPerson1Btn) {
    signPerson1Btn.classList.add("signed");
    const icon = signPerson1Btn.querySelector(".icon");
    if (icon) icon.src = "assets/icons/signature_ok.svg";
  } else {
    signPerson1Btn?.classList.remove("signed");
    const icon = signPerson1Btn?.querySelector(".icon");
    if (icon) icon.src = "assets/icons/signature.svg";
  }

  if (signatureAjudant && signPerson2Btn) {
    signPerson2Btn.classList.add("signed");
    const icon = signPerson2Btn.querySelector(".icon");
    if (icon) icon.src = "assets/icons/signature_ok.svg";
  } else {
    signPerson2Btn?.classList.remove("signed");
    const icon = signPerson2Btn?.querySelector(".icon");
    if (icon) icon.src = "assets/icons/signature.svg";
  }
}
