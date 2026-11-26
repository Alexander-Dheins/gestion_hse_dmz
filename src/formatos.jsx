// Definición de los formatos oficiales que genera el sistema.
// Cada función recibe la base de datos y el registro, y devuelve el documento listo para FormatoSheet.
import { fmtFecha, nombreUsuario, nombrePersonal, nombreUnidad, hoy } from './store.jsx';
import { TIPOS_PERMISO, ETIQUETA_FIRMA, CHECKLIST_BASE, ROLES } from './data/seed.js';

const nivel = (p, s) => {
  const v = p * s;
  if (v >= 15) return { v, t: 'Alto', c: 'risk-high' };
  if (v >= 8) return { v, t: 'Medio', c: 'risk-mid' };
  return { v, t: 'Bajo', c: 'risk-low' };
};
const Risk = ({ p, s }) => { const n = nivel(p, s); return <span className={`risk ${n.c}`}>{n.v} {n.t}</span>; };
const Sec = ({ children }) => <div className="fx-sec">{children}</div>;
const lider = (db, unidad) => db.usuarios.find((u) => u.rol === 'lider' && u.unidad === unidad);
const persona = (db, id) => db.usuarios.find((u) => u.id === id);

// ---------- IPERC línea base ----------
export function fmtIpercBase(db, unidad) {
  const filas = db.iperc.filter((x) => x.unidad === unidad);
  const l = lider(db, unidad);
  return {
    codigo: 'DMZ-SSO-F-01', titulo: 'IPERC – LÍNEA BASE', unidad, ref: `IPERC base ${new Date().getFullYear()}`,
    referencia: 'Referencia: D.S. 024-2016-EM, Anexo 7 (formato IPERC) y modificatorias',
    datos: [['Proceso', 'Mantenimiento de equipos de planta concentradora'], ['Fecha de actualización', fmtFecha(hoy())], ['Elaborado por', l ? l.nombre : '—'], ['N.° de peligros evaluados', filas.length]],
    body: (
      <>
        <Sec>MATRIZ DE IDENTIFICACIÓN DE PELIGROS, EVALUACIÓN DE RIESGOS Y CONTROLES</Sec>
        <table className="fx-table fx-small">
          <thead><tr><th>N.°</th><th>Tarea</th><th>Peligro</th><th>Riesgo</th><th>P</th><th>S</th><th>Nivel inicial</th><th>Jerarquía de controles</th><th>P</th><th>S</th><th>Nivel residual</th></tr></thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.id}><td>{i + 1}</td><td>{f.tarea}</td><td>{f.peligro}</td><td>{f.riesgo}</td><td>{f.p}</td><td>{f.s}</td><td><Risk p={f.p} s={f.s} /></td><td>{f.control}</td><td>{f.pr}</td><td>{f.sr}</td><td><Risk p={f.pr} s={f.sr} /></td></tr>
            ))}
          </tbody>
        </table>
        <LeyendaRiesgo />
      </>
    ),
    firmas: [{ rol: 'Elaborado: Líder HSE de unidad', nombre: l?.nombre, firmado: true }, { rol: 'Revisado: Gerente de Seguridad', nombre: nombreUsuario(db, 'u1'), firmado: true }, { rol: 'Aprobado: Gerencia de operaciones', nombre: ' ' }],
  };
}

const LeyendaRiesgo = () => (
  <p className="fx-note">P = probabilidad (1–5) · S = severidad (1–5) · Nivel = P × S: <span className="risk risk-low">1–7 Bajo</span> <span className="risk risk-mid">8–14 Medio</span> <span className="risk risk-high">15–25 Alto</span>. Todo riesgo alto requiere PETAR antes de iniciar.</p>
);

