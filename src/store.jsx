import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed, ROLES, FLUJO_FIRMAS } from './data/seed.js';

const KEY = 'ssoma-dmz-demo-v2';
const KEY_USER = 'ssoma-dmz-user';
const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) return parsed;
    }
  } catch { /* sin almacenamiento */ }
  return buildSeed();
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load);
  const [userId, setUserIdState] = useState(() => {
    try { return localStorage.getItem(KEY_USER); } catch { return null; }
  });
  const [unidadFiltro, setUnidadFiltro] = useState('todas');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
  }, [db]);

  const setUserId = (id) => {
    setUserIdState(id);
    setUnidadFiltro('todas');
    try { id ? localStorage.setItem(KEY_USER, id) : localStorage.removeItem(KEY_USER); } catch { /* ignore */ }
  };

  const user = db.usuarios.find((u) => u.id === userId) || null;

  const value = useMemo(() => {
    const update = (fn, mensaje) => {
      setDb((prev) => {
        const next = structuredClone(prev);
        fn(next);
        if (mensaje && user) {
          next.bitacora.unshift({ fecha: new Date().toISOString(), userId: user.id, accion: mensaje });
          next.bitacora = next.bitacora.slice(0, 200);
        }
        return next;
      });
      if (mensaje) notify(mensaje);
    };
    const notify = (msg) => {
      setToast(msg);
      clearTimeout(window.__toastT);
      window.__toastT = setTimeout(() => setToast(null), 2800);
    };
    const reset = () => {
      setDb(buildSeed());
      notify('Datos de demo restablecidos');
    };
    const todas = user ? ROLES[user.rol].todas : false;
    const scopeUnits = !user ? [] : todas ? db.unidades.map((u) => u.id) : [user.unidad];
    const visibleUnits = unidadFiltro === 'todas' ? scopeUnits : scopeUnits.filter((u) => u === unidadFiltro);
    const inScope = (unidad) => visibleUnits.includes(unidad);
    return { db, user, setUserId, update, reset, notify, toast, unidadFiltro, setUnidadFiltro, scopeUnits, visibleUnits, inScope, todas };
  }, [db, user, unidadFiltro, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// ---------- Permisos por acción (matriz rol × módulo) ----------
const PERMS = {
  'parada.crear': ['gerente', 'lider', 'sup_mant'],
  'parada.checklist': ['lider', 'supervisor'],
  'permiso.crear': ['lider', 'supervisor', 'sup_mant', 'trabajador'],
  'iperc.editar': ['lider', 'supervisor', 'analista'],
  'inspeccion.crear': ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'trabajador'],
  'incidente.crear': ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'sup_mant', 'medico', 'trabajador'],
  'incidente.investigar': ['gerente', 'lider'],
  'plan.crear': ['gerente', 'lider', 'supervisor', 'analista'],
  'plan.cerrar': ['gerente', 'lider'],
  'personal.editar': ['lider', 'asistente'],
  'emo.detalle': ['medico'],
  'capacitacion.crear': ['lider', 'asistente'],
  'epp.crear': ['asistente', 'lider'],
  'reporte.ver': ['gerente', 'lider', 'supervisor', 'asistente', 'analista'],
  'salud.editar': ['medico'],
  'salud.ver': ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'medico'],
  'ambiente.crear': ['lider', 'supervisor', 'asistente', 'analista'],
  'gestion.editar': ['gerente', 'analista', 'lider'],
  'ipercc.crear': ['lider', 'supervisor', 'sup_mant', 'trabajador'],
  'tablero.ver': ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'sup_mant', 'medico'],
};
export const can = (user, accion) => !!user && (PERMS[accion] || []).includes(user.rol);
export const MATRIZ_PERMISOS = PERMS;

export const puedeFirmar = (user, permiso) => {
  if (!user || !['Pendiente firmas', 'Borrador'].includes(permiso.estado)) return false;
  const idx = permiso.firmas.findIndex((f) => !f.userId);
  if (idx < 0) return false;
  // las firmas son en orden: solo puede firmar el rol del siguiente paso
  return permiso.firmas[idx].rol === user.rol;
};
export { FLUJO_FIRMAS };

