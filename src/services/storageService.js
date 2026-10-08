/**
 * storageService.js
 * Offline-first persistence. IndexedDB is the primary store (large lectures,
 * diagrams as data URLs); localStorage is a transparent fallback.
 * Every write is local first, so a dropped connection never loses a session.
 */

const DB_NAME = 'minhaj-dental-study';
const DB_VERSION = 1;
export const STORES = { lectures: 'lectures', edits: 'edits', kv: 'kv' };
const KEY_PATHS = { lectures: 'id', edits: 'lectureId', kv: 'key' };

let dbPromise = null;

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, keyPath] of Object.entries(KEY_PATHS)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null); // private mode etc. → fallback
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/* ---------------- localStorage fallback ---------------- */
const lsKey = (store) => `dsp.store.${store}`;
function lsAll(store) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(store)) || '{}');
  } catch {
    return {};
  }
}
function lsWrite(store, data) {
  try {
    localStorage.setItem(lsKey(store), JSON.stringify(data));
  } catch (e) {
    console.warn('[storage] localStorage write failed', e);
  }
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function put(store, value) {
  const db = await openDb();
  if (db) return tx(db, store, 'readwrite', (s) => s.put(value));
  const all = lsAll(store);
  all[value[KEY_PATHS[store]]] = value;
  lsWrite(store, all);
  return value;
}

export async function get(store, key) {
  const db = await openDb();
  if (db) return tx(db, store, 'readonly', (s) => s.get(key));
  return lsAll(store)[key];
}

export async function getAll(store) {
  const db = await openDb();
  if (db) return (await tx(db, store, 'readonly', (s) => s.getAll())) || [];
  return Object.values(lsAll(store));
}

export async function remove(store, key) {
  const db = await openDb();
  if (db) return tx(db, store, 'readwrite', (s) => s.delete(key));
  const all = lsAll(store);
  delete all[key];
  lsWrite(store, all);
}

/* ---------------- Key/value helpers ---------------- */
export async function getSetting(key, fallback = null) {
  const rec = await get(STORES.kv, key);
  return rec ? rec.value : fallback;
}
export async function setSetting(key, value) {
  return put(STORES.kv, { key, value });
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}

/* ---------------- Backup / sync hooks ---------------- */
/**
 * Full portable backup. This is the sync seam: a cloud adapter only needs to
 * upload this JSON and call importBackup() on another device.
 */
export async function exportBackup() {
  const [lectures, edits, kv] = await Promise.all([getAll(STORES.lectures), getAll(STORES.edits), getAll(STORES.kv)]);
  const local = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('dsp.') && !k.startsWith('dsp.store.')) local[k] = localStorage.getItem(k);
  }
  return { app: 'minhaj-dental-study', version: 1, exportedAt: new Date().toISOString(), lectures, edits, kv, local };
}

export async function importBackup(data) {
  if (!data || data.app !== 'minhaj-dental-study') throw new Error('ملف النسخة الاحتياطية غير صالح');
  for (const l of data.lectures || []) await put(STORES.lectures, l);
  for (const e of data.edits || []) await put(STORES.edits, e);
  for (const k of data.kv || []) await put(STORES.kv, k);
  for (const [k, v] of Object.entries(data.local || {})) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  }
}
