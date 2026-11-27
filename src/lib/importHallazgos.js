// Lectura del archivo «Análisis de inspecciones internas» (formato de DIMARZA) para importar hallazgos.
// Función pura: recibe las filas de la hoja y devuelve hallazgos listos + errores/advertencias por fila.
import { ACTOS, CONDICIONES } from '../data/catalogos.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

const COLUMNAS = {
  fecha: (h) => h === 'FECHA',
  realizadaPor: (h) => h.startsWith('REALIZADA POR'),
  ubicacion: (h) => h === 'UBICACION',
  area: (h) => h.startsWith('UBICACION DETALLADA'),
  descripcion: (h) => h.startsWith('DESCRIPCION DEL HALLAZGO') || h === 'DESCRIPCION',
  riesgo: (h) => h.startsWith('NIVEL DE RIESGO') || h === 'RIESGO',
  accion: (h) => h.startsWith('CONCLUSIONES') || h.startsWith('PLAN DE ACCION'),
  responsable: (h) => h === 'RESPONSABLE',
  plazo: (h) => h.startsWith('FECHA DE PLAZO') || h === 'PLAZO',
  avance: (h) => h.startsWith('% DE AVANCE') || h === 'AVANCE',
  status: (h) => h === 'STATUS' || h === 'ESTADO',
  clasificacion: (h) => h === 'CLASIFICACION',
  subtipo: (h) => h === 'TIPO',
  tipoInspeccion: (h) => h.startsWith('TIPO DE INSPECCION'),
};

export function encontrarHoja(hojas) {
  for (const h of hojas) {
    const i = h.data.findIndex((r) => r.some((c) => norm(c).startsWith('DESCRIPCION DEL HALLAZGO')) && r.some((c) => norm(c).startsWith('NIVEL DE')));
    if (i >= 0) return { hoja: h.sheet, filaCabecera: i, data: h.data };
  }
  return null;
}

// Fechas: acepta celdas de fecha y textos dd/mm/aaaa (corrige «//»); marca años fuera de rango
export function leerFecha(v, anioRef) {
  if (v == null || v === '') return { valor: null };
  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'number') d = new Date(Math.round((v - 25569) * 86400000));
  else {
    const t = String(v).trim().replace(/\/+/g, '/').replace(/-/g, '/');
    const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    const m2 = t.match(/^(\d{1,2})\/(\d{2})(\d{4})$/); // 02/032026
    if (m) d = new Date(Date.UTC(Number(m[3].length === 2 ? '20' + m[3] : m[3]), Number(m[2]) - 1, Number(m[1])));
    else if (m2) d = new Date(Date.UTC(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1])));
    else if (/^\d{4}\/\d{2}\/\d{2}/.test(t)) d = new Date(t.slice(0, 10).replace(/\//g, '-') + 'T00:00:00Z');
    if (d && (typeof v === 'string')) return { valor: isNaN(d) ? null : d.toISOString().slice(0, 10), corregida: String(v) };
  }
  if (!d || isNaN(d)) return { valor: null, invalida: String(v) };
  const iso = d.toISOString().slice(0, 10);
  const y = d.getUTCFullYear();
  return { valor: iso, sospechosa: anioRef && (y < anioRef - 1 || y > anioRef + 1) ? iso : null };
}

const buscarCatalogo = (txt, lista) => {
  const n = norm(txt).replace(/[.]/g, '');
  if (!n) return null;
  return lista.find((x) => norm(x).replace(/[.]/g, '') === n) || lista.find((x) => norm(x).startsWith(n.slice(0, 18)) || n.startsWith(norm(x).slice(0, 18))) || null;
};

const RIESGO = { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };

