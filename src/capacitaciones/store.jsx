import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CURSOS, curso as getCurso, NOTA_MIN, INTENTOS_MAX, totalPreguntas, durSeg } from './data.js';
import { cargarAcceso, accesosDe } from '../acceso/db.jsx';

const KEY = 'dmz-cap-v1';
const DIA = 86400000;

export const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const addDias = (n, base = hoy()) => new Date(base.getTime() + n * DIA).toISOString().slice(0, 10);
export const addMeses = (iso, m) => { const d = new Date(iso + 'T00:00:00'); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); };
export const diasHasta = (iso) => Math.round((new Date(iso + 'T00:00:00') - hoy()) / DIA);
export const fFecha = (iso, op) => {
  const d = new Date(iso + 'T00:00:00');
  const o = op || (d.getFullYear() === new Date().getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('es-PE', o);
};
export const fLarga = (iso) => fFecha(iso, { day: 'numeric', month: 'long', year: 'numeric' });

// Quién lleva cursos: participantes y supervisores con acceso a Capacitaciones
export function participantes(acc) {
  return acc.trabajadores.filter((t) => { const a = accesosDe(acc, t); return a.cap === 'participante' || a.cap === 'supervisor'; });
}

function rnd(seedStr) {
  let s = [...seedStr].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 233280, 7);
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

const COMENTARIOS = [
  'Los videos fueron claros y los ejemplos de planta ayudan mucho.',
  'Buen curso, me gustaría más casos reales de las unidades.',
  'Las preguntas al final de cada video ayudan a no distraerse.',
  'Muy útil para las paradas de planta, lo recomiendo.',
  'Algunos videos son largos, pero el contenido es bueno.',
];

function progresoAprobado(c, r, fecha) {
  const mod = {};
  let correctas = 0;
  c.modulos.forEach((m) => {
    const resp = m.preguntas.map((p) => {
      const bien = r() < 0.9;
      if (bien) correctas++;
      return bien ? p.ok : (p.ok + 1) % p.ops.length;
    });
    mod[m.id] = { pos: durSeg(m), visto: true, resp };
  });
  const total = totalPreguntas(c);
  if (Math.round((correctas / total) * 20) < NOTA_MIN) {
    // asegurar aprobado
    c.modulos.forEach((m) => { mod[m.id].resp = m.preguntas.map((p) => p.ok); });
    correctas = total;
  }
  const nota = Math.round((correctas / total) * 20);
  return {
    mod,
    encuesta: { estrellas: 3 + Math.floor(r() * 3), texto: COMENTARIOS[Math.floor(r() * COMENTARIOS.length)], fecha },
    intentos: [{ nota, correctas, total, fecha }],
    aprobado: true, cerrado: true,
    cert: { codigo: `DMZ-${c.codigo}-${fecha.slice(0, 4)}-${String(Math.floor(r() * 90000) + 10000)}`, fecha, vence: addMeses(fecha, c.vigencia) },
  };
}

function progresoParcial(c, r, nMods) {
  const mod = {};
  c.modulos.slice(0, nMods).forEach((m) => { mod[m.id] = { pos: durSeg(m), visto: true, resp: m.preguntas.map((p) => (r() < 0.85 ? p.ok : (p.ok + 1) % 3)) }; });
  const sig = c.modulos[nMods];
  if (sig && r() < 0.6) mod[sig.id] = { pos: Math.floor(durSeg(sig) * (0.2 + r() * 0.5)), visto: false, resp: null };
  return { mod, encuesta: null, intentos: [], aprobado: false, cert: null };
}

export function seedCap() {
  const acc = cargarAcceso();
  const asignaciones = [
    { id: 'a-ind', cursoId: 'ind', areas: getCurso('ind').areas, inicio: addDias(-200), cierre: addDias(-170), por: 'Andrea Salas Vega' },
    { id: 'a-loto', cursoId: 'loto', areas: getCurso('loto').areas, inicio: addDias(-365), cierre: addDias(-340), por: 'Andrea Salas Vega' },
    { id: 'a-pa', cursoId: 'pa', areas: getCurso('pa').areas, inicio: addDias(-125), cierre: addDias(-100), por: 'Andrea Salas Vega' },
    { id: 'a-ec', cursoId: 'ec', areas: getCurso('ec').areas, inicio: addDias(-70), cierre: addDias(-40), por: 'Andrea Salas Vega' },
    { id: 'a-ta', cursoId: 'ta', areas: getCurso('ta').areas, inicio: addDias(-20), cierre: addDias(15), por: 'Andrea Salas Vega' },
    { id: 'a-sq', cursoId: 'sq', areas: getCurso('sq').areas, inicio: addDias(-3), cierre: addDias(35), por: 'Carlos Mendoza Ríos' },
  ];
  const progreso = {};
  for (const t of participantes(acc)) {
    const r = rnd(t.dni);
    const p = {};
    for (const a of asignaciones) {
      if (!a.areas.includes(t.area)) continue;
      const c = getCurso(a.cursoId);
      const pasado = diasHasta(a.cierre) < 0;
      const x = r();
      const fecha = addDias(Math.floor(r() * (diasHasta(a.cierre) - diasHasta(a.inicio))) + diasHasta(a.inicio));
      if (pasado ? x < 0.86 : a.cursoId === 'ta' ? x < 0.3 : x < 0.05) p[a.cursoId] = progresoAprobado(c, r, fecha > addDias(0) ? addDias(-1) : fecha);
      else if (pasado ? x < 0.95 : a.cursoId === 'ta' ? x < 0.75 : x < 0.3) p[a.cursoId] = progresoParcial(c, r, Math.floor(r() * c.modulos.length));
    }
    progreso[t.dni] = p;
  }
  // Trabajador de las maquetas: 4 de 6 aprobados, Trabajo en Altura en el módulo 2, Sustancias Químicas sin empezar
  const r = rnd('jr');
  const ta = getCurso('ta');
  progreso['45872103'] = {
    ind: progresoAprobado(getCurso('ind'), r, addDias(-180)),
    loto: progresoAprobado(getCurso('loto'), r, addDias(-343)),
    pa: progresoAprobado(getCurso('pa'), r, addDias(-6)),
    ec: progresoAprobado(getCurso('ec'), r, addDias(-45)),
    ta: { mod: { m1: { pos: durSeg(ta.modulos[0]), visto: true, resp: [1, 0, 1] }, m2: { pos: 460, visto: false, resp: null } }, encuesta: null, intentos: [], aprobado: false, cert: null },
  };
  progreso['45872103'].loto.cert.vence = addDias(22);
  progreso['45872103'].pa.cert.fecha = addDias(-6);
  return {
    version: 1,
    asignaciones,
    progreso,
    recordatorios: [
      { id: 'r1', cursoId: 'ta', fecha: addDias(6), texto: 'Recordatorio: Trabajo en Altura', a: 'Personas con avance menor a 50 %', area: 'Mantenimiento' },
    ],
    leidos: {},
    extras: {},
  };
}

export function cargarCap() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* sin almacenamiento */ }
  return seedCap();
}

