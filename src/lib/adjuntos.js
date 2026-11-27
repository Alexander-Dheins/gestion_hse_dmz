import { nivelCarpeta, rank, rutaCarpeta } from '../store.jsx';
import { guardarBlob } from './blobs.js';

// Secciones del sistema que guardan sus archivos en el repositorio.
// El administrador asocia cada sección a una carpeta; sin carpeta asociada no se puede subir.
export const SECCIONES = {
  hallazgos: { nombre: 'Inspecciones · evidencias de hallazgos', corto: 'Inspecciones', ruta: '/inspecciones' },
  incidentes: { nombre: 'Eventos e incidentes · evidencias', corto: 'Eventos e incidentes', ruta: '/incidentes' },
};
export const MAX_MB = 25;

export const extDe = (nombre) => (nombre.split('.').pop() || '').toLowerCase();
export const esImagen = (nombre) => ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extDe(nombre));
export const esPdf = (nombre) => extDe(nombre) === 'pdf';
export const esVideo = (nombre) => ['mp4', 'webm', 'mov'].includes(extDe(nombre));

export const carpetaDeSeccion = (db, seccion) => {
  const id = db.vinculos?.[seccion];
  return id && db.carpetas.some((c) => c.id === id) ? id : null;
};
export const seccionesDeCarpeta = (db, folderId) => Object.keys(SECCIONES).filter((s) => db.vinculos?.[s] === folderId);
export const rutaTexto = (db, id) => rutaCarpeta(db, id).map((c) => c.nombre).join(' / ');

// ¿Puede este usuario subir archivos en la sección?
export function estadoSubida(db, user, seccion) {
  const carpeta = carpetaDeSeccion(db, seccion);
  const esAdmin = nivelCarpeta(db, user, 'root') === 'admin';
  if (!carpeta) return { ok: false, motivo: 'sin-carpeta', esAdmin };
  const nivel = nivelCarpeta(db, user, carpeta);
  if (rank(nivel) < rank('subir')) return { ok: false, motivo: 'sin-permiso', carpeta, esAdmin };
  return { ok: true, carpeta, esAdmin };
}

export const puedeVer = (db, user, archivo) => !!archivo && rank(nivelCarpeta(db, user, archivo.folderId)) >= rank('ver');

// 1) Guarda el contenido (asíncrono) y devuelve los registros listos para el repositorio
export async function prepararAdjuntos(files, user) {
  const items = [];
  for (const f of files) {
    const id = 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await guardarBlob(id, f);
    items.push({ id, nombre: f.name, kb: Math.max(1, Math.round(f.size / 1024)), tipo: f.type || '', autor: user.id, actualizado: new Date().toISOString().slice(0, 10), version: 1 });
  }
  return items;
}

// 2) Dentro de update(): los ubica en la carpeta de la sección, en una subcarpeta por registro
export function registrarAdjuntos(d, seccion, refId, items) {
  const padre = d.vinculos?.[seccion];
  if (!padre || !items.length) return [];
  let sub = d.carpetas.find((c) => c.parentId === padre && c.nombre === refId);
  if (!sub) {
    sub = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: refId, parentId: padre, acl: null, usuarios: {}, unidad: null };
    d.carpetas.push(sub);
  }
  items.forEach((it) => d.archivos.push({ ...it, folderId: sub.id, origen: { seccion, ref: refId } }));
  return items.map((it) => it.id);
}