// ---------- IPERC continuo ----------
export function fmtIpercContinuo(db, r) {
  return {
    codigo: 'DMZ-SSO-F-02', titulo: 'IPERC CONTINUO', unidad: r.unidad, ref: r.id,
    referencia: 'Referencia: D.S. 024-2016-EM, Anexo 7 (IPERC continuo, al inicio de cada tarea) y modificatorias',
    datos: [['N.° de registro', r.id], ['Fecha y hora', `${fmtFecha(r.fecha)} ${r.hora || ''}`], ['Área / lugar', r.area], ['Parada', r.paradaId || '—'], ['Tarea', r.tarea], ['Estado', r.estado]],
    body: (
      <>
        <Sec>PELIGROS IDENTIFICADOS Y CONTROLES</Sec>
        <table className="fx-table fx-small">
          <thead><tr><th>N.°</th><th>Peligro</th><th>Riesgo</th><th>Nivel inicial</th><th>Medidas de control</th><th>Nivel residual</th></tr></thead>
          <tbody>{r.peligros.map((p, i) => <tr key={i}><td>{i + 1}</td><td>{p.peligro}</td><td>{p.riesgo}</td><td><Risk p={p.p} s={p.s} /></td><td>{p.medidas}</td><td><Risk p={p.pr} s={p.sr} /></td></tr>)}</tbody>
        </table>
        <LeyendaRiesgo />
        <Sec>TRABAJADORES QUE PARTICIPAN (FIRMA DE CONFORMIDAD)</Sec>
        <table className="fx-table fx-small">
          <thead><tr><th>N.°</th><th>Código</th><th>Apellidos y nombres</th><th>Cargo</th><th>Firma</th></tr></thead>
          <tbody>{r.trabajadores.map((t, i) => { const w = db.personal.find((x) => x.id === t); return <tr key={t}><td>{i + 1}</td><td>{t}</td><td>{w?.nombre}</td><td>{w?.cargo}</td><td className="fx-sign-cell">Firmado en app</td></tr>; })}</tbody>
        </table>
      </>
    ),
    firmas: [{ rol: 'Responsable del trabajo', nombre: nombreUsuario(db, r.responsable), fecha: r.fecha, firmado: true }, { rol: 'Supervisor HSE (validación)', nombre: nombreUsuario(db, r.supervisor), fecha: r.fecha, firmado: r.estado === 'Validado' }],
  };
}

// ---------- PETAR / LOTO ----------
export function fmtPermiso(db, p) {
  const par = db.paradas.find((x) => x.id === p.paradaId);
  const loto = p.tipo === 'LOTO';
  return {
    codigo: loto ? 'DMZ-SSO-F-04' : 'DMZ-SSO-F-03', titulo: loto ? 'PERMISO DE BLOQUEO Y ETIQUETADO (LOTO)' : `PERMISO ESCRITO DE TRABAJO DE ALTO RIESGO (PETAR)`, unidad: p.unidad, ref: p.id,
    referencia: 'Referencia: D.S. 024-2016-EM (trabajos de alto riesgo) y estándar de la unidad minera',
    datos: [['N.° de permiso', p.id], ['Tipo', TIPOS_PERMISO[p.tipo]], ['Fecha', fmtFecha(p.fecha)], ['Estado', p.estado], ['Equipo / parada', par ? `${par.equipo} · ${par.id}` : p.paradaId], ['Horario', '07:00 – 18:00']],
    body: (
      <>
        <Sec>DESCRIPCIÓN DEL TRABAJO</Sec>
        <p className="fx-p">{p.tarea}</p>
        {p.puntos && (
          <>
            <Sec>PUNTOS DE BLOQUEO Y VERIFICACIÓN DE ENERGÍA CERO</Sec>
            <table className="fx-table fx-small"><thead><tr><th>Equipo</th><th>Tipo de energía</th><th>N.° candado</th><th>Verificado en cero</th></tr></thead>
              <tbody>{p.puntos.map((x, i) => <tr key={i}><td>{x.equipo}</td><td>{x.energia}</td><td>{x.candado}</td><td>{x.verificado ? 'Sí' : 'No'}</td></tr>)}</tbody></table>
          </>
        )}
        {p.gases && (
          <>
            <Sec>MONITOREO DE ATMÓSFERA ANTES DEL INGRESO</Sec>
            <table className="fx-table fx-small"><thead><tr><th>O₂ (19.5–23.5 %)</th><th>LEL (&lt; 10 %)</th><th>CO (&lt; 25 ppm)</th><th>H₂S (&lt; 10 ppm)</th><th>Vigía</th></tr></thead>
              <tbody><tr><td>{p.gases.o2}</td><td>{p.gases.lel}</td><td>{p.gases.co}</td><td>{p.gases.h2s}</td><td>{p.vigia ? nombrePersonal(db, p.vigia) : '—'}</td></tr></tbody></table>
          </>
        )}
        {p.izaje && (
          <>
            <Sec>DATOS DEL IZAJE</Sec>
            <table className="fx-table fx-small"><thead><tr><th>Peso de la carga</th><th>Capacidad de la grúa</th><th>Radio</th><th>% de capacidad</th></tr></thead>
              <tbody><tr><td>{p.izaje.carga}</td><td>{p.izaje.capacidad}</td><td>{p.izaje.radio}</td><td>{p.izaje.porcentaje}</td></tr></tbody></table>
          </>
        )}
        <Sec>VERIFICACIÓN PREVIA</Sec>
        <table className="fx-table fx-small fx-check">
          <tbody>
            {['IPERC continuo realizado y firmado por todos', 'PETS de la tarea revisado con el personal', 'Personal acreditado (EMO, SCTR, inducción) vigente', 'EPP específico para la tarea completo', 'Área señalizada y delimitada', 'Equipos y herramientas inspeccionados'].map((x) => <tr key={x}><td>{x}</td><td className="fx-mark">Sí ☑</td></tr>)}
          </tbody>
        </table>
      </>
    ),
    firmas: p.firmas.map((f) => ({ rol: ETIQUETA_FIRMA[f.rol], nombre: f.userId ? nombreUsuario(db, f.userId) : '', fecha: f.fecha, firmado: !!f.userId })),
  };
}

