// Cálculos del SGSST: estado de hallazgos, cumplimiento de programas, indicadores de seguridad.
import { CLASES_EVENTO, MESES } from '../data/seed3.js';

export const hoyIso = () => new Date().toISOString().slice(0, 10);
const DIA = 86400000;
export const diasEntre = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / DIA);
export const mesDe = (iso) => Number(iso.slice(5, 7)) - 1;
export const anioDe = (iso) => Number(iso.slice(0, 4));

// ---------- Hallazgos de inspección ----------
// Estados igual que en el archivo de análisis: cerrado, en proceso, abierto dentro / fuera del plazo
export const ESTADOS_HZ = ['Cerrado', 'En proceso', 'Abierto dentro del plazo', 'Abierto fuera del plazo'];
export function estadoHallazgo(h, hoy = hoyIso()) {
  if (h.fechaCierre || h.avance >= 100) return 'Cerrado';
  if (h.plazo < hoy) return 'Abierto fuera del plazo';
  if (h.avance > 0) return 'En proceso';
  return 'Abierto dentro del plazo';
}
export const diasRetraso = (h, hoy = hoyIso()) => (estadoHallazgo(h, hoy) === 'Abierto fuera del plazo' ? diasEntre(h.plazo, hoy) : 0);
export function rangoAntiguedad(h, hoy = hoyIso()) {
  const d = diasEntre(h.fecha, h.fechaCierre || hoy);
  return d <= 30 ? '0-30 días' : d <= 60 ? '31-60 días' : '>60 días';
}
// Patrón recurrente: el mismo tipo de hallazgo, en la misma sede, 3 o más veces en el año
export function recurrencias(hallazgos) {
  const c = {};
  hallazgos.forEach((h) => { const k = `${h.sede}|${h.subtipo}`; c[k] = (c[k] || 0) + 1; });
  return (h) => (c[`${h.sede}|${h.subtipo}`] || 0) >= 3;
}
export const TONO_HZ = { Cerrado: 'ok', 'En proceso': 'info', 'Abierto dentro del plazo': 'warn', 'Abierto fuera del plazo': 'bad' };

export function kpisHallazgos(lista, hoy = hoyIso()) {
  const est = (e) => lista.filter((h) => estadoHallazgo(h, hoy) === e).length;
  const rec = recurrencias(lista);
  const total = lista.length || 1;
  const abiertos = lista.filter((h) => estadoHallazgo(h, hoy) !== 'Cerrado');
  return {
    total: lista.length,
    cerrados: est('Cerrado'), enProceso: est('En proceso'), dentro: est('Abierto dentro del plazo'), fuera: est('Abierto fuera del plazo'),
    pctCerrados: est('Cerrado') / total, pctFuera: est('Abierto fuera del plazo') / total,
    altoAbiertos: abiertos.filter((h) => h.riesgo === 'Alto').length,
    altoSinPlan: abiertos.filter((h) => h.riesgo === 'Alto' && !h.accion?.trim()).length,
    recurrentes: lista.filter(rec).length,
    actos: lista.filter((h) => h.clasificacion === 'Acto').length,
    condiciones: lista.filter((h) => h.clasificacion === 'Condición').length,
  };
}

// ---------- Valoración del cumplimiento (criterios del indicador I03) ----------
export const VALORACIONES = [
  { min: 95, nombre: 'Excelente', desc: 'El desempeño es con eficiencia', tono: 'ok' },
  { min: 85, nombre: 'Bueno', desc: 'El desempeño es normal', tono: 'ok' },
  { min: 70, nombre: 'Regular', desc: 'El desempeño presenta dificultades', tono: 'warn' },
  { min: 50, nombre: 'Bajo', desc: 'Resolverá el desempeño con ayuda externa', tono: 'bad' },
  { min: 0, nombre: 'Deficiente', desc: 'No es capaz de resolver la dificultad', tono: 'bad' },
];
export const valoracion = (pct) => VALORACIONES.find((v) => pct >= v.min) || VALORACIONES[4];

