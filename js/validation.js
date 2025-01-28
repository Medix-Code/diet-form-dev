// js/validation.js

/* --------------------------------------------------
   VALIDACIÓ (MÍNIMA per guardar)
   Necessitem: data, franja, NºServei S1 >=9 dígits
-----------------------------------------------------*/

export function validateMinFieldsForSave() {
  let valid = true;
  const dateInput = document.getElementById("date");
  const dietTypeSelect = document.getElementById("diet-type");
  const service1Number = document.getElementById("service-number-1");

  // netegem errors previs
  [dateInput, dietTypeSelect, service1Number].forEach((el) =>
    el.classList.remove("input-error")
  );

  function markError(el) {
    el.classList.add("input-error");
    valid = false;
  }

  if (!dateInput.value.trim()) markError(dateInput);
  if (!dietTypeSelect.value.trim()) markError(dietTypeSelect);

  const s1val = service1Number.value.trim();
  if (!s1val) {
    markError(service1Number);
  } else if (s1val.length < 9) {
    markError(service1Number);
  }

  return valid;
}

export function validateForPdf() {
  // Pots fer una validació extra si vols
  // Per exemple: vehicle, persona1 o persona2, etc.
  // O deixar-ho igual que la minFields si no ho vols tan estricte
  return validateMinFieldsForSave();
}