// ---------- Estado de un curso para una persona ----------
export function estadoCurso(db, dni, a) {
  const c = getCurso(a.cursoId);
  const p = db.progreso[dni]?.[a.cursoId] || { mod: {}, encuesta: null, intentos: [], aprobado: false, cert: null };
  const completos = c.modulos.filter((m) => p.mod[m.id]?.visto && p.mod[m.id]?.resp).length;
  const iniciado = Object.keys(p.mod).length > 0;
  const maxIntentos = INTENTOS_MAX + (db.extras?.[`${dni}:${c.id}`] || 0);
  const ultimo = p.intentos[p.intentos.length - 1];
  let estado = 'Sin empezar';
  if (p.aprobado) estado = 'Aprobado';
  else if (p.intentos.length >= maxIntentos) estado = 'No aprobado';
  else if (diasHasta(a.cierre) < 0) estado = 'Vencido';
  else if (iniciado) estado = 'En curso';
  const avance = p.aprobado ? 100 : Math.round((completos / c.modulos.length) * 100);
  const actual = c.modulos.find((m) => !(p.mod[m.id]?.visto && p.mod[m.id]?.resp));
  return { c, a, p, completos, avance, estado, actual, ultimo, maxIntentos, dias: diasHasta(a.cierre) };
}

export function cursosDe(db, persona) {
  return db.asignaciones
    .filter((a) => a.areas.includes(persona.area))
    .map((a) => estadoCurso(db, persona.dni, a))
    .sort((x, y) => (x.p.aprobado - y.p.aprobado) || x.a.cierre.localeCompare(y.a.cierre));
}

export function correctasDe(c, p) {
  let ok = 0;
  const porModulo = c.modulos.map((m) => {
    const r = p.mod[m.id]?.resp || [];
    const n = m.preguntas.filter((q, i) => r[i] === q.ok).length;
    ok += n;
    return { m, n, total: m.preguntas.length };
  });
  return { ok, total: totalPreguntas(c), porModulo, nota: Math.round((ok / totalPreguntas(c)) * 20) };
}

// Cierra un intento cuando todos los módulos tienen respuestas y la encuesta está hecha
function intentarCerrar(c, p) {
  const todos = c.modulos.every((m) => p.mod[m.id]?.visto && p.mod[m.id]?.resp);
  if (!todos || !p.encuesta || p.aprobado || p.cerrado) return;
  const r = correctasDe(c, p);
  p.intentos.push({ nota: r.nota, correctas: r.ok, total: r.total, fecha: addDias(0) });
  if (r.nota >= NOTA_MIN) p.aprobado = true;
  p.cerrado = true;
}

// ---------- Contexto ----------
const Ctx = createContext(null);