// ---------- Vencimientos ----------
export const hoy = () => new Date().toISOString().slice(0, 10);
export function estadoFecha(fecha) {
  if (!fecha) return 'vencido';
  const d = (new Date(fecha) - new Date(hoy())) / 86400000;
  if (d < 0) return 'vencido';
  if (d <= 30) return 'por vencer';
  return 'vigente';
}
export function acreditacion(p) {
  const docs = [estadoFecha(p.emoVence), estadoFecha(p.sctrVence), estadoFecha(p.induccionVence)];
  if (p.aptitud === 'No apto' || docs.includes('vencido')) return 'bloqueado';
  if (docs.includes('por vencer')) return 'por vencer';
  return 'habilitado';
}
export function motivosBloqueo(p) {
  const m = [];
  if (estadoFecha(p.emoVence) === 'vencido') m.push('EMO vencido');
  if (estadoFecha(p.sctrVence) === 'vencido') m.push('SCTR vencido');
  if (estadoFecha(p.induccionVence) === 'vencido') m.push('Inducción vencida');
  if (p.aptitud === 'No apto') m.push('No apto');
  return m;
}

// ---------- Indicadores ----------
export function indicadores(db, unidades) {
  const hh = unidades.reduce((s, u) => s + (db.hh[u] || 0), 0);
  const inc = db.incidentes.filter((i) => unidades.includes(i.unidad));
  const incap = inc.filter((i) => i.tipo === 'Accidente incapacitante').length;
  const dias = inc.reduce((s, i) => s + (i.diasPerdidos || 0), 0);
  const IF = hh ? (incap * 1e6) / hh : 0;
  const IS = hh ? (dias * 1e6) / hh : 0;
  return { hh, IF, IS, IA: (IF * IS) / 1000, incidentes: inc.length };
}

// ---------- Repositorio: nivel de acceso efectivo ----------
export const NIVELES = ['ninguno', 'ver', 'subir', 'editar', 'admin'];
export const rank = (n) => NIVELES.indexOf(n);

export function nivelCarpeta(db, user, folderId) {
  if (!user) return 'ninguno';
  const byId = Object.fromEntries(db.carpetas.map((c) => [c.id, c]));
  // ¿Restricción de unidad en la cadena?
  let cur = byId[folderId];
  const todas = ROLES[user.rol].todas;
  while (cur) {
    if (cur.unidad && !todas && cur.unidad !== user.unidad) return 'ninguno';
    cur = byId[cur.parentId];
  }
  // Excepción por persona o regla por rol, del más cercano hacia arriba
  cur = byId[folderId];
  while (cur) {
    if (cur.usuarios && cur.usuarios[user.id]) return cur.usuarios[user.id];
    if (cur.acl && cur.acl[user.rol]) return cur.acl[user.rol];
    cur = byId[cur.parentId];
  }
  return 'ninguno';
}

export function rutaCarpeta(db, folderId) {
  const byId = Object.fromEntries(db.carpetas.map((c) => [c.id, c]));
  const path = [];
  let cur = byId[folderId];
  while (cur) { path.unshift(cur); cur = byId[cur.parentId]; }
  return path;
}

export const nombreUsuario = (db, id) => db.usuarios.find((u) => u.id === id)?.nombre || '—';
export const nombreUnidad = (db, id) => db.unidades.find((u) => u.id === id)?.nombre || id;
export const nombrePersonal = (db, id) => db.personal.find((p) => p.id === id)?.nombre || id;
export const fmtFecha = (f) => {
  if (!f) return '—';
  const [y, m, d] = f.slice(0, 10).split('-');
  return `${d}/${m}/${y}${f.length > 10 ? ' ' + f.slice(11, 16) : ''}`;
};
export const nextId = (lista, prefijo) => {
  const nums = lista.map((x) => parseInt(String(x.id).replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefijo}-${String(n).padStart(4, '0')}`;
};
