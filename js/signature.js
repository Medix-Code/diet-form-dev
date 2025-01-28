// js/signature.js

// Variables para almacenar las firmas del conductor y el ayudante
let signatureConductor = "";
let signatureAjudant = "";

// Variable para determinar el objetivo actual de la firma ("person1" o "person2")
let currentSignatureTarget = null;
let drawing = false; // Estado de dibujo
let ctx = null; // Contexto del canvas

// Variables para manejar toques rápidos en dispositivos móviles
let lastTouchTime = 0;
let lastTouchX = 0;
let lastTouchY = 0;

// Variables para manejar doble clic manualmente
let clickCount = 0;
let clickTimer = null;

// Referencias a elementos del DOM
let signatureModal;
let signatureCanvas;
let signatureCancelBtn;
let signatureAcceptBtn;
let signPerson1Btn;
let signPerson2Btn;

/**
 * Función que inicializa el módulo de firmas
 */
export function initSignature() {
  console.log("Inicializando el módulo de firmas"); // Línea de depuración

  // Obtiene referencias a los elementos del DOM
  signatureModal = document.getElementById("signature-modal");
  signatureCanvas = document.getElementById("signature-canvas");
  signatureCancelBtn = document.getElementById("signature-cancel");
  signatureAcceptBtn = document.getElementById("signature-accept");
  signPerson1Btn = document.getElementById("sign-person1");
  signPerson2Btn = document.getElementById("sign-person2");

  // Verifica que el modal y el canvas existan en el DOM
  if (!signatureModal || !signatureCanvas) {
    console.warn("No se ha encontrado el modal o el lienzo de firma.");
    return;
  }

  resizeCanvas(); // Ajusta el tamaño del canvas
  initCanvasEvents(); // Inicializa los eventos del canvas

  // Añade escuchadores de eventos a los botones
  signatureCancelBtn?.addEventListener("click", closeSignatureModal);
  signatureAcceptBtn?.addEventListener("click", acceptSignature);
  signPerson1Btn?.addEventListener("click", () =>
    openSignatureModal("person1")
  );
  signPerson2Btn?.addEventListener("click", () =>
    openSignatureModal("person2")
  );

  // Cierra el modal si se hace clic fuera de él
  window.addEventListener("click", (evt) => {
    if (evt.target === signatureModal) {
      closeSignatureModal();
    }
  });

  // Añadir evento de redimensionamiento para ajustar el canvas
  window.addEventListener("resize", resizeCanvas);
}

/**
 * Función que ajusta el tamaño del canvas al contenedor
 */
function resizeCanvas() {
  const container = signatureCanvas.parentElement;
  ctx = signatureCanvas.getContext("2d", { willReadFrequently: true });

  signatureCanvas.width = container.offsetWidth;
  signatureCanvas.height = container.offsetHeight;

  console.log(
    `Canvas redimensionado a: ${signatureCanvas.width}x${signatureCanvas.height}`
  ); // Línea de depuración

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000"; // Color de la línea (negro)
}

/**
 * Función que inicializa los eventos del canvas para dibujar
 */
function initCanvasEvents() {
  console.log("Inicializando eventos del canvas"); // Línea de depuración

  // Eventos de mouse
  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseout", stopDrawing);

  // Evento de clic para manejar el doble clic manualmente
  signatureCanvas.addEventListener("click", handleClick);

  // Eventos táctiles
  signatureCanvas.addEventListener("touchstart", startDrawing, {
    passive: false,
  });
  signatureCanvas.addEventListener("touchmove", draw, { passive: false });
  signatureCanvas.addEventListener("touchend", stopDrawing);
  signatureCanvas.addEventListener("touchcancel", stopDrawing);
  signatureCanvas.addEventListener("touchend", onTouchEnd, { passive: false });
}

/**
 * Función para manejar los clics y detectar el doble clic manualmente
 * @param {MouseEvent} e - Evento de clic
 */
function handleClick(e) {
  clickCount++;
  if (clickCount === 1) {
    // Espera un breve período para detectar un segundo clic
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 300);
  } else if (clickCount === 2) {
    clearTimeout(clickTimer);
    clickCount = 0;
    e.preventDefault();
    console.log("Doble clic detectado manualmente en el canvas"); // Línea de depuración
    clearCanvas(); // Doble clic para limpiar el canvas
  }
}

/**
 * Función que inicia el dibujo en el canvas
 * @param {Event} e - Evento de mouse o toque
 */
function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  const { x, y } = getXY(e);
  ctx.moveTo(x, y);
}

/**
 * Función que dibuja en el canvas mientras se mueve el mouse o el dedo
 * @param {Event} e - Evento de mouse o toque
 */