// sedes: [{ id, nombre }] · mapa: ubicación del archivo (normalizada) -> id de sede elegido por el usuario
export function interpretarFilas({ data, filaCabecera }, { sedes, mapa = {}, anioRef }) {
  const cab = data[filaCabecera].map((c) => norm(c));
  const col = {};
  Object.entries(COLUMNAS).forEach(([k, fn]) => { const i = cab.findIndex((h) => h && fn(h)); if (i >= 0) col[k] = i; });
  const faltan = ['fecha', 'ubicacion', 'descripcion', 'riesgo'].filter((k) => col[k] == null);
  const ubicaciones = new Set();
  const noReconocidas = new Set();
  const filas = [];
  data.slice(filaCabecera + 1).forEach((r, i) => {
    const v = (k) => (col[k] == null ? null : r[col[k]]);
    const desc = String(v('descripcion') ?? '').trim();
    if (!desc || norm(desc).startsWith('DESCRIPCION')) return;
    const errores = []; const avisos = [];
    const fecha = leerFecha(v('fecha'), anioRef);
    const plazo = leerFecha(v('plazo'), anioRef);
    if (!fecha.valor) errores.push(`Fecha inválida: «${fecha.invalida ?? 'vacía'}»`);
    if (fecha.corregida) avisos.push(`Fecha «${fecha.corregida}» leída como ${fecha.valor}`);
    if (fecha.sospechosa) errores.push(`Año de la fecha fuera de rango (${fecha.sospechosa})`);
    if (plazo.corregida) avisos.push(`Plazo «${plazo.corregida}» leído como ${plazo.valor}`);
    if (plazo.sospechosa) avisos.push(`Año del plazo fuera de rango (${plazo.sospechosa}); revísalo`);
    if (!plazo.valor) avisos.push('Sin fecha de plazo');
    if (fecha.valor && plazo.valor && plazo.valor < fecha.valor) avisos.push('El plazo es anterior a la fecha del hallazgo');
    const ubic = norm(v('ubicacion'));
    ubicaciones.add(ubic);
    const sedeAuto = sedes.find((s) => norm(s.nombre) === ubic || norm(s.nombre).endsWith(ubic.replace(/^TALLER /, 'TALLER 0')) || (ubic.match(/TALLER 0?(\d)/) && s.id === `T${ubic.match(/TALLER 0?(\d)/)[1]}`));
    if (!sedeAuto && ubic) noReconocidas.add(ubic);
    const sede = mapa[ubic] || sedeAuto?.id || null;
    if (!sede) errores.push(`Ubicación «${v('ubicacion') ?? ''}» sin sede asignada`);
    const riesgo = RIESGO[norm(v('riesgo'))] || null;
    if (!riesgo) errores.push(`Nivel de riesgo «${v('riesgo') ?? ''}» no reconocido`);
    const clasTxt = norm(v('clasificacion'));
    const clasificacion = clasTxt.startsWith('ACTO') ? 'Acto' : 'Condición';
    const subtipo = buscarCatalogo(v('subtipo'), clasificacion === 'Acto' ? ACTOS : CONDICIONES) || (String(v('subtipo') ?? '').trim() || (clasificacion === 'Acto' ? ACTOS[18] : CONDICIONES[0]));
    let avance = Number(v('avance'));
    avance = isNaN(avance) ? 0 : avance <= 1 ? Math.round(avance * 100) : Math.round(avance);
    const st = norm(v('status'));
    if (st === 'CERRADO') avance = 100;
    const tipoTxt = norm(v('tipoInspeccion'));
    filas.push({
      fila: filaCabecera + 2 + i, errores, avisos,
      h: {
        fecha: fecha.valor, sede, area: String(v('area') ?? '').trim() && norm(v('area')) !== ubic ? String(v('area')).trim() : '',
        tipoInspeccion: tipoTxt.startsWith('INOPINADA') ? 'Inopinada' : tipoTxt.includes('GERENC') ? 'Gerencial' : tipoTxt.includes('COMITE') ? 'Comité SST' : 'Planeada',
        inspector: String(v('realizadaPor') ?? '').trim(),
        clasificacion, subtipo, descripcion: desc, riesgo,
        accion: String(v('accion') ?? '').trim(), responsable: String(v('responsable') ?? '').trim(),
        plazo: plazo.valor || fecha.valor, avance,
        fechaCierre: avance >= 100 ? (plazo.valor && fecha.valor && plazo.valor >= fecha.valor ? plazo.valor : fecha.valor) : null,
        evidencia: avance >= 100 ? 'Importado del archivo de análisis' : null,
      },
    });
  });
  return { faltan, filas, ubicaciones: [...ubicaciones].filter(Boolean), noReconocidas: [...noReconocidas] };
}
