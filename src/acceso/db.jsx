import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { seedAcceso } from './seed.js';

// Control de accesos compartido por el portal, el panel de administración,
// Capacitaciones y SSOMA DMZ. En la demo vive en el navegador (localStorage);
// en producción será una API con base de datos.
const KEY = 'dmz-acceso-v2';
// Cada módulo tiene su propio ingreso y su propia sesión:
//   Capacitaciones -> DNI + PIN          SSOMA DMZ y Administración -> correo + contraseña
const KEY_SESION = { cap: 'dmz-sesion-cap', ssoma: 'dmz-sesion-ssoma', admin: 'dmz-sesion-admin' };

export function cargarAcceso() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* sin almacenamiento */ }
  return seedAcceso();
}
export function guardarAcceso(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ }
}

export function getSesion(mod) {
  try { return localStorage.getItem(KEY_SESION[mod]); } catch { return null; }
}
export function setSesion(mod, dni) {
  try { dni ? localStorage.setItem(KEY_SESION[mod], dni) : localStorage.removeItem(KEY_SESION[mod]); } catch { /* sin almacenamiento */ }
}

const RANGO = { participante: 1, supervisor: 2, admin: 3 };

// Suma de permisos de todos los grupos de la persona
export function accesosDe(db, persona) {
  const res = { cap: null, ssoma: false, admin: false };
  if (!persona || !persona.activo) return res;
  for (const gid of persona.grupos || []) {
    const g = db.grupos.find((x) => x.id === gid);
    if (!g) continue;
    const p = g.permisos;
    if (p.cap && (!res.cap || RANGO[p.cap] > RANGO[res.cap])) res.cap = p.cap;
    if (p.ssoma) res.ssoma = true;
    if (p.admin) res.admin = true;
  }
  return res;
}

export const CAP_ROL = { participante: 'Participante', supervisor: 'Supervisor', admin: 'Administrador' };

// Sesión de un módulo, leída al cargar la página
export function sesionModulo(mod) {
  const db = cargarAcceso();
  const dni = getSesion(mod);
  const persona = db.trabajadores.find((t) => t.dni === dni && t.activo) || null;
  return { db, persona, accesos: accesosDe(db, persona) };
}

export function cerrarSesion(mod) {
  setSesion(mod, null);
  window.location.href = mod === 'cap' ? '/capacitaciones' : mod === 'ssoma' ? '/ssoma' : '/admin';
}

// Perfiles de SSOMA DMZ que se pueden asignar (en la demo, cada uno corresponde a un usuario de prueba del módulo)
export const SSOMA_PERFILES = [
  { id: 'u1', label: 'Gerente de Seguridad · todas las unidades' },
  { id: 'u6', label: 'Analista HSE · todas las unidades' },
  { id: 'u2', label: 'Líder HSE · U.M. Cerro Azul' },
  { id: 'u3', label: 'Líder HSE · U.M. Pampa Roja' },
  { id: 'u4', label: 'Supervisor HSE · U.M. Cerro Azul' },
  { id: 'u5', label: 'Asistente HSE · U.M. Cerro Azul' },
  { id: 'u7', label: 'Supervisor de mantenimiento · U.M. Cerro Azul' },
  { id: 'u8', label: 'Médico ocupacional · todas las unidades' },
  { id: 'u9', label: 'Trabajador · U.M. Cerro Azul' },
];
export const perfilSsoma = (id) => SSOMA_PERFILES.find((p) => p.id === id)?.label || 'Trabajador';

export function passAleatoria() {
  return `Dmz-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ---------- Contexto para el panel de administración ----------
const Ctx = createContext(null);

export function AccesoProvider({ children }) {
  const [db, setDb] = useState(cargarAcceso);
  const [toast, setToast] = useState(null);
  useEffect(() => { guardarAcceso(db); }, [db]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  const update = useCallback((fn) => setDb((d) => fn(structuredClone(d)) || d), []);
  const reset = () => { setDb(seedAcceso()); setToast('Datos de accesos restablecidos'); };
  return <Ctx.Provider value={{ db, update, reset, toast, notify: setToast }}>{children}</Ctx.Provider>;
}
export const useAcceso = () => useContext(Ctx);

export function iniciales(nombre) {
  return nombre.split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
}

export function pinAleatorio() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