export function CapProvider({ persona, rol, children }) {
  const [db, setDb] = useState(cargarCap);
  const [acc] = useState(cargarAcceso);
  const [toast, setToast] = useState(null);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ } }, [db]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); }, [toast]);
  const update = useCallback((fn) => setDb((d) => { const n = structuredClone(d); fn(n); return n; }), []);

  const prog = (d, dni, cid) => {
    d.progreso[dni] = d.progreso[dni] || {};
    d.progreso[dni][cid] = d.progreso[dni][cid] || { mod: {}, encuesta: null, intentos: [], aprobado: false, cert: null };
    return d.progreso[dni][cid];
  };
  const acciones = {
    guardarPos: (cid, mid, pos, visto) => update((d) => {
      const p = prog(d, persona.dni, cid);
      const m = p.mod[mid] || { pos: 0, visto: false, resp: null };
      m.pos = Math.max(m.pos, pos); if (visto) m.visto = true;
      p.mod[mid] = m;
    }),
    responder: (cid, mid, resp) => update((d) => {
      const c = getCurso(cid); const p = prog(d, persona.dni, cid);
      p.mod[mid] = { ...(p.mod[mid] || {}), visto: true, resp };
      intentarCerrar(c, p);
    }),
    encuesta: (cid, estrellas, texto) => update((d) => {
      const c = getCurso(cid); const p = prog(d, persona.dni, cid);
      p.encuesta = { estrellas, texto, fecha: addDias(0) };
      intentarCerrar(c, p);
    }),
    reintentar: (cid) => update((d) => {
      const c = getCurso(cid); const p = prog(d, persona.dni, cid);
      const r = correctasDe(c, p);
      r.porModulo.forEach((x) => { if (x.n < x.total) p.mod[x.m.id].resp = null; });
      p.cerrado = false;
    }),
    emitir: (cid) => update((d) => {
      const c = getCurso(cid); const p = prog(d, persona.dni, cid);
      if (!p.cert) p.cert = { codigo: `DMZ-${c.codigo}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`, fecha: addDias(0), vence: addMeses(addDias(0), c.vigencia) };
    }),
    leer: (ids) => update((d) => { d.leidos[persona.dni] = [...new Set([...(d.leidos[persona.dni] || []), ...ids])]; }),
  };
  const reset = () => { setDb(seedCap()); setToast('Datos de capacitaciones restablecidos'); };
  return <Ctx.Provider value={{ db, acc, update, persona, rol, acciones, toast, notify: setToast, reset }}>{children}</Ctx.Provider>;
}
export const useCap = () => useContext(Ctx);

// Avisos del trabajador (se calculan a partir de su avance)
export function avisosDe(db, persona) {
  const out = [];
  for (const x of cursosDe(db, persona)) {
    if (!x.p.aprobado && x.dias >= 0 && x.dias <= 20) out.push({ id: `cierre-${x.a.id}`, tipo: 'Cursos', tono: 'warn', titulo: `${x.c.nombre} cierra en ${x.dias} días`, det: `Te faltan ${x.c.modulos.length - x.completos} módulos · vence ${fFecha(x.a.cierre)}`, accion: 'Continuar curso', to: `/curso/${x.c.id}`, fecha: x.a.cierre, atencion: true });
    if (x.p.cert && diasHasta(x.p.cert.vence) <= 30 && diasHasta(x.p.cert.vence) >= 0) out.push({ id: `vence-${x.c.id}-${x.p.cert.vence}`, tipo: 'Certificados', tono: 'bad', titulo: `Tu certificado de ${x.c.nombre} vence en ${diasHasta(x.p.cert.vence)} días`, det: `${fFecha(x.p.cert.vence)} · tu supervisor ya fue avisado`, accion: 'Ver certificado', to: `/certificado/${x.c.id}`, fecha: x.p.cert.vence, atencion: true });
    if (!x.p.aprobado && diasHasta(x.a.inicio) >= -14) out.push({ id: `asig-${x.a.id}`, tipo: 'Cursos', tono: 'info', titulo: `Te asignaron ${x.c.nombre}`, det: `${fFecha(x.a.inicio)} · por ${x.a.por} · vence ${fFecha(x.a.cierre)}`, accion: 'Empezar curso', to: `/curso/${x.c.id}`, fecha: x.a.inicio });
    if (x.p.cert && diasHasta(x.p.cert.fecha) >= -30) out.push({ id: `cert-${x.c.id}-${x.p.cert.fecha}`, tipo: 'Certificados', tono: 'ok', titulo: `Tu certificado de ${x.c.nombre} está listo`, det: fFecha(x.p.cert.fecha, { day: 'numeric', month: 'short', year: 'numeric' }), accion: 'Descargar', to: `/certificado/${x.c.id}`, fecha: x.p.cert.fecha });
  }
  const leidos = db.leidos[persona.dni] || [];
  return out.map((a) => ({ ...a, leido: leidos.includes(a.id) }));
}

export { CURSOS };
