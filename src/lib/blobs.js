// Contenido de los archivos subidos (IndexedDB del navegador; en producción iría a un almacenamiento de objetos)
const DB = 'dmz-archivos';
const ST = 'blobs';
let dbp;
function abrir() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
const tx = async (modo, fn) => {
  const d = await abrir();
  return new Promise((res, rej) => {
    const t = d.transaction(ST, modo);
    const req = fn(t.objectStore(ST));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
};
export const guardarBlob = (id, blob) => tx('readwrite', (s) => s.put(blob, id));
export const leerBlob = (id) => tx('readonly', (s) => s.get(id)).catch(() => null);
export const borrarBlob = (id) => tx('readwrite', (s) => s.delete(id)).catch(() => null);

const urls = new Map();
export async function urlDe(id) {
  if (urls.has(id)) return urls.get(id);
  const b = await leerBlob(id);
  if (!b) return null;
  const u = URL.createObjectURL(b);
  urls.set(id, u);
  return u;
}
export function olvidarUrl(id) {
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
}
