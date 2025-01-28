/**
 * db.js
 * Funciones para gestionar la base de datos IndexedDB.
 */

// Nombre de la base de datos
const DB_NAME = "DietasDB";
// Versión de la base de datos
const DB_VERSION = 1;
// Nombre de la tienda de objetos (object store)
const DB_STORE_NAME = "dietas";

/**
 * Abre (o crea si no existe) la base de datos con la versión definida.
 * @returns {Promise<IDBDatabase>} Promesa que resuelve con la instancia de la base de datos.
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    // Solicita abrir la base de datos con el nombre y versión especificados
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Evento que se dispara si es necesario actualizar la base de datos (crear object stores, índices, etc.)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Verifica si la tienda de objetos no existe y la crea
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        const store = db.createObjectStore(DB_STORE_NAME, {
          keyPath: "id", // Define la clave primaria
          autoIncrement: true, // Habilita el auto-incremento para la clave primaria
        });
        // Crea un índice para el campo "dateTime"
        store.createIndex("dateTime", "dateTime", { unique: false });
      }
    };

    // Evento que se dispara cuando la base de datos se abre exitosamente
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    // Evento que se dispara si hay un error al abrir la base de datos
    request.onerror = (event) => {
      reject("Error al abrir la base de datos: " + event.target.errorCode);
    };
  });
}

/**
 * Añade una nueva dieta a la base de datos.
 * @param {Object} diet - Objeto que representa la dieta a añadir.
 * @returns {Promise<number>} Promesa que resuelve con la "id" generada para la nueva dieta.
 */
export function addDiet(diet) {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo lectura-escritura
        const tx = db.transaction([DB_STORE_NAME], "readwrite");
        const store = tx.objectStore(DB_STORE_NAME);
        // Añade el objeto dieta a la tienda de objetos
        const req = store.add(diet);
        req.onsuccess = (evt) => {
          resolve(evt.target.result); // Retorna la clave auto-incrementada generada
        };
        req.onerror = () => {
          reject("Error al añadir la dieta.");
        };
      })
      .catch(reject);
  });
}

/**
 * Actualiza una dieta existente en la base de datos.
 * @param {Object} diet - Objeto que representa la dieta a actualizar. Debe incluir la propiedad "id".
 * @returns {Promise<void>} Promesa que se resuelve cuando la actualización es exitosa.
 */
export function updateDiet(diet) {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo lectura-escritura
        const tx = db.transaction([DB_STORE_NAME], "readwrite");
        const store = tx.objectStore(DB_STORE_NAME);
        // Actualiza el objeto dieta en la tienda de objetos
        const req = store.put(diet);
        req.onsuccess = () => {
          resolve();
        };
        req.onerror = () => {
          reject("Error al actualizar la dieta.");
        };
      })
      .catch(reject);
  });
}

/**
 * Obtiene todas las dietas almacenadas en la base de datos.
 * @returns {Promise<Array>} Promesa que resuelve con un array de todas las dietas.
 */
export function getAllDiets() {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo de solo lectura
        const tx = db.transaction([DB_STORE_NAME], "readonly");
        const store = tx.objectStore(DB_STORE_NAME);
        // Obtiene todos los objetos de la tienda de objetos
        const req = store.getAll();
        req.onsuccess = (evt) => {
          resolve(evt.target.result);
        };
        req.onerror = () => {
          reject("Error al recuperar las dietas.");
        };
      })
      .catch(reject);
  });
}

/**
 * Retorna la dieta con la clave (id) especificada.
 * @param {number} id - Identificador único de la dieta.
 * @returns {Promise<Object>} Promesa que resuelve con el objeto dieta correspondiente al id.
 */
export function getDiet(id) {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo de solo lectura
        const tx = db.transaction([DB_STORE_NAME], "readonly");
        const store = tx.objectStore(DB_STORE_NAME);
        // Obtiene el objeto dieta con el id especificado
        const req = store.get(id);
        req.onsuccess = (evt) => {
          resolve(evt.target.result);
        };
        req.onerror = () => {
          reject("Error al recuperar la dieta.");
        };
      })
      .catch(reject);
  });
}

/**
 * Elimina una dieta de la base de datos por su id.
 * @param {number} id - Identificador único de la dieta a eliminar.
 * @returns {Promise<void>} Promesa que se resuelve cuando la eliminación es exitosa.
 */
export function deleteDietById(id) {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo lectura-escritura
        const tx = db.transaction([DB_STORE_NAME], "readwrite");
        const store = tx.objectStore(DB_STORE_NAME);
        // Elimina el objeto dieta con el id especificado
        const req = store.delete(id);
        req.onsuccess = () => {
          resolve();
        };
        req.onerror = () => {
          reject("Error al eliminar la dieta.");
        };
      })
      .catch(reject);
  });
}

/**
 * Elimina todas las dietas de la base de datos.
 * @returns {Promise<void>} Promesa que se resuelve cuando se han eliminado todas las dietas.
 */
export function clearAllDiets() {
  return new Promise((resolve, reject) => {
    // Abre la base de datos
    openDatabase()
      .then((db) => {
        // Inicia una transacción en modo lectura-escritura
        const tx = db.transaction([DB_STORE_NAME], "readwrite");
        const store = tx.objectStore(DB_STORE_NAME);
        // Limpia todos los objetos de la tienda de objetos
        const req = store.clear();
        req.onsuccess = () => {
          resolve();
        };
        req.onerror = () => {
          reject("Error al borrar las dietas.");
        };
      })
      .catch(reject);
  });
}