// ---------- Inspección ----------
export function fmtInspeccion(db, x) {
  const items = x.items || CHECKLIST_BASE.map((item, i) => ({ item, r: i < x.hallazgos ? 'no' : 'cumple', obs: i < x.hallazgos ? 'Hallazgo registrado – ver plan de acción' : '' }));
  const planes = db.planes.filter((p) => p.origen === x.id);
  return {
    codigo: 'DMZ-SSO-F-05', titulo: 'REGISTRO DE INSPECCIÓN DE SEGURIDAD', unidad: x.unidad, ref: x.id,
    datos: [['N.° de inspección', x.id], ['Tipo', x.tipo], ['Fecha', fmtFecha(x.fecha)], ['Parada', x.paradaId || '—'], ['Inspector', nombreUsuario(db, x.inspector)], ['Cumplimiento', `${x.cumplimiento} %`]],
    body: (
      <>
        <Sec>LISTA DE VERIFICACIÓN</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Ítem</th><th>Cumple</th><th>No cumple</th><th>N/A</th><th>Observación</th></tr></thead>
          <tbody>{items.map((it, i) => <tr key={i}><td>{i + 1}</td><td>{it.item}</td><td className="fx-mark">{it.r === 'cumple' ? 'X' : ''}</td><td className="fx-mark">{it.r === 'no' ? 'X' : ''}</td><td className="fx-mark">{it.r === 'na' ? 'X' : ''}</td><td>{it.obs}</td></tr>)}</tbody></table>
        <Sec>ACCIONES CORRECTIVAS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Acción</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead>
          <tbody>{planes.length ? planes.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.descripcion}</td><td>{nombreUsuario(db, p.responsable)}</td><td>{fmtFecha(p.vence)}</td><td>{p.estado}</td></tr>) : <tr><td colSpan="5">Sin acciones correctivas</td></tr>}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Inspector', nombre: nombreUsuario(db, x.inspector), fecha: x.fecha, firmado: true }, { rol: 'Responsable del área', nombre: nombreUsuario(db, 'u7'), firmado: true }],
  };
}

