/**
 * Implementació de la base de dades IndexedDB.
 * Ofereix funcions d'alta, consulta, actualització i esborrat de Dietes.
 */

const DB_NAME = "DietasDB";
const DB_VERSION = 1;
const DB_STORE_NAME = "dietas";

/**
 * Obrir (o crear) la base de dades
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        const store = db.createObjectStore(DB_STORE_NAME, {
          keyPath: "id",
          autoIncrement: false,
        });
        store.createIndex("dateTime", "dateTime", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("Error al obrir la base de dades: " + event.target.errorCode);
    };
  });
}

/**
 * Afegir una Dieta
 */
export async function addDiet(diet) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readwrite");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.add(diet);
    req.onsuccess = (evt) => {
      resolve(evt.target.result);
    };
    req.onerror = () => {
      reject("Error al afegir la dieta.");
    };
  });
}

/**
 * Actualitzar una dieta existent
 */
export async function updateDiet(diet) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readwrite");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.put(diet);
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject("Error al actualitzar la dieta.");
    };
  });
}

/**
 * Obtenir totes les dietes
 */
export async function getAllDiets() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readonly");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = (evt) => {
      resolve(evt.target.result);
    };
    req.onerror = () => {
      reject("Error al recuperar les dietes.");
    };
  });
}

/**
 * Obtenir una dieta per la seva ID
 */
export async function getDiet(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readonly");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = (evt) => {
      resolve(evt.target.result);
    };
    req.onerror = () => {
      reject("Error al recuperar la dieta.");
    };
  });
}

/**
 * Esborrar una dieta
 */
export async function deleteDietById(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readwrite");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject("Error al eliminar la dieta.");
    };
  });
}

/**
 * Esborrar totes les dietes
 */
export async function clearAllDiets() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_NAME], "readwrite");
    const store = tx.objectStore(DB_STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject("Error al borrar les dietes.");
    };
  });
}