// ---------- Programa anual de inspecciones ----------
// Cuenta programadas y ejecutadas (las ejecutadas sin programar también suman, como en el archivo)
export function cumplimientoPrograma(programa, { sedes, meses }) {
  let prog = 0; let ejec = 0;
  programa.actividades.forEach((a) => a.sedes.forEach((s) => {
    if (sedes && !sedes.includes(s)) return;
    meses.forEach((m) => { if (a.plan[s][m]) prog++; if (a.ejec[s][m]) ejec++; });
  }));
  return { prog, ejec, pct: prog ? (ejec / prog) * 100 : 0 };
}
export const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---------- Eventos e indicadores de seguridad ----------
export const clase = (id) => CLASES_EVENTO.find((c) => c.id === id) || CLASES_EVENTO[8];
// IF e IG con base 1 000 000 HHT (DS 024-2016-EM); LTIR y TRIR con base 200 000 HHT (OSHA)
export function indicadores(db, { sedes, meses, anio }) {
  const ev = db.incidentes.filter((e) => anioDe(e.fecha) === anio && meses.includes(mesDe(e.fecha)) && sedes.includes(e.unidad));
  const n = (ids) => ev.filter((e) => ids.includes(e.clase)).length;
  const hht = sedes.reduce((s, x) => s + meses.reduce((t, m) => t + (db.estadisticas.hht[x]?.[m] || 0), 0), 0);
  const lti = n(['LTI']); const fat = n(['FAT']);
  const registrables = n(['FAT', 'LTI', 'WRC', 'MTC']);
  const dias = ev.reduce((s, e) => s + (e.diasPerdidos || 0), 0);
  const IF = hht ? ((lti + fat) * 1e6) / hht : 0;
  const IG = hht ? (dias * 1e6) / hht : 0;
  return {
    eventos: ev, hht, lti, fat, wrc: n(['WRC']), mtc: n(['MTC']), fac: n(['FAC']), registrables, dias,
    IF, IG, IA: (IF * IG) / 1000,
    LTIR: hht ? (lti * 2e5) / hht : 0,
    TRIR: hht ? (registrables * 2e5) / hht : 0,
  };
}
export function trabajadoresMes(db, sedes, m) {
  return sedes.reduce((s, x) => s + (db.estadisticas.trabajadores[x]?.[m] || 0), 0);
}
export function diasSinLti(db, sedes, hoy = hoyIso()) {
  const ltis = db.incidentes.filter((e) => ['LTI', 'FAT'].includes(e.clase) && sedes.includes(e.unidad)).map((e) => e.fecha).sort();
  const ult = ltis[ltis.length - 1];
  return ult ? diasEntre(ult, hoy) : null;
}
// Último mes con horas hombre cargadas (el mes que se reporta)
export function ultimoMesCerrado(db) {
  let m = -1;
  Object.values(db.estadisticas.hht).forEach((arr) => arr.forEach((v, i) => { if (v != null && i > m) m = i; }));
  return Math.max(m, 0);
}

// ---------- No conformidades / SAC ----------
export function estadoNc(nc, hoy = hoyIso()) {
  if (nc.acciones.length && nc.acciones.every((a) => a.cierre)) return 'Cerrado';
  if (nc.acciones.some((a) => !a.cierre && a.plazo < hoy)) return 'Vencido';
  return 'En proceso';
}
export const estadoAccion = (a, hoy = hoyIso()) => (a.cierre ? 'Cerrado' : a.plazo < hoy ? 'Vencido' : a.avance > 0 ? 'En proceso' : 'Pendiente');
export const atrasoAccion = (a, hoy = hoyIso()) => (a.cierre ? Math.max(0, diasEntre(a.plazo, a.cierre)) : a.plazo < hoy ? diasEntre(a.plazo, hoy) : 0);

// ---------- Planes de acción de investigaciones ----------
export function planesInvestigacion(db, sedes, hoy = hoyIso()) {
  const pl = db.planes.filter((p) => String(p.origen).startsWith('INC-') && sedes.includes(p.unidad));
  const estado = (p) => (p.estado === 'Cerrado' ? 'Cerrado' : p.vence < hoy ? 'Abierto fuera de fecha' : 'En proceso');
  return pl.map((p) => ({ ...p, estadoSeg: estado(p), retraso: estado(p) === 'Abierto fuera de fecha' ? diasEntre(p.vence, hoy) : 0 }));
}

export const pct = (v, d = 1) => `${(v || 0).toFixed(d)}%`;
export const fmtN = (v, d = 2) => (v || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
export { MESES };