// ---------- Incidente ----------
export function fmtIncidente(db, x) {
  const planes = db.planes.filter((p) => p.origen === x.id);
  const par = db.paradas.find((p) => p.id === x.paradaId);
  return {
    codigo: 'DMZ-SSO-F-06', titulo: x.estado === 'Cerrado' ? 'INFORME DE INVESTIGACIÓN DE INCIDENTE / ACCIDENTE' : 'REPORTE PRELIMINAR DE INCIDENTE / ACCIDENTE', unidad: x.unidad, ref: x.id,
    referencia: 'Referencia: D.S. 024-2016-EM (notificación, investigación y reporte de incidentes y accidentes)',
    datos: [['N.° de evento', x.id], ['Clasificación', x.tipo], ['Fecha del evento', fmtFecha(x.fecha)], ['Lugar / equipo', par ? par.equipo : 'Planta concentradora'], ['Reportado por', nombreUsuario(db, x.reportadoPor)], ['Días perdidos', x.diasPerdidos]],
    body: (
      <>
        <Sec>DESCRIPCIÓN DEL EVENTO</Sec>
        <p className="fx-p">{x.descripcion}</p>
        <Sec>ANÁLISIS DE CAUSAS</Sec>
        <table className="fx-table fx-small"><tbody>
          <tr><th>Causa inmediata</th><td>{x.tipo.startsWith('Accidente') ? 'Acto subestándar durante la manipulación' : 'Condición subestándar en el área de trabajo'}</td></tr>
          <tr><th>Causa básica / raíz</th><td>{x.causaRaiz || 'En investigación'}</td></tr>
          <tr><th>Notificación a la unidad</th><td>Dentro de las 24 h, vía sistema</td></tr>
        </tbody></table>
        <Sec>MEDIDAS CORRECTIVAS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Medida</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead>
          <tbody>{planes.length ? planes.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.descripcion}</td><td>{nombreUsuario(db, p.responsable)}</td><td>{fmtFecha(p.vence)}</td><td>{p.estado}</td></tr>) : <tr><td colSpan="5">Pendiente de definir</td></tr>}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Reportado por', nombre: nombreUsuario(db, x.reportadoPor), fecha: x.fecha, firmado: true }, { rol: 'Líder HSE de unidad', nombre: lider(db, x.unidad)?.nombre || '', firmado: x.estado === 'Cerrado' }, { rol: 'Gerente de Seguridad', nombre: nombreUsuario(db, 'u1'), firmado: x.estado === 'Cerrado' }],
  };
}

// ---------- EPP ----------
export function fmtEpp(db, unidad) {
  const lista = db.epp.filter((e) => e.unidad === unidad);
  return {
    codigo: 'DMZ-SSO-F-07', titulo: 'REGISTRO DE ENTREGA DE EQUIPOS DE PROTECCIÓN PERSONAL', unidad, ref: 'EPP',
    datos: [['Periodo', new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })], ['N.° de entregas', lista.length]],
    body: (
      <>
        <Sec>DETALLE DE ENTREGAS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Fecha</th><th>Trabajador</th><th>EPP entregado</th><th>Cant.</th><th>Motivo</th><th>Firma del trabajador</th></tr></thead>
          <tbody>{lista.map((e, i) => <tr key={e.id}><td>{i + 1}</td><td>{fmtFecha(e.fecha)}</td><td>{nombrePersonal(db, e.personalId)}</td><td>{e.item}</td><td>1</td><td>Renovación</td><td className="fx-sign-cell">{e.firmado ? 'Firmado en tablet' : 'Pendiente'}</td></tr>)}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Entregado por: Asistente HSE', nombre: nombreUsuario(db, 'u5'), firmado: true }],
  };
}