function draw(e) {
  if (!drawing) return;
  e.preventDefault(); // Previene el comportamiento por defecto (como el desplazamiento)
  const { x, y } = getXY(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * Función que detiene el dibujo en el canvas
 */
function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
}

/**
 * Función que maneja el final de un toque para detectar doble toque
 * @param {TouchEvent} e - Evento de toque
 */
function onTouchEnd(e) {
  const now = Date.now();
  const { x, y } = getXY(e);
  const timeDiff = now - lastTouchTime;
  const distX = Math.abs(x - lastTouchX);
  const distY = Math.abs(y - lastTouchY);

  console.log(
    `Tiempo entre toques: ${timeDiff} ms, Distancia X: ${distX}, Distancia Y: ${distY}`
  ); // Línea de depuración

  // Detecta un doble toque basado en el tiempo y la distancia
  if (timeDiff < 300 && distX < 20 && distY < 20) {
    console.log("Doble toque detectado en el canvas"); // Línea de depuración
    clearCanvas(); // Doble toque para limpiar el canvas
    lastTouchTime = 0;
  } else {
    lastTouchTime = now;
    lastTouchX = x;
    lastTouchY = y;
  }
}

/**
 * Función que limpia el contenido del canvas
 */
function clearCanvas() {
  if (ctx) {
    console.log("Limpiando el canvas"); // Línea de depuración
    ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  } else {
    console.warn("Contexto del canvas no está definido.");
  }
}

/**
 * Función que obtiene las coordenadas X e Y del evento
 * @param {Event} e - Evento de mouse o toque
 * @returns {Object} Objeto con las coordenadas x e y
 */
function getXY(e) {
  const rect = signatureCanvas.getBoundingClientRect();
  let clientX, clientY;

  // Determina si el evento es táctil o de mouse
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
 * Función que abre el modal de firma para una persona específica
 * @param {string} target - Objetivo de la firma ("person1" o "person2")
 */
function openSignatureModal(target) {
  currentSignatureTarget = target;
  signatureModal.style.display = "block";
  document.body.classList.add("modal-open");

  resizeCanvas(); // Ajusta el tamaño del canvas al abrir el modal
  clearCanvas(); // Limpia el canvas al abrir el modal

  // Si ya existe una firma previa, la dibuja en el canvas
  let oldSig = "";
  if (target === "person1") oldSig = signatureConductor;
  else if (target === "person2") oldSig = signatureAjudant;

  if (oldSig) {
    drawSignatureFromDataUrl(oldSig);
  }
}

/**
 * Función que dibuja una firma desde una URL de datos (data URL)
 * @param {string} dataUrl - URL de datos de la imagen de la firma
 */
function drawSignatureFromDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
  };
  image.src = dataUrl;
}

/**
 * Función que cierra el modal de firma
 */
function closeSignatureModal() {
  signatureModal.style.display = "none";
  document.body.classList.remove("modal-open");
  currentSignatureTarget = null;
}

/**
 * Función que acepta la firma dibujada y la guarda
 */
function acceptSignature() {
  const dataURL = signatureCanvas.toDataURL("image/png");
  // Verifica si el canvas está vacío
  if (isCanvasEmpty()) {
    // Si el canvas está vacío, elimina la firma existente
    if (currentSignatureTarget === "person1") {
      signatureConductor = "";
      signPerson1Btn?.classList.remove("signed");

      // Cambia el icono a la versión “gris”
      const icon = signPerson1Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature.svg";
    } else if (currentSignatureTarget === "person2") {
      signatureAjudant = "";
      signPerson2Btn?.classList.remove("signed");

      // Cambia el icono a la versión “gris”
      const icon = signPerson2Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature.svg";
    }
  } else {
    // Si el canvas NO está vacío, guarda la firma
    if (currentSignatureTarget === "person1") {
      signatureConductor = dataURL;
      signPerson1Btn?.classList.add("signed");

      // Cambia el icono a la versión “verde”
      const icon = signPerson1Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature_ok.svg";
    } else if (currentSignatureTarget === "person2") {
      signatureAjudant = dataURL;
      signPerson2Btn?.classList.add("signed");

      // Cambia el icono a la versión “verde”
      const icon = signPerson2Btn?.querySelector(".icon");
      if (icon) icon.src = "assets/icons/signature_ok.svg";
    }
  }

  closeSignatureModal(); // Cierra el modal después de aceptar
}

/**
 * Función que verifica si el canvas está vacío
 * @returns {boolean} - Retorna true si el canvas está vacío, de lo contrario false
 */
function isCanvasEmpty() {
  const pixels = ctx.getImageData(
    0,
    0,
    signatureCanvas.width,
    signatureCanvas.height
  ).data;
  for (let i = 3; i < pixels.length; i += 4) {
    // Revisa el canal alpha
    if (pixels[i] !== 0) {
      // Si alguna parte no es transparente, el canvas no está vacío
      return false;
    }
  }
  return true; // El canvas está vacío
}

/**
 * Función que obtiene la firma del conductor
 * @returns {string} - Data URL de la firma del conductor
 */
export function getSignatureConductor() {
  return signatureConductor;
}

/**
 * Función que obtiene la firma del ayudante
 * @returns {string} - Data URL de la firma del ayudante
 */
export function getSignatureAjudant() {
  return signatureAjudant;
}

/**
 * Función que establece la firma del conductor
 * @param {string} value - Data URL de la firma del conductor
 */
export function setSignatureConductor(value) {
  signatureConductor = value;
}

/**
 * Función que establece la firma del ayudante
 * @param {string} value - Data URL de la firma del ayudante
 */
export function setSignatureAjudant(value) {
  signatureAjudant = value;
}

/**
 * Función que actualiza los íconos de firma según si existen o no firmas guardadas
 */
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