// ---------- Asistencia a capacitación ----------
export function fmtAsistencia(db, c) {
  const asist = db.personal.filter((p) => p.unidad === c.unidad).slice(0, Math.max(c.asistentes, 6));
  return {
    codigo: 'DMZ-SSO-F-08', titulo: 'REGISTRO DE ASISTENCIA A CAPACITACIÓN / INDUCCIÓN', unidad: c.unidad, ref: c.id,
    datos: [['Tema', c.tema], ['Fecha', fmtFecha(c.fecha)], ['Duración', `${c.horas} horas`], ['Expositor', nombreUsuario(db, lider(db, c.unidad)?.id || 'u2')], ['Modalidad', 'Presencial'], ['Tipo', 'Capacitación básica en SSO']],
    body: (
      <>
        <Sec>PARTICIPANTES</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Código</th><th>Apellidos y nombres</th><th>Cargo</th><th>Nota</th><th>Firma</th></tr></thead>
          <tbody>{asist.map((w, i) => <tr key={w.id}><td>{i + 1}</td><td>{w.id}</td><td>{w.nombre}</td><td>{w.cargo}</td><td>{c.estado === 'Ejecutada' ? 14 + (i % 6) : ''}</td><td className="fx-sign-cell">{c.estado === 'Ejecutada' ? 'Firmado' : ''}</td></tr>)}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Expositor', nombre: lider(db, c.unidad)?.nombre || '', firmado: c.estado === 'Ejecutada' }, { rol: 'Asistente HSE', nombre: nombreUsuario(db, 'u5'), firmado: c.estado === 'Ejecutada' }],
  };
}

// ---------- Acta del comité ----------
export function fmtActa(db, a) {
  return {
    codigo: 'DMZ-SSO-F-09', titulo: 'ACTA DE REUNIÓN DEL COMITÉ DE SEGURIDAD Y SALUD OCUPACIONAL', unidad: null, ref: a.id,
    referencia: 'Referencia: D.S. 024-2016-EM (Comité de SSO) y Ley 29783',
    datos: [['Sesión', a.sesion], ['Fecha', fmtFecha(a.fecha)], ['Lugar', a.lugar], ['Quórum', `${a.asistentes.length} miembros presentes`]],
    body: (
      <>
        <Sec>ASISTENTES</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Nombre</th><th>Cargo</th><th>Firma</th></tr></thead>
          <tbody>{a.asistentes.map((id, i) => { const u = persona(db, id); return <tr key={id}><td>{i + 1}</td><td>{u?.nombre}</td><td>{u?.cargo}</td><td className="fx-sign-cell">Firmado</td></tr>; })}</tbody></table>
        <Sec>AGENDA</Sec>
        <ol className="fx-ol">{a.agenda.map((x) => <li key={x}>{x}</li>)}</ol>
        <Sec>ACUERDOS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Acuerdo</th><th>Responsable</th><th>Plazo</th></tr></thead>
          <tbody>{a.acuerdos.map((x, i) => <tr key={i}><td>{i + 1}</td><td>{x.acuerdo}</td><td>{nombreUsuario(db, x.responsable)}</td><td>{fmtFecha(x.plazo)}</td></tr>)}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Presidente del comité', nombre: nombreUsuario(db, 'u1'), firmado: true }, { rol: 'Secretario', nombre: nombreUsuario(db, 'u6'), firmado: true }],
  };
}

// ---------- Auditoría ----------
export function fmtAuditoria(db, a) {
  return {
    codigo: 'DMZ-SSO-F-10', titulo: 'INFORME DE AUDITORÍA SSOMA', unidad: a.unidad, ref: a.id,
    datos: [['Código', a.id], ['Tipo', a.tipo], ['Fecha', fmtFecha(a.fecha)], ['Auditor líder', nombreUsuario(db, a.auditor)], ['Alcance', a.alcance], ['Resultado', `${a.resultado} %`]],
    body: (
      <>
        <Sec>HALLAZGOS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>N.°</th><th>Tipo</th><th>Descripción</th><th>Estado</th></tr></thead>
          <tbody>{a.hallazgos.map((h, i) => <tr key={i}><td>{i + 1}</td><td>{h.tipo}</td><td>{h.descripcion}</td><td>{h.estado}</td></tr>)}</tbody></table>
        <Sec>CONCLUSIÓN</Sec>
        <p className="fx-p">El sistema de gestión SSOMA en el alcance auditado alcanza un cumplimiento de {a.resultado} %. Los hallazgos abiertos tienen planes de acción asignados con responsable y plazo.</p>
      </>
    ),
    firmas: [{ rol: 'Auditor líder', nombre: nombreUsuario(db, a.auditor), firmado: true }, { rol: 'Gerente de Seguridad', nombre: nombreUsuario(db, 'u1'), firmado: true }],
  };
}

// ---------- Monitoreo de agentes ----------
export function fmtMonitoreo(db, unidad) {
  const lista = db.monitoreos.filter((m) => m.unidad === unidad);
  return {
    codigo: 'DMZ-SSO-F-11', titulo: 'REGISTRO DE MONITOREO DE AGENTES OCUPACIONALES', unidad, ref: 'Monitoreos',
    datos: [['Laboratorio', lista[0]?.laboratorio || '—'], ['N.° de puntos', lista.length]],
    body: (
      <>
        <Sec>RESULTADOS</Sec>
        <table className="fx-table fx-small"><thead><tr><th>Código</th><th>Agente</th><th>Puesto evaluado</th><th>Resultado</th><th>Límite</th><th>Condición</th><th>Fecha</th></tr></thead>
          <tbody>{lista.map((m) => { const excede = m.inverso ? m.valor < m.lmp : m.valor > m.lmp; return <tr key={m.id}><td>{m.id}</td><td>{m.agente}</td><td>{m.puesto}</td><td>{m.valor} {m.unidad_medida}</td><td>{m.lmp} {m.unidad_medida}</td><td>{excede ? 'Excede' : 'Dentro del límite'}</td><td>{fmtFecha(m.fecha)}</td></tr>; })}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Médico ocupacional', nombre: nombreUsuario(db, 'u8'), firmado: true }],
  };
}

// ---------- Residuos ----------
export function fmtResiduos(db, unidad) {
  const lista = db.residuos.filter((r) => r.unidad === unidad);
  return {
    codigo: 'DMZ-SSO-F-12', titulo: 'REGISTRO DE GENERACIÓN Y DISPOSICIÓN DE RESIDUOS', unidad, ref: 'Residuos',
    datos: [['Periodo', new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })], ['N.° de registros', lista.length]],
    body: (
      <>
        <Sec>DETALLE</Sec>
        <table className="fx-table fx-small"><thead><tr><th>Fecha</th><th>Residuo</th><th>Tipo</th><th>Cantidad</th><th>Contenedor</th><th>Disposición</th><th>Manifiesto</th></tr></thead>
          <tbody>{lista.map((r) => <tr key={r.id}><td>{fmtFecha(r.fecha)}</td><td>{r.residuo}</td><td>{r.tipo}</td><td>{r.cantidad} {r.medida}</td><td>{r.contenedor}</td><td>{r.disposicion}</td><td>{r.manifiesto}</td></tr>)}</tbody></table>
      </>
    ),
    firmas: [{ rol: 'Supervisor HSE', nombre: nombreUsuario(db, 'u4'), firmado: true }, { rol: 'Líder HSE de unidad', nombre: lider(db, unidad)?.nombre || '', firmado: true }],
  };
}

// ---------- Derrame ----------
export function fmtDerrame(db, d) {
  return {
    codigo: 'DMZ-SSO-F-13', titulo: 'REPORTE DE DERRAME', unidad: d.unidad, ref: d.id,
    datos: [['N.° de reporte', d.id], ['Fecha', fmtFecha(d.fecha)], ['Sustancia', d.sustancia], ['Volumen', d.volumen], ['Superficie afectada', d.superficie], ['Estado', d.estado]],
    body: (
      <>
        <Sec>ACCIONES DE CONTENCIÓN Y LIMPIEZA</Sec>
        <p className="fx-p">{d.contencion}</p>
        <Sec>CAUSA</Sec>
        <p className="fx-p">{d.causa}</p>
      </>
    ),
    firmas: [{ rol: 'Reportado por: Supervisor HSE', nombre: nombreUsuario(db, 'u4'), firmado: true }, { rol: 'Líder HSE de unidad', nombre: lider(db, d.unidad)?.nombre || '', firmado: d.estado === 'Cerrado' }],
  };
}

// ---------- Gestión del cambio ----------
export function fmtCambio(db, c) {
  return {
    codigo: 'DMZ-SSO-F-14', titulo: 'SOLICITUD Y EVALUACIÓN DE GESTIÓN DEL CAMBIO', unidad: c.unidad, ref: c.id,
    datos: [['N.° de solicitud', c.id], ['Fecha', fmtFecha(c.fecha)], ['Tipo de cambio', c.tipo], ['Estado', c.estado]],
    body: (
      <>
        <Sec>DESCRIPCIÓN DEL CAMBIO</Sec>
        <p className="fx-p">{c.cambio}</p>
        <Sec>RIESGOS IDENTIFICADOS</Sec>
        <p className="fx-p">{c.riesgos}</p>
        <Sec>REQUISITOS PARA IMPLEMENTAR</Sec>
        <ol className="fx-ol"><li>Actualizar IPERC base y PETS de la tarea</li><li>Capacitar al personal involucrado</li><li>Verificación en campo antes de la primera ejecución</li></ol>
      </>
    ),
    firmas: [{ rol: 'Solicitante', nombre: nombreUsuario(db, 'u7'), firmado: true }, { rol: 'Aprobador', nombre: c.aprobador ? nombreUsuario(db, c.aprobador) : '', firmado: !!c.aprobador }],
  };
}

// ---------- Catálogo con ejemplos ----------
export const CATALOGO = [
  { codigo: 'DMZ-SSO-F-01', titulo: 'IPERC – Línea base', modulo: 'IPERC', uso: 'Matriz anual de peligros por tarea; se presenta a la unidad y en auditorías.', ejemplo: (db) => fmtIpercBase(db, 'UM1') },
  { codigo: 'DMZ-SSO-F-02', titulo: 'IPERC continuo', modulo: 'IPERC', uso: 'Se llena al inicio de cada tarea en campo; lo firman todos los trabajadores.', ejemplo: (db) => fmtIpercContinuo(db, db.ipercContinuo[0]) },
  { codigo: 'DMZ-SSO-F-03', titulo: 'PETAR – Permiso de trabajo de alto riesgo', modulo: 'Permisos', uso: 'Espacio confinado, caliente, izaje y altura, con firmas por rol.', ejemplo: (db) => fmtPermiso(db, db.permisos.find((p) => p.tipo === 'EC') || db.permisos[0]) },
  { codigo: 'DMZ-SSO-F-04', titulo: 'Permiso de bloqueo y etiquetado (LOTO)', modulo: 'Permisos', uso: 'Puntos de bloqueo, candados y verificación de energía cero.', ejemplo: (db) => fmtPermiso(db, db.permisos.find((p) => p.tipo === 'LOTO') || db.permisos[0]) },
  { codigo: 'DMZ-SSO-F-05', titulo: 'Registro de inspección', modulo: 'Inspecciones', uso: 'Lista de verificación con hallazgos y acciones correctivas.', ejemplo: (db) => fmtInspeccion(db, db.inspecciones[0]) },
  { codigo: 'DMZ-SSO-F-06', titulo: 'Reporte e informe de investigación de incidentes', modulo: 'Incidentes', uso: 'Reporte preliminar y, al cerrar, informe con causa raíz y medidas.', ejemplo: (db) => fmtIncidente(db, db.incidentes.find((i) => i.estado === 'Cerrado') || db.incidentes[0]) },
  { codigo: 'DMZ-SSO-F-07', titulo: 'Registro de entrega de EPP', modulo: 'EPP', uso: 'Entregas del mes con firma de cada trabajador.', ejemplo: (db) => fmtEpp(db, 'UM1') },
  { codigo: 'DMZ-SSO-F-08', titulo: 'Registro de asistencia a capacitación', modulo: 'Capacitaciones', uso: 'Lista de participantes, notas y firmas.', ejemplo: (db) => fmtAsistencia(db, db.capacitaciones[0]) },
  { codigo: 'DMZ-SSO-F-09', titulo: 'Acta del comité SSO', modulo: 'Gestión', uso: 'Asistentes, agenda y acuerdos de cada sesión.', ejemplo: (db) => fmtActa(db, db.actas[0]) },
  { codigo: 'DMZ-SSO-F-10', titulo: 'Informe de auditoría', modulo: 'Gestión', uso: 'Alcance, resultado y hallazgos de auditorías internas y del titular.', ejemplo: (db) => fmtAuditoria(db, db.auditorias[0]) },
  { codigo: 'DMZ-SSO-F-11', titulo: 'Monitoreo de agentes ocupacionales', modulo: 'Salud', uso: 'Resultados de ruido, polvo, gases y otros frente a sus límites.', ejemplo: (db) => fmtMonitoreo(db, 'UM1') },
  { codigo: 'DMZ-SSO-F-12', titulo: 'Control de residuos', modulo: 'Medio ambiente', uso: 'Generación, segregación y disposición con manifiesto.', ejemplo: (db) => fmtResiduos(db, 'UM1') },
  { codigo: 'DMZ-SSO-F-13', titulo: 'Reporte de derrame', modulo: 'Medio ambiente', uso: 'Sustancia, volumen, contención y causa.', ejemplo: (db) => fmtDerrame(db, db.derrames[0]) },
  { codigo: 'DMZ-SSO-F-14', titulo: 'Gestión del cambio', modulo: 'Gestión', uso: 'Evaluación de riesgos antes de cambiar un método, equipo o procedimiento.', ejemplo: (db) => fmtCambio(db, db.cambios[0]) },
];

export { ROLES, nombreUnidad };
